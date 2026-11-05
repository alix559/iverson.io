#!/bin/sh
# Compile the TOCHI manuscript without interactive "? " prompts.
# Usage: ./compile.sh
set -e
cd "$(dirname "$0")"
export TEXINPUTS="./sty:./:${TEXINPUTS:-}"
export max_print_line=120
run() { pdflatex -interaction=nonstopmode -halt-on-error -file-line-error main.tex; }
run
bibtex main || true
run
run
echo
echo "PDF: $(pwd)/main.pdf"
open main.pdf 2>/dev/null || true
