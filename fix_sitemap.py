from __future__ import annotations

from pathlib import Path
import re


def main() -> None:
    p = Path(r"c:\Users\user\OneDrive\Documentos\optienergy\sitemap.xml")
    text = p.read_text(encoding="utf-8")

    end_tag = "</urlset>"
    idx = text.find(end_tag)
    if idx == -1:
        raise SystemExit("No </urlset> found")

    # Keep only the first urlset (removes duplicated blocks without losing unique URLs)
    text = text[: idx + len(end_tag)] + "\n"

    # Force x-default to the home page
    text = re.sub(
        r'(hreflang="x-default"\s+href=")https?://optienergy\.es/[^"]*(")',
        r"\1https://optienergy.es/\2",
        text,
    )

    # Remove trailing dots/spaces from optienergy.es URLs in loc/href (conservative)
    text = re.sub(
        r'(href=")(https?://optienergy\.es/[^"\s]*?)[\s\.]+(")',
        r"\1\2\3",
        text,
    )
    text = re.sub(
        r"(>(https?://optienergy\.es/[^<\s]*?))[\s\.]+(<)",
        r"\1\3",
        text,
    )

    # Ensure exactly one XML declaration at top
    text = re.sub(
        r"^(\s*<\?xml[^\n]*\?>\s*)+",
        '<?xml version="1.0" encoding="UTF-8"?>\n',
        text,
    )

    p.write_text(text, encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()

