"""Shared helpers for the deterministic-swapper experiment.

Every script takes data paths as arguments and is run with ``python3 -I``
from the venv, so no download or corpus directory is ever on sys.path.
"""

from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
RESEARCH = HERE.parent
sys.path.insert(0, str(RESEARCH))

from exposure import html_to_text  # noqa: E402  (research/exposure.py)

LANGS = ["es", "fr", "de"]

# Languages' article tables used by the swapper.
ARTICLES = {
    "es": {("def", "m", "sg"): "el", ("def", "f", "sg"): "la",
           ("def", "m", "pl"): "los", ("def", "f", "pl"): "las",
           ("ind", "m", "sg"): "un", ("ind", "f", "sg"): "una"},
    "fr": {("def", "m", "sg"): "le", ("def", "f", "sg"): "la",
           ("def", "m", "pl"): "les", ("def", "f", "pl"): "les",
           ("ind", "m", "sg"): "un", ("ind", "f", "sg"): "une"},
}
# German articles: (definiteness, gender, number, case)
DE_DEF = {
    ("m", "sg", "NOM"): "der", ("m", "sg", "ACC"): "den", ("m", "sg", "DAT"): "dem", ("m", "sg", "GEN"): "des",
    ("f", "sg", "NOM"): "die", ("f", "sg", "ACC"): "die", ("f", "sg", "DAT"): "der", ("f", "sg", "GEN"): "der",
    ("n", "sg", "NOM"): "das", ("n", "sg", "ACC"): "das", ("n", "sg", "DAT"): "dem", ("n", "sg", "GEN"): "des",
    ("m", "pl", "NOM"): "die", ("m", "pl", "ACC"): "die", ("m", "pl", "DAT"): "den", ("m", "pl", "GEN"): "der",
    ("f", "pl", "NOM"): "die", ("f", "pl", "ACC"): "die", ("f", "pl", "DAT"): "den", ("f", "pl", "GEN"): "der",
    ("n", "pl", "NOM"): "die", ("n", "pl", "ACC"): "die", ("n", "pl", "DAT"): "den", ("n", "pl", "GEN"): "der",
}
DE_IND = {
    ("m", "sg", "NOM"): "ein", ("m", "sg", "ACC"): "einen", ("m", "sg", "DAT"): "einem", ("m", "sg", "GEN"): "eines",
    ("f", "sg", "NOM"): "eine", ("f", "sg", "ACC"): "eine", ("f", "sg", "DAT"): "einer", ("f", "sg", "GEN"): "einer",
    ("n", "sg", "NOM"): "ein", ("n", "sg", "ACC"): "ein", ("n", "sg", "DAT"): "einem", ("n", "sg", "GEN"): "eines",
}
# Weak adjective endings after a definite article (NOM/ACC only are used).
DE_WEAK_ADJ = {
    ("m", "sg", "NOM"): "e", ("m", "sg", "ACC"): "en",
    ("f", "sg", "NOM"): "e", ("f", "sg", "ACC"): "e",
    ("n", "sg", "NOM"): "e", ("n", "sg", "ACC"): "e",
    ("m", "pl", "NOM"): "en", ("m", "pl", "ACC"): "en",
    ("f", "pl", "NOM"): "en", ("f", "pl", "ACC"): "en",
    ("n", "pl", "NOM"): "en", ("n", "pl", "ACC"): "en",
}

# English preposition -> (German preposition, case) ; None case = two-way.
DE_PREP = {
    "with": ("mit", "DAT"), "for": ("für", "ACC"), "from": ("von", "DAT"),
    "to": ("zu", "DAT"), "about": ("über", "ACC"), "after": ("nach", "DAT"),
    "before": ("vor", "DAT"), "between": ("zwischen", "DAT"), "at": ("an", "DAT"),
    "of": (None, "GEN"), "in": ("in", None), "on": ("auf", None),
    "over": ("über", None), "under": ("unter", None), "into": ("in", "ACC"),
    "through": ("durch", "ACC"), "without": ("ohne", "ACC"), "against": ("gegen", "ACC"),
    "during": ("während", "GEN"), "since": ("seit", "DAT"), "by": ("von", "DAT"),
    "among": ("unter", "DAT"), "behind": ("hinter", None), "across": ("über", "ACC"),
}

# Adjectives that go before the noun in Spanish / French (pack lemma = English).
PRENOMINAL_ES = {"big", "good", "bad", "new", "old", "great", "small", "little", "young", "long", "first", "last", "only", "same", "other", "such", "next", "whole", "main", "high", "low", "best", "worst", "own"}
PRENOMINAL_FR = {"big", "good", "bad", "new", "old", "beautiful", "young", "small", "little", "long", "great", "first", "last", "only", "same", "other", "next", "whole", "main", "best", "worst", "own", "high", "large"}

MODALS = {"can", "could", "will", "would", "should", "must", "may", "might", "shall"}
SUBJ_PRON = {"i": "1sg", "you": "2sg", "he": "3sg", "she": "3sg", "it": "3sg", "we": "1pl", "they": "3pl"}

