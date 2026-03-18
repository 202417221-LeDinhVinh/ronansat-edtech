import os
from pypdf import PdfReader

def extract_pdf(path, out_path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"Extracted {len(text)} chars to {out_path}")

extract_pdf("question_bank/reading_question.pdf", "reading_sample.txt")
extract_pdf("question_bank/math_question.pdf", "math_sample.txt")
