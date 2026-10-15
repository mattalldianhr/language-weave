"""Step 3+4: deterministic swapper over the corpus, candidate generation and filters F0-F2.

Usage:
  python3 -I swapper.py --wiki-dir D --pages-dir D --lexicon lexicon.json --packs-dir packs \
      --out-dir <scratch run dir> [--model en_core_web_md]

Writes into --out-dir:
  sentences.jsonl          {sid, doc, source, text, n_words}
  candidates-<lang>.jsonl  one row per candidate (see make_candidate)
  skips-<lang>.json        per-doc skip reasons, verb-form exposure, German case exposure
  stats.json               per-doc word counts, timing (spaCy words/sec)

Rules (class / rule tags):
  ADV / ADV-tok, CONN / CONN-tok : swap the token.
  NOUN / N-bare                  : every pack noun, bare swap with number.
  NOUN / N-det                   : exactly det(the/a/an)+noun -> target article + noun
                                   (de: article by gender, number AND case from the role).
  NOUN / N-adj                   : det + pack adjective + noun -> whole NP with agreement + order.
  ADJ  / ADJ-pred                : predicative adjective after be/seem/look/... with it/this/that
                                   or a pack-noun subject of known gender.
  VERB / V-inf                   : base form after "to" or a modal -> infinitive.
  VERB / V-pres                  : present with an explicit pronoun subject within 2 tokens.
  PHRASE / PHRASE                : exact match on the phrase list.
  (any) / F0-lemma               : F0-only naive lemma match where spaCy POS != pack POS.
Never inside proper nouns, entities, numbers, URLs, code-like tokens, quotes, title-case runs,
hyphenated compounds.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from exp_common import (ARTICLES, CONNECTORS, DE_DEF, DE_IND, DE_PREP, DE_WEAK_ADJ, LANGS, MODALS,  # noqa: E402
                        PHRASES, PRENOMINAL_ES, PRENOMINAL_FR, SUBJ_PRON, load_corpus, write_jsonl)

ENT_SKIP = {"PERSON", "ORG", "GPE", "LOC", "NORP", "FAC", "PRODUCT", "EVENT", "WORK_OF_ART", "LAW", "LANGUAGE"}
COPULAS = {"be", "seem", "look", "become", "appear", "feel", "remain", "stay", "get"}
QUOTE_OPEN = "\"“‘'"
DE_MIXED_ADJ = {("m", "sg", "NOM"): "er", ("m", "sg", "ACC"): "en", ("f", "sg", "NOM"): "e", ("f", "sg", "ACC"): "e",
                ("n", "sg", "NOM"): "es", ("n", "sg", "ACC"): "es"}
ES_APOCOPE = {"grande": "gran", "bueno": "buen", "malo": "mal", "primero": "primer", "tercero": "tercer",
              "alguno": "algún", "ninguno": "ningún"}
FR_VOWEL_FORMS = {"beau": "bel", "nouveau": "nouvel", "vieux": "vieil"}


def quote_spans(text: str) -> list[tuple[int, int]]:
    """Spans of quoted text in a paragraph. An unpaired opening quote runs to the end."""
    spans = []
    idx = [m.start() for m in re.finditer(r'"', text)]
    for i in range(0, len(idx) - 1, 2):
        spans.append((idx[i], idx[i + 1] + 1))
    if len(idx) % 2 == 1:
        spans.append((idx[-1], len(text)))
    for m in re.finditer(r"“[^”]*(?:”|$)", text, flags=re.S):
        spans.append((m.start(), m.end()))
    for m in re.finditer(r"‘[^’]*(?:’|$)", text, flags=re.S):
        spans.append((m.start(), m.end()))
    return spans


def in_spans(a: int, b: int, spans) -> bool:
    return any(a >= s and b <= e for s, e in spans)


def title_runs(sent) -> set[int]:
    """Token indices inside runs of >=2 consecutive capitalized tokens (titles / names)."""
    out: set[int] = set()
    toks = list(sent)
    i = 0
    while i < len(toks):
        if toks[i].text[:1].isupper() and toks[i].is_alpha:
            j = i
            while j + 1 < len(toks) and toks[j + 1].is_alpha and toks[j + 1].text[:1].isupper():
                j += 1
            if j > i:
                for k in range(i, j + 1):
                    out.add(toks[k].i)
            i = j + 1
        else:
            i += 1
    return out


def is_hyphenated(tok) -> bool:
    doc = tok.doc
    if tok.i > 0:
        p = doc[tok.i - 1]
        if p.text == "-" and not p.whitespace_ and not doc[tok.i - 2].whitespace_ if tok.i > 1 else False:
            return True
    if tok.i + 1 < len(doc):
        n = doc[tok.i + 1]
        if n.text == "-" and not tok.whitespace_ and not n.whitespace_:
            return True
    return False


def basic_excluded(tok, sent, qspans, truns) -> str | None:
    if not tok.is_alpha:
        return "non_alpha"
    if tok.pos_ == "PROPN" or tok.ent_type_ in ENT_SKIP:
        return "proper_noun"
    if tok.i in truns:
        return "title_run"
    if tok.text[:1].isupper() and tok.i != sent.start and tok.text.lower() != "i":
        return "capitalized_mid_sentence"
    if tok.like_num or tok.like_url or tok.like_email:
        return "number_url"
    if "_" in tok.text or re.search(r"[a-z][A-Z]", tok.text):
        return "code_like"
    if is_hyphenated(tok):
        return "hyphenated"
    if in_spans(tok.idx, tok.idx + len(tok.text), qspans):
        return "in_quote"
    return None


def cap_like(src: str, tgt: str) -> str:
    if src[:1].isupper() and tgt and tgt[:1].islower():
        return tgt[0].upper() + tgt[1:]
    return tgt


def fr_elide(article: str, noun: str) -> str:
    if article in ("le", "la") and noun[:1].lower() in "aeiouhâéèêàôûîï":
        return "l'" + noun
    return article + " " + noun


def es_apocope(adj: str, noun_num: str, gender: str) -> str:
    if noun_num == "sg" and adj in ES_APOCOPE:
        if adj == "grande" or gender == "m":
            return ES_APOCOPE[adj]
    return adj


def fr_adj_form(adj_entry: dict, gender: str, number: str, noun: str) -> str:
    key = f"{gender}_{number}"
    form = adj_entry["adj_forms"][key]
    if gender == "m" and number == "sg" and form in FR_VOWEL_FORMS and noun[:1].lower() in "aeiouhâéèêàôûîï":
        form = FR_VOWEL_FORMS[form]
    return form


class Swapper:
    def __init__(self, lang: str, pack: dict, lexicon: dict):
        self.lang = lang
        self.pack = pack["entries"]
        syn = {}
        for r in lexicon["content"]:
            for p in r["pos"]:
                syn[f"{r['lemma']}|{p}"] = r["synsets"].get(p, 0)
        for r in lexicon["connectors"]:
            syn[f"{r['lemma']}|CONJ"] = r["synsets"].get("CONJ", 0)
        self.syn = syn
        # lemma -> list of (pos, corpus count) for F0 naive matching
        self.lemma_entries: dict[str, list[tuple[str, int]]] = defaultdict(list)
        for r in lexicon["content"]:
            for p in r["pos"]:
                if f"{r['lemma']}|{p}" in self.pack:
                    self.lemma_entries[r["lemma"]].append((p, r.get("corpus_pos_counts", {}).get(p, 0)))
        for w in CONNECTORS:
            if f"{w}|CONJ" in self.pack:
                self.lemma_entries[w].append(("CONJ", 0))
        self.phrases = {p: self.pack[f"{p}|PHRASE"] for p in PHRASES if f"{p}|PHRASE" in self.pack}
        self.max_phrase_len = max((len(p.split()) for p in self.phrases), default=0)

    def entry(self, lemma: str, pos: str) -> dict | None:
        return self.pack.get(f"{lemma}|{pos}")

    # ---- form helpers --------------------------------------------------
    def noun_form(self, e: dict, number: str, case: str = "NOM") -> str:
        if self.lang == "de":
            if number == "sg" and case == "GEN":
                return e.get("genitive_sg") or e["target"]
            if number == "pl" and case == "DAT":
                return e.get("dative_pl") or e["plural"]
        return e["plural"] if number == "pl" else e["target"]

    def forms_of(self, e: dict) -> list[str]:
        """All inflected forms of a pack entry (for the NMT check)."""
        pos = e["pos"]
        out = [e["target"]]
        if pos == "NOUN":
            out += [e.get("plural", ""), e.get("genitive_sg", ""), e.get("dative_pl", "")]
        elif pos == "ADJ":
            f = e.get("adj_forms", {})
            if self.lang == "de":
                stem = f.get("stem", e["target"])
                out += [f.get("base", "")] + [stem + end for end in ("e", "en", "er", "es", "em")]
            else:
                out += list(f.values())
        elif pos == "VERB":
            out += [e.get("infinitive", "")] + list(e.get("present", {}).values())
        return [x for x in out if x]

    def prenominal(self, lemma: str, e: dict) -> bool:
        if self.lang == "de":
            return True
        hand = PRENOMINAL_ES if self.lang == "es" else PRENOMINAL_FR
        return bool(e.get("prenominal")) or lemma in hand

    # ---- German case ---------------------------------------------------
    def de_role(self, tok) -> tuple[str, str, str]:
        """Return (role, case, prep) for a noun token. case in NOM/ACC/DAT/GEN/ambiguous/unsupported."""
        t = tok
        hops = 0
        while t.dep_ == "conj" and hops < 4:
            t = t.head
            hops += 1
        dep = t.dep_
        if dep in ("nsubj", "nsubjpass"):
            return "subject", "NOM", ""
        if dep in ("dobj", "obj"):
            return "direct_object", "ACC", ""
        if dep == "attr":
            return "predicate_nominative", "NOM", ""
        if dep == "dative":
            return "indirect_object", "DAT", ""
        if dep == "poss":
            return "possessive", "skip", ""
        if dep == "pobj":
            prep = t.head.text.lower()
            if t.head.pos_ != "ADP":
                return "pobj_nonprep", "unsupported", prep
            if prep in DE_PREP:
                de_prep, case = DE_PREP[prep]
                if case is None:
                    return "prep_two_way", "ambiguous", prep
                return "prep_" + prep, case, prep
            return "prep_unmapped", "unsupported", prep
        return "other_" + dep, "unsupported", ""

    # ---- candidate construction ---------------------------------------
    def make(self, sent, sid: str, doc_id: str, cls: str, rule: str, span, target: str,
             lemma: str, pos: str, entries: list[dict], meta: dict | None = None, f0_only=False) -> dict:
        start = span[0].idx - sent.start_char
        end = span[-1].idx + len(span[-1].text) - sent.start_char
        text = sent.text
        english = text[start:end]
        target = cap_like(english, target)
        swapped = text[:start] + target + text[end:]
        keys = [f"{e['lemma']}|{e['pos']}" for e in entries]
        dominant = all(bool(e.get("dominant_sense_covers_90pct")) for e in entries)
        syn = max((self.syn.get(k, 0) for k in keys), default=0)
        forms = []
        for e in entries:
            forms.append(self.forms_of(e))
        gloss = "; ".join(f"{e['lemma']} ({e['pos'].lower()}) = {e['target']}: {e.get('english_sense', '')}" for e in entries)
        return {
            "sid": sid, "doc": doc_id, "lang": self.lang, "class": cls, "rule": rule,
            "start": start, "end": end, "english": english, "target": target,
            "lemma": lemma, "spacy_pos": pos, "tag": span[-1].tag_ if cls != "PHRASE" else "",
            "pack_keys": keys, "gloss": gloss, "sentence": text, "swapped": swapped,
            "f0_only": f0_only, "f1": not f0_only, "f2": (not f0_only) and dominant,
            "f2_syn3": (not f0_only) and syn <= 3, "f2_syn5": (not f0_only) and syn <= 5,
            "synsets": syn, "nmt_forms": forms, "meta": meta or {},
        }

    def process_sentence(self, sent, sid: str, doc_id: str, skips: Counter, verb_forms: Counter,
                         de_case: Counter, adj_exposure: Counter) -> list[dict]:
        cands: list[dict] = []
        qspans = quote_spans(sent.doc.text)  # paragraph-level, doc offsets
        truns = title_runs(sent)
        covered: set[int] = set()
        is_question = sent.text.rstrip().endswith("?")

        # --- phrases first
        toks = list(sent)
        lowers = [t.text.lower() for t in toks]
        i = 0
        while i < len(toks):
            hit = None
            for n in range(min(self.max_phrase_len, len(toks) - i), 1, -1):
                ph = " ".join(lowers[i:i + n])
                if ph in self.phrases:
                    hit = (n, ph)
                    break
            if hit:
                n, ph = hit
                span = toks[i:i + n]
                if any(basic_excluded(t, sent, qspans, truns) for t in span):
                    skips["phrase_excluded_zone"] += 1
                else:
                    e = self.phrases[ph]
                    cands.append(self.make(sent, sid, doc_id, "PHRASE", "PHRASE", span, e["target"], ph, "PHRASE", [e]))
                    covered.update(t.i for t in span)
                i += n
            else:
                i += 1

        for tok in toks:
            if tok.i in covered:
                continue
            lemma = tok.lemma_.lower()
            lw = tok.text.lower()
            pos = tok.pos_
            ex = basic_excluded(tok, sent, qspans, truns)
            # F0 naive candidate: lemma/surface matches a pack lemma, POS does NOT match
            if ex is None:
                pos_entries = self.lemma_entries.get(lemma) or self.lemma_entries.get(lw)
                if pos_entries:
                    pos_ok = any(p == pos or (p == "CONJ" and lw in CONNECTORS and pos in CONNECTORS[lw]) for p, _ in pos_entries)
                    if not pos_ok:
                        p0 = max(pos_entries, key=lambda x: x[1])[0]
                        key_lemma = lemma if lemma in self.lemma_entries else lw
                        e = self.entry(key_lemma, p0)
                        if e:
                            cls = "CONN" if p0 == "CONJ" else p0
                            cands.append(self.make(sent, sid, doc_id, cls, "F0-lemma", [tok], e["target"],
                                                   key_lemma, pos, [e], {"pack_pos": p0}, f0_only=True))
            if pos == "NOUN":
                e = self.entry(lemma, "NOUN")
                if not e:
                    continue
                if ex:
                    skips["noun_excluded_" + ex] += 1
                    continue
                number = "pl" if tok.tag_ == "NNS" else "sg"
                kids = list(tok.children)
                dets = [k for k in kids if k.dep_ == "det"]
                amods = [k for k in kids if k.dep_ == "amod"]
                others = [k for k in kids if k.i < tok.i and k.dep_ not in ("det", "amod", "punct")]
                has_adj = bool(amods)
                adj_exposure["noun_opportunities"] += 1
                if has_adj:
                    adj_exposure["noun_with_adjective"] += 1
                if tok.dep_ == "compound":
                    skips["noun_compound_modifier"] += 1
                    continue
                meta = {"number": number, "has_adj": has_adj, "dep": tok.dep_}
                role = case = prep = ""
                if self.lang == "de":
                    role, case, prep = self.de_role(tok)
                    meta.update({"role": role, "case": case, "prep": prep})
                # N-bare
                cands.append(self.make(sent, sid, doc_id, "NOUN", "N-bare", [tok], self.noun_form(e, number), lemma, pos, [e], dict(meta)))
                # N-det / N-adj
                det = dets[0] if len(dets) == 1 else None
                if det is None or det.text.lower() not in ("the", "a", "an"):
                    skips["ndet_no_simple_det" if det is None else "ndet_other_det"] += 1
                    continue
                if others:
                    skips["ndet_other_modifier"] += 1
                    continue
                if tok.dep_ == "poss":
                    skips["ndet_possessive"] += 1
                    continue
                definite = "def" if det.text.lower() == "the" else "ind"
                if definite == "ind" and number == "pl":
                    skips["ndet_indef_plural"] += 1  # "a series", "a means": no indefinite plural article
                    continue
                if self.lang == "de":
                    if case == "skip":
                        skips["de_case_possessive"] += 1
                        continue
                    de_case[case] += 1
                    de_case["role:" + role] += 1
                    if case in ("ambiguous", "unsupported"):
                        skips["de_case_" + case] += 1
                        continue
                g = e["gender"]
                if not has_adj:
                    if det.i != tok.i - 1:
                        skips["ndet_not_adjacent"] += 1
                        continue
                    if self.lang == "de":
                        art = DE_DEF[(g, number, case)] if definite == "def" else DE_IND.get((g, number, case))
                        if art is None:
                            skips["de_indef_plural"] += 1
                            continue
                        tgt = art + " " + self.noun_form(e, number, case)
                    elif self.lang == "fr":
                        art = ARTICLES["fr"].get((definite, g, number))
                        tgt = fr_elide(art, self.noun_form(e, number))
                    else:
                        art = ARTICLES["es"].get((definite, g, number))
                        tgt = art + " " + self.noun_form(e, number)
                    m = dict(meta, definite=definite)
                    cands.append(self.make(sent, sid, doc_id, "NOUN", "N-det", [det, tok], tgt, lemma, pos, [e], m))
                else:
                    if len(amods) != 1 or det.i != amods[0].i - 1 or amods[0].i != tok.i - 1:
                        skips["nadj_complex_np"] += 1
                        continue
                    adj = amods[0]
                    if adj.tag_ in ("JJR", "JJS"):
                        skips["nadj_comparative"] += 1
                        continue
                    ae = self.entry(adj.lemma_.lower(), "ADJ")
                    if not ae:
                        skips["nadj_adj_not_in_pack"] += 1
                        continue
                    if basic_excluded(adj, sent, qspans, truns):
                        skips["nadj_adj_excluded"] += 1
                        continue
                    adj_exposure["noun_with_pack_adjective"] += 1
                    if self.lang == "de":
                        if case not in ("NOM", "ACC"):
                            skips["de_adj_case_unsupported"] += 1
                            continue
                        stem = ae["adj_forms"].get("stem") or ae["target"]
                        if definite == "def":
                            art = DE_DEF[(g, number, case)]
                            ending = DE_WEAK_ADJ[(g, number, case)]
                        else:
                            art = DE_IND.get((g, number, case))
                            ending = DE_MIXED_ADJ.get((g, number, case))
                            if art is None or ending is None:
                                skips["de_indef_plural"] += 1
                                continue
                        tgt = f"{art} {stem}{ending} {self.noun_form(e, number, case)}"
                    else:
                        nf = self.noun_form(e, number)
                        pre = self.prenominal(adj.lemma_.lower(), ae)
                        if self.lang == "es":
                            af = ae["adj_forms"][f"{g}_{number}"]
                            if pre:
                                af = es_apocope(af, number, g)
                            art = ARTICLES["es"][(definite, g, number)]
                            tgt = f"{art} {af} {nf}" if pre else f"{art} {nf} {af}"
                        else:
                            af = fr_adj_form(ae, g, number, nf)
                            art = ARTICLES["fr"][(definite, g, number)]
                            tgt = fr_elide(art, af + " " + nf) if pre else fr_elide(art, nf) + " " + af
                    m = dict(meta, definite=definite, adj=adj.lemma_.lower(), prenominal=self.prenominal(adj.lemma_.lower(), ae))
                    cands.append(self.make(sent, sid, doc_id, "NOUN", "N-adj", [det, adj, tok], tgt, lemma, pos, [e, ae], m))
            elif pos == "ADJ":
                e = self.entry(lemma, "ADJ")
                if not e:
                    continue
                if ex:
                    skips["adj_excluded_" + ex] += 1
                    continue
                if tok.tag_ in ("JJR", "JJS"):
                    skips["adj_comparative"] += 1
                    continue
                if tok.dep_ == "amod":
                    adj_exposure["adj_attributive"] += 1
                    continue  # handled (or not) by N-adj
                if tok.dep_ != "acomp" or tok.head.lemma_.lower() not in COPULAS:
                    skips["adj_other_position"] += 1
                    continue
                adj_exposure["adj_predicative"] += 1
                subj = [k for k in tok.head.children if k.dep_ in ("nsubj", "nsubjpass")]
                subj = subj[0] if subj else None
                g = number = None
                stype = "none"
                if subj is not None and subj.pos_ == "PRON" and subj.text.lower() in ("it", "this", "that"):
                    g, number, stype = "m", "sg", "pron_neuter"
                elif subj is not None and subj.pos_ == "PRON" and subj.text.lower() in ("he", "she"):
                    g, number, stype = ("m" if subj.text.lower() == "he" else "f"), "sg", "pron_gendered"
                elif subj is not None and subj.pos_ == "NOUN":
                    ne = self.entry(subj.lemma_.lower(), "NOUN")
                    if ne:
                        g, number, stype = ne["gender"], ("pl" if subj.tag_ == "NNS" else "sg"), "pack_noun"
                if g is None:
                    skips["pred_no_gendered_subject"] += 1
                    if self.lang == "de":
                        adj_exposure["de_pred_skipped_only_by_subject_rule"] += 1
                    continue
                if self.lang == "de":
                    tgt = e["adj_forms"].get("base") or e["target"]
                elif self.lang == "es":
                    tgt = e["adj_forms"][f"{'m' if g == 'n' else g}_{number}"]
                else:
                    tgt = fr_adj_form(e, "m" if g == "n" else g, number, "")
                cands.append(self.make(sent, sid, doc_id, "ADJ", "ADJ-pred", [tok], tgt, lemma, pos, [e],
                                       {"subject_type": stype, "gender": g, "number": number}))
            elif pos == "ADV" or (lw in CONNECTORS and pos in CONNECTORS[lw]):
                if lw in CONNECTORS and pos in CONNECTORS[lw]:
                    e = self.entry(lw, "CONJ")
                    cls, rule, key = "CONN", "CONN-tok", lw
                else:
                    e = self.entry(lemma, "ADV")
                    cls, rule, key = "ADV", "ADV-tok", lemma
                if not e:
                    continue
                if ex:
                    skips[cls.lower() + "_excluded_" + ex] += 1
                    continue
                if tok.tag_ in ("RBR", "RBS"):
                    skips["adv_comparative"] += 1
                    continue
                if tok.dep_ == "prt":
                    skips["adv_particle"] += 1
                    continue
                cands.append(self.make(sent, sid, doc_id, cls, rule, [tok], e["target"], key, pos, [e]))
            elif pos == "VERB":
                e = self.entry(lemma, "VERB")
                if not e:
                    continue
                if ex:
                    skips["verb_excluded_" + ex] += 1
                    continue
                tag = tok.tag_
                kids = list(tok.children)
                if any(k.dep_ == "prt" for k in kids):
                    verb_forms["phrasal"] += 1
                    skips["verb_phrasal"] += 1
                    continue
                auxs = [k for k in kids if k.dep_ in ("aux", "auxpass")]
                aux_lemmas = [a.lemma_.lower() for a in auxs]
                if tag == "VB":
                    prev = tok.doc[tok.i - 1] if tok.i > 0 else None
                    if prev is not None and prev.text.lower() == "to" and prev.dep_ == "aux":
                        verb_forms["VB_to_inf"] += 1
                        cands.append(self.make(sent, sid, doc_id, "VERB", "V-inf", [tok], e["infinitive"], lemma, pos, [e], {"trigger": "to"}))
                    elif any(a in MODALS for a in aux_lemmas) and not any(a == "do" for a in aux_lemmas):
                        if any(k.dep_ == "neg" for k in kids):
                            verb_forms["VB_modal_negated"] += 1
                            # negation sits between modal and verb; infinitive form is still right
                        verb_forms["VB_modal"] += 1
                        cands.append(self.make(sent, sid, doc_id, "VERB", "V-inf", [tok], e["infinitive"], lemma, pos, [e],
                                               {"trigger": "modal:" + next(a for a in aux_lemmas if a in MODALS)}))
                    elif "do" in aux_lemmas:
                        verb_forms["VB_do_support"] += 1
                        skips["verb_do_support"] += 1
                    else:
                        verb_forms["VB_other"] += 1
                        skips["verb_bare_other"] += 1
                elif tag in ("VBP", "VBZ"):
                    if is_question:
                        verb_forms["present_question"] += 1
                        skips["verb_question"] += 1
                        continue
                    subj = [k for k in kids if k.dep_ == "nsubj"]
                    subj = subj[0] if subj else None
                    if auxs:
                        verb_forms["present_with_aux"] += 1
                        skips["verb_present_with_aux"] += 1
                    elif subj is None:
                        verb_forms["present_no_subject"] += 1
                        skips["verb_present_no_subject"] += 1
                    elif subj.pos_ == "PRON" and subj.text.lower() in SUBJ_PRON:
                        if abs(subj.i - tok.i) <= 2:
                            person = SUBJ_PRON[subj.text.lower()]
                            verb_forms["present_pron_" + person] += 1
                            cands.append(self.make(sent, sid, doc_id, "VERB", "V-pres", [tok], e["present"][person], lemma, pos, [e],
                                                   {"person": person, "pronoun": subj.text.lower()}))
                        else:
                            verb_forms["present_pron_far"] += 1
                            skips["verb_present_pron_far"] += 1
                    elif subj.pos_ == "PRON":
                        verb_forms["present_rel_or_other_pron"] += 1
                        skips["verb_present_other_pron"] += 1
                    else:
                        verb_forms["present_noun_subject"] += 1
                        skips["verb_present_noun_subject"] += 1
                elif tag == "VBD":
                    verb_forms["past"] += 1
                    skips["verb_past"] += 1
                elif tag == "VBN":
                    verb_forms["participle"] += 1
                    skips["verb_participle"] += 1
                elif tag == "VBG":
                    verb_forms["gerund"] += 1
                    skips["verb_gerund"] += 1
                else:
                    verb_forms["other_" + tag] += 1
                    skips["verb_other_tag"] += 1
        return cands


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wiki-dir", required=True, type=Path)
    ap.add_argument("--pages-dir", required=True, type=Path)
    ap.add_argument("--lexicon", required=True, type=Path)
    ap.add_argument("--packs-dir", required=True, type=Path)
    ap.add_argument("--out-dir", required=True, type=Path)
    ap.add_argument("--model", default="en_core_web_md")
    ap.add_argument("--langs", default=",".join(LANGS))
    args = ap.parse_args()

    import spacy
    from wordfreq import tokenize

    langs = args.langs.split(",")
    lexicon = json.loads(args.lexicon.read_text(encoding="utf-8"))
    packs = {l: json.loads((args.packs_dir / f"{l}.json").read_text(encoding="utf-8")) for l in langs}
    swappers = {l: Swapper(l, packs[l], lexicon) for l in langs}

    nlp = spacy.load(args.model)
    docs = load_corpus(args.wiki_dir, args.pages_dir, lambda t: tokenize(t, "en"))
    args.out_dir.mkdir(parents=True, exist_ok=True)

    sentences = []
    cands = {l: [] for l in langs}
    skips = {l: defaultdict(Counter) for l in langs}
    verb_forms = {l: defaultdict(Counter) for l in langs}
    de_case = {l: defaultdict(Counter) for l in langs}
    adj_exp = {l: defaultdict(Counter) for l in langs}
    stats = {"docs": {}, "model": args.model}
    total_words = 0
    t0 = time.time()
    parse_time = 0.0
    for d in docs:
        n_words = 0
        n_sents = 0
        paras = [p for p in d["text"].split("\n") if p.strip()]
        tp = time.time()
        parsed = list(nlp.pipe(paras, batch_size=32))
        parse_time += time.time() - tp
        for pi, doc in enumerate(parsed):
            for si, sent in enumerate(doc.sents):
                words = [t for t in sent if not t.is_punct and not t.is_space]
                if len(words) < 4 or len(words) > 120:
                    continue
                if not any(c.islower() for c in sent.text):
                    continue
                sid = f"{d['id']}:{pi}:{si}"
                n_words += len(words)
                n_sents += 1
                sentences.append({"sid": sid, "doc": d["id"], "source": d["source"], "text": sent.text, "n_words": len(words)})
                for l in langs:
                    cs = swappers[l].process_sentence(sent, sid, d["id"], skips[l][d["id"]], verb_forms[l][d["id"]],
                                                      de_case[l][d["id"]], adj_exp[l][d["id"]])
                    cands[l].extend(cs)
        total_words += n_words
        stats["docs"][d["id"]] = {"source": d["source"], "n_words": n_words, "n_sents": n_sents}
    elapsed = time.time() - t0
    stats["total_words"] = total_words
    stats["n_sentences"] = len(sentences)
    stats["spacy_parse_seconds"] = round(parse_time, 2)
    stats["spacy_words_per_sec"] = round(sum(len(p.split()) for d in docs for p in d["text"].split("\n")) / parse_time, 1)
    stats["total_seconds"] = round(elapsed, 2)

    write_jsonl(args.out_dir / "sentences.jsonl", sentences)
    for l in langs:
        for i, c in enumerate(cands[l]):
            c["cid"] = f"{l}-{i:06d}"
        write_jsonl(args.out_dir / f"candidates-{l}.jsonl", cands[l])
        (args.out_dir / f"skips-{l}.json").write_text(json.dumps({
            "skips": {d: dict(c) for d, c in skips[l].items()},
            "verb_forms": {d: dict(c) for d, c in verb_forms[l].items()},
            "de_case": {d: dict(c) for d, c in de_case[l].items()},
            "adj_exposure": {d: dict(c) for d, c in adj_exp[l].items()},
        }, ensure_ascii=False, indent=1), encoding="utf-8")
        by = Counter((c["class"], c["rule"]) for c in cands[l])
        print(f"{l}: {len(cands[l])} candidates; per 100 words: " +
              ", ".join(f"{k[1]}={100 * v / total_words:.2f}" for k, v in sorted(by.items())))
    (args.out_dir / "stats.json").write_text(json.dumps(stats, indent=1), encoding="utf-8")
    print(f"words={total_words} sentences={len(sentences)} spaCy words/s={stats['spacy_words_per_sec']}")


if __name__ == "__main__":
    main()