CONNECTORS = {
    # word: allowed spaCy POS
    "because": {"SCONJ"}, "but": {"CCONJ"}, "also": {"ADV"}, "although": {"SCONJ"},
    "however": {"ADV"}, "though": {"SCONJ", "ADV"}, "therefore": {"ADV"}, "unless": {"SCONJ"},
    "until": {"SCONJ", "ADP"}, "while": {"SCONJ"}, "whereas": {"SCONJ"}, "instead": {"ADV"},
    "otherwise": {"ADV"}, "meanwhile": {"ADV"}, "moreover": {"ADV"}, "nevertheless": {"ADV"},
    "yet": {"CCONJ", "ADV"}, "thus": {"ADV"}, "hence": {"ADV"}, "besides": {"ADV"},
    "anyway": {"ADV"}, "finally": {"ADV"}, "especially": {"ADV"}, "perhaps": {"ADV"},
}

PHRASES = [
    "there is", "there are", "i think", "of course", "for example", "thank you",
    "a lot", "at least", "in fact", "as well", "in order to", "at the same time",
    "on the other hand", "in addition", "as a result", "for instance", "a few",
    "a little", "right now", "each other", "more than", "less than", "as soon as",
    "in general", "at first", "in the end", "of course", "by the way",
]

AUX_LIKE = {"can", "could", "will", "would", "should", "may", "might", "must", "shall", "ought",
            "be", "have", "do", "get", "let", "going", "gonna", "gotta", "wanna"}
INTERJ_MISC = {"yeah", "yes", "no", "okay", "ok", "oh", "hey", "hi", "hello", "wow", "lol", "um", "uh",
               "mr", "mrs", "ms", "dr", "etc", "st", "vs", "am", "pm", "us", "uk", "eu", "tv", "re", "ve",
               "ll", "don", "didn", "doesn", "isn", "wasn", "won", "couldn", "wouldn", "shouldn", "ain",
               "http", "https", "www", "com", "org", "html", "php", "de", "la", "le", "el", "en", "es",
               "york", "u", "s", "t", "m", "d", "n", "p", "b", "c", "e", "f", "g", "h", "j", "k", "l", "o", "r", "v", "w", "x", "y", "z",
               "january", "february", "march", "april", "june", "july", "august", "september", "october", "november", "december",
               "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
               "american", "english", "british", "french", "german", "european", "chinese", "japanese", "christian", "jewish",
               "god", "christ", "jesus", "john", "james", "david", "george", "michael", "paul", "mary", "king", "lord",
               "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand", "million", "billion",
               "first", "second", "third", "half",
               # quantifier determiners (spaCy DET, outside the rule set) and proper nouns / junk
               "all", "some", "any", "most", "much", "many", "every", "each", "both", "another", "such",
               "either", "whatever", "several", "enough", "nothing", "someone", "self", "non", "co", "al",
               "london", "america", "england", "china", "shit", "fuck", "fucking", "sex", "datum", "medium",
               "accord", "unite", "please", "else", "thank"}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def norm(s: str) -> str:
    return strip_accents(s.lower())


_HEADING = re.compile(r"^\s*=+\s*[^=]+?\s*=+\s*$")


def load_corpus(wiki_dir: Path, pages_dir: Path, tokenize) -> list[dict]:
    """Return [{id, source, text}] for the 27 corpus documents (20 wiki + 7 pages)."""
    docs: list[dict] = []
    for p in sorted(wiki_dir.glob("*.json")):
        data = json.loads(p.read_text(encoding="utf-8"))
        extract = data["query"]["pages"][0]["extract"]
        lines = []
        for ln in extract.split("\n"):
            if _HEADING.match(ln):
                continue
            ln = ln.strip()
            if not ln:
                continue
            lines.append(ln)
        docs.append({"id": p.stem, "source": "wikipedia", "text": "\n".join(lines)})
    for p in sorted(pages_dir.glob("*.html")):
        if p.name.endswith("_index.html"):
            continue
        text, _mode = html_to_text(p.read_text(encoding="utf-8", errors="replace"), tokenize)
        lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
        docs.append({"id": p.stem, "source": "page", "text": "\n".join(lines)})
    return docs


def read_jsonl(path: Path) -> list[dict]:
    out = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def write_jsonl(path: Path, rows) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")


def extract_json(text: str):
    """Parse the first JSON array/object in an LLM reply, tolerating code fences."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text, strict=False)
    except json.JSONDecodeError:
        pass
    # find first [ or { and the matching last ] or }
    for open_c, close_c in (("[", "]"), ("{", "}")):
        i = text.find(open_c)
        j = text.rfind(close_c)
        if i != -1 and j > i:
            try:
                return json.loads(text[i:j + 1], strict=False)
            except json.JSONDecodeError:
                continue
    # last resort: salvage every parsable top-level {...} object (replies are one object per line)
    objs = []
    depth = 0
    in_str = False
    esc = False
    start = -1
    for i, ch in enumerate(text):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            if depth == 0:
                start = i
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0 and start >= 0:
                try:
                    objs.append(json.loads(text[start:i + 1], strict=False))
                except json.JSONDecodeError:
                    pass
                start = -1
            if depth < 0:
                depth = 0
                in_str = False
    if objs:
        return objs
    raise ValueError("no JSON found in reply")
