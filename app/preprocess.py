"""
Inference-time text preparation. This MIRRORS the normalisation the training data went through
(master-dataset builder v2), so the models see text in the same shape they were trained on.
If you change the builder's `normalize()` / `make_description()`, change this file too.
"""
import html
import re

_TRANS = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201a": "'", "\u201c": '"', "\u201d": '"', "\u201e": '"',
                        "\u2013": "-", "\u2014": "-", "\u2026": "...", "\u00a0": " "})
_SPECIAL = re.compile(r"</?\s*(?:url|twitter|copyright|selfref)\s*>|\bselfref\b", re.I)
_PIC_TW = re.compile(r"\bpic\.twitter\.com/\S+", re.I)
_URL = re.compile(r"(?:https?://|www\.)\S+|\b[\w-]+\.(?:com|net|org|co\.uk)/\S*", re.I)
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_HANDLE = re.compile(r"(?<![\w@])@\w{1,30}")
_EMPTY_PAREN = re.compile(r"\(\s*\)")
_DATELINE = re.compile(r"^\s*[A-Z][A-Z .'’]{2,30}(?:\s*,\s*[A-Za-z .]{2,20})?\s*(?:\([^)]{2,30}\))?\s*[-–—]+\s*")
_REUTERS_TAG = re.compile(r"\(\s*Reuters\s*\)\s*[-–—]?", re.I)
_REUTERS_WORD = re.compile(r"\bReuters\b", re.I)
_TITLE_TAG = re.compile(r"\s*[\(\[]\s*(?:videos?|screenshots?|images?|photos?|pics?|tweets?|watch|gifs?|audio|graphics?|infographic|details?)\s*[\)\]]?\s*$", re.I)
_GLUE_DOT = re.compile(r"([a-z]{2,})([.!?])([A-Z][a-z])")
_SENT_SPLIT = re.compile(r"(?<=[.!?])[\"”’']?\s+(?=[\"“‘']?[A-Z0-9])")
_CONTR = [
    (re.compile(r"\b(don|doesn|didn|isn|wasn|aren|weren|hasn|haven|hadn|won|wouldn|couldn|shouldn|can|ain|mustn|needn) t\b", re.I), r"\1't"),
    (re.compile(r"\b(you|we|they) re\b", re.I), r"\1're"),
    (re.compile(r"\b(I|you|we|they|would|could|should) ve\b"), r"\1've"),
    (re.compile(r"\b(I|you|he|she|we|they|it|that|there|who) ll\b"), r"\1'll"),
    (re.compile(r"\b(I|you|he|she|we|they|who) d\b"), r"\1'd"),
    (re.compile(r"\bI m\b"), "I'm"),
    (re.compile(r"(?<=[A-Za-z]) s\b(?!\.)"), "'s"),
]

DESC_MAX_WORDS = 80          # same cap the training descriptions used
_MAX_RAW_CHARS = 12_000


def normalize(text: str, is_desc: bool = False) -> str:
    t = html.unescape("" if text is None else str(text))[:_MAX_RAW_CHARS].translate(_TRANS)
    t = _SPECIAL.sub(" ", t)
    if is_desc:
        t = _DATELINE.sub("", t, count=1)
    for rx in (_PIC_TW, _URL, _EMAIL, _HANDLE):
        t = rx.sub(" ", t)
    t = _REUTERS_TAG.sub(" ", t)
    t = _REUTERS_WORD.sub(" ", t)
    t = _EMPTY_PAREN.sub(" ", t)
    for rx, rp in _CONTR:
        t = rx.sub(rp, t)
    t = _GLUE_DOT.sub(r"\1\2 \3", t)
    return re.sub(r"\s+", " ", t).strip()


def make_description(body: str, max_words: int = DESC_MAX_WORDS) -> str:
    """First sentences up to ~max_words - identical to how training descriptions were cut."""
    out, n = [], 0
    for s in _SENT_SPLIT.split(body):
        w = len(s.split())
        if out and n + w > max_words:
            break
        out.append(s)
        n += w
        if n >= max_words:
            break
    return " ".join(" ".join(out).split()[: int(max_words * 1.5)])


def build_content(title: str, description: str) -> tuple[str, dict]:
    """Returns (model_input_text, meta)."""
    t = _TITLE_TAG.sub("", normalize(title)).strip()
    d_full = normalize(description, is_desc=True)
    d = make_description(d_full)
    content = f"{t} {d}".strip()
    meta = {"word_count": len(content.split()), "description_truncated": len(d.split()) < len(d_full.split())}
    return content, meta
