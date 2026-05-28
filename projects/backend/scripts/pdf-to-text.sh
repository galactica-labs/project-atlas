#!/usr/bin/env bash

set -euo pipefail

INPUT_DIR="${1:-./rag/pdfs}"
OUTPUT_DIR="${2:-./rag/text}"

if ! command -v pdftotext >/dev/null 2>&1; then
  printf 'Missing dependency: pdftotext\n' >&2
  printf 'Install with: brew install poppler\n' >&2
  exit 1
fi

if [ ! -d "$INPUT_DIR" ]; then
  printf 'Input directory not found: %s\n' "$INPUT_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

found=0
for pdf in "$INPUT_DIR"/*.pdf "$INPUT_DIR"/*.PDF; do
  if [ ! -f "$pdf" ]; then
    continue
  fi

  found=1
  name="$(basename "$pdf")"
  stem="${name%.*}"
  out="$OUTPUT_DIR/$stem.txt"

  pdftotext -layout "$pdf" "$out"
  printf 'Wrote %s\n' "$out"
done

if [ "$found" -eq 0 ]; then
  printf 'No PDF files found in %s\n' "$INPUT_DIR" >&2
  exit 1
fi
