# Spoken Compound Notation (TOCHI manuscript)

Anonymous ACM manuscript for *Transactions on Computer-Human Interaction*.

## Files

- `main.tex` — manuscript (double-anonymous)
- `references.bib` — bibliography
- `cover-letter.md` — draft cover letter for Manuscript Central (not for reviewers)

## Compile

From this directory, do **not** run `pdflatex` interactively (never type at a `?` prompt):

```sh
./compile.sh
```

That script sets `TEXINPUTS=./sty:./:` (vendored ACM extras), disables prompts, runs `pdflatex` / `bibtex` / `pdflatex` / `pdflatex`, and opens `main.pdf`.

Manual equivalent:

```sh
TEXINPUTS=./sty:./: pdflatex -interaction=nonstopmode -halt-on-error main
bibtex main
TEXINPUTS=./sty:./: pdflatex -interaction=nonstopmode -halt-on-error main
TEXINPUTS=./sty:./: pdflatex -interaction=nonstopmode -halt-on-error main
```

BasicTeX is enough for a local preview: `sty/` holds missing ACM deps, and `lmodern` plus `microtype` `expansion=false` avoid the bitmap-font crash. Overleaf still gives the official Libertine ACM look: upload `main.tex` and `references.bib` to [Overleaf's ACM template](https://www.overleaf.com/gallery/tagged/acm-official).

## Before you submit

TOCHI will almost certainly quick-reject a design paper with no completed study. The manuscript is honest about that: Section 10 is a protocol, not results. Run Studies 1–3, then replace that section with data.

Also:

1. All authors need an ORCID linked in Manuscript Central.
2. Upload a separate title page with names and affiliations (not in `main.tex`).
3. Do not put this repo URL, `shabdayantra`, or author names in the PDF or in supplemental filenames.
4. Numbered citations are already set (`acmnumeric`).
5. Abstract is about 180 words (TOCHI asks 150–200).
6. Preferred template is ACM; this file uses `\documentclass[manuscript, review, anonymous]{acmart}` and `\acmJournal{TOCHI}`.
