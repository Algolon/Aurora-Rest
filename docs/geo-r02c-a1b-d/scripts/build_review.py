"""Builds review.html from review.src.html, inlining A1b-implementation-prompt.md (escaped) so page and handoff never drift."""
import html
from pathlib import Path
P=Path(__file__).resolve().parents[1]
t=(P/'scripts/review.src.html').read_text();p=(P/'A1b-implementation-prompt.md').read_text()
(P/'review.html').write_text(t.replace('{{PROMPT}}',html.escape(p)));print('review.html written')
