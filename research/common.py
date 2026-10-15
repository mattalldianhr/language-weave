"""Shared helpers for the Language Weave coverage research.

All scripts take data paths as arguments. Run them with ``python3 -I``
from the venv so the download directory is never on sys.path.
"""

from __future__ import annotations

import re
from pathlib import Path

LANGS = ["en", "es", "fr", "de", "it", "pt", "ja", "zh"]
TARGETS = ["es", "fr", "de", "it", "pt", "ja", "zh"]

# OpenSubtitles 2018 file names in Hermit Dave's FrequencyWords repo.
# ja has no 50k file (only ja_full), zh lives under zh_cn.
OPENSUBS_FILE = {
    "en": "en_full.txt",
    "es": "es_full.txt",
    "fr": "fr_full.txt",
    "de": "de_full.txt",
    "it": "it_full.txt",
    "pt": "pt_full.txt",
    "ja": "ja_full.txt",
    "zh": "zh_cn_full.txt",
}

N_STEPS = [25, 50, 100, 200, 300, 500, 1000, 2000, 3000, 5000]

# A token counts as a "word" if it has at least one letter, digit, or CJK char.
_WORDISH = re.compile(r"[\w぀-ヿ㐀-䶿一-鿿]", re.UNICODE)


def is_wordish(tok: str) -> bool:
    return bool(_WORDISH.search(tok))


def load_opensubs(path: Path) -> tuple[list[tuple[str, int]], int, int]:
    """Return ([(word, count)...] in file order, total_tokens, dropped_punct_tokens).

    Pure-punctuation tokens (e.g. Japanese 、 and 。) are dropped from both the
    list and the denominator so coverage is over word tokens only.
    """
    rows: list[tuple[str, int]] = []
    total = 0
    dropped = 0
    with path.open(encoding="utf-8", errors="replace") as fh:
        for line in fh:
            parts = line.rstrip("\n").split(" ")
            if len(parts) != 2:
                continue
            word, cnt = parts[0], parts[1]
            try:
                c = int(cnt)
            except ValueError:
                continue
            if not is_wordish(word):
                dropped += c
                continue
            rows.append((word, c))
            total += c
    rows.sort(key=lambda r: -r[1])
    return rows, total, dropped


# --- Ferriss lists, copied verbatim from tim.blog/2009/01/20/learning-language/

FERRISS_WRITTEN_RAW = (
    "the, of, and, a, to, in, is, you, that, it, he, was, for, on, are, as, "
    "with, his, they, I, at, be, this, have, from, or, one, had, by, word, but, "
    "not, what, all, were, we, when, your, can, said, there, use, an, each, "
    "which, she, do, how, their, if, will, up, other, about, out, many, then, "
    "them, these, so, some, her, would, make, like, him, into, time, has, look, "
    "two, more, write, go, see, number, no, way, could, people, my, than, first, "
    "water, been, call, who, oil, its, now, find, long, down, day, did, get, "
    "come, made, may, part"
)

FERRISS_SPOKEN_RAW = (
    "a/an, after, again, all, almost, also, always, and, because, before, big, "
    "but, can, come, either/or, find, first, for, friend, from, go, good, "
    "goodbye, happy, have, he, hello, here, how, I, am, if, in, know, last, "
    "like, little, love, make, many, one, more, most, much, my, new, no, not, "
    "now, of, often, on, only, or, other, our, out, over, people, place, "
    "please, same, see, she, so, some, sometimes, still, such, tell, thank you, "
    "that, the, their, them, then, there is, they, thing, think, this, time, "
    "to, under, up, us, use, very, we, what, when, where, which, who, why, "
    "with, yes, you, your"
)


def ferriss_entries(raw: str) -> list[str]:
    return [e.strip() for e in raw.split(",") if e.strip()]


def expand_entry(entry: str) -> list[str]:
    """Expand a Ferriss entry into lowercase single words.

    Rules (stated in the report):
      * "a/an", "either/or"  -> both alternatives
      * "there is", "thank you" -> each component word
      * "I" -> "i"; everything lowercased
    """
    words: list[str] = []
    for alt in entry.split("/"):
        for w in alt.split():
            w = w.strip().lower()
            if w:
                words.append(w)
    return words


def ferriss_written() -> list[str]:
    out: list[str] = []
    for e in ferriss_entries(FERRISS_WRITTEN_RAW):
        out.extend(expand_entry(e))
    return out


def ferriss_spoken() -> list[str]:
    out: list[str] = []
    for e in ferriss_entries(FERRISS_SPOKEN_RAW):
        out.extend(expand_entry(e))
    return out


def dedupe(seq: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for s in seq:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


# --- English grammar-word sets -------------------------------------------

# Narrow set, exactly as the brief words it: articles, forms of be/have/do,
# pronouns, and of/to/in/that.
EN_GRAMMAR_NARROW = set(
    """
    a an the
    be am is are was were been being
    have has had having
    do does did doing done
    i me my mine myself you your yours yourself he him his himself she her hers
    herself it its itself we us our ours ourselves they them their theirs
    themselves this that these those who whom whose what which
    of to in
    """.split()
)

# Contractions that wordfreq keeps as one token and that are pure grammar.
EN_GRAMMAR_CONTRACTIONS = set(
    """
    i'm i've i'd i'll you're you've you'd you'll he's he'd he'll she's she'd
    she'll it's it'd it'll we're we've we'd we'll they're they've they'd
    they'll that's there's here's what's who's isn't aren't wasn't weren't
    don't doesn't didn't haven't hasn't hadn't can't couldn't won't wouldn't
    shouldn't let's
    """.split()
)

# Broad heuristic: adds prepositions, conjunctions, negation, wh-words, and
# clitics. Modals, quantifiers, and adverbs stay "content" because they are
# swappable (can -> puede, very -> muy). Hand list, not a POS tagger.
EN_GRAMMAR_BROAD = EN_GRAMMAR_NARROW | EN_GRAMMAR_CONTRACTIONS | set(
    """
    and or but nor so yet if because although though while whether than
    as at by for from into onto of off on out over under up down with
    without within about above across after against along among around
    before behind below beneath beside between beyond during except
    through throughout toward towards until upon
    not
    when where why how
    's 't n't 'm 're 've 'll 'd
    """.split()
)


def en_is_grammar(tok: str, broad: bool = False) -> bool:
    t = tok.lower()
    if broad:
        if t in EN_GRAMMAR_BROAD:
            return True
    else:
        if t in EN_GRAMMAR_NARROW or t in EN_GRAMMAR_CONTRACTIONS:
            return True
    # contraction whose stem is a grammar word, e.g. "that's", "we'll"
    if "'" in t:
        stem = t.split("'", 1)[0]
        if stem in EN_GRAMMAR_NARROW:
            return True
    return False


def pct(x: float) -> str:
    return f"{100.0 * x:.1f}"
