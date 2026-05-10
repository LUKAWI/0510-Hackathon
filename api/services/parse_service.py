"""教材解析服务：支持 Markdown/TXT/PDF/DOCX 格式。"""

from __future__ import annotations

import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

MARKDOWN_CHINESE_SEPARATORS = ["\n\n", "\n", "。", "；", "！", "？", "，", " ", ""]


def parse_markdown(content: str, filename: str) -> list[dict]:
    """解析 Markdown 文件，按章节拆分。"""
    chapters: list[dict] = []
    current_title = ""
    current_content: list[str] = []
    chapter_index = 0

    for line in content.split("\n"):
        if line.startswith("#"):
            if current_content:
                text = "\n".join(current_content).strip()
                if text:
                    chapters.append({
                        "chapter_index": chapter_index,
                        "title": current_title or f"章节 {chapter_index + 1}",
                        "content": text,
                        "char_count": len(text),
                    })
                    chapter_index += 1
            current_title = line.lstrip("# ").strip()
            current_content = []
        else:
            current_content.append(line)

    if current_content:
        text = "\n".join(current_content).strip()
        if text:
            chapters.append({
                "chapter_index": chapter_index,
                "title": current_title or f"章节 {chapter_index + 1}",
                "content": text,
                "char_count": len(text),
            })

    return chapters


def parse_txt(content: str, filename: str) -> list[dict]:
    """解析纯文本文件，按空行或固定长度分段。"""
    sections = re.split(r"\n{2,}", content.strip())
    chapters: list[dict] = []

    for i, section in enumerate(sections):
        text = section.strip()
        if text:
            chapters.append({
                "chapter_index": i,
                "title": f"段落 {i + 1}",
                "content": text,
                "char_count": len(text),
            })

    return chapters


def parse_pdf(file_path: str) -> list[dict]:
    """解析 PDF 文件，逐页提取文本。"""
    import pymupdf

    doc = pymupdf.open(file_path)
    chapters: list[dict] = []
    current_content: list[str] = []
    current_title = ""
    page_start = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")

        if not text.strip():
            continue

        lines = text.split("\n")
        for line in lines:
            stripped = line.strip()
            if _is_chapter_heading(stripped):
                if current_content:
                    content_text = "\n".join(current_content).strip()
                    if content_text:
                        chapters.append({
                            "chapter_index": len(chapters),
                            "title": current_title or f"第 {page_start + 1} 页",
                            "content": content_text,
                            "char_count": len(content_text),
                            "page_start": page_start,
                            "page_end": page_num,
                        })
                current_title = stripped
                current_content = []
                page_start = page_num
            else:
                current_content.append(stripped)

    if current_content:
        content_text = "\n".join(current_content).strip()
        if content_text:
            chapters.append({
                "chapter_index": len(chapters),
                "title": current_title or f"第 {page_start + 1} 页",
                "content": content_text,
                "char_count": len(content_text),
                "page_start": page_start,
                "page_end": len(doc) - 1,
            })

    doc.close()
    return chapters


def parse_docx(file_path: str) -> list[dict]:
    """解析 DOCX 文件。"""
    from docx import Document

    doc = Document(file_path)
    chapters: list[dict] = []
    current_content: list[str] = []
    current_title = ""

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        if para.style.name.startswith("Heading") or _is_chapter_heading(text):
            if current_content:
                content_text = "\n".join(current_content).strip()
                if content_text:
                    chapters.append({
                        "chapter_index": len(chapters),
                        "title": current_title or f"段落 {len(chapters) + 1}",
                        "content": content_text,
                        "char_count": len(content_text),
                    })
            current_title = text
            current_content = []
        else:
            current_content.append(text)

    if current_content:
        content_text = "\n".join(current_content).strip()
        if content_text:
            chapters.append({
                "chapter_index": len(chapters),
                "title": current_title or f"段落 {len(chapters) + 1}",
                "content": content_text,
                "char_count": len(content_text),
            })

    return chapters


def parse_file(file_path: str) -> tuple[list[dict], int]:
    """根据文件扩展名选择解析器，返回 (chapters, total_chars)。"""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".md":
        content = path.read_text(encoding="utf-8")
        chapters = parse_markdown(content, path.name)
    elif suffix == ".txt":
        content = path.read_text(encoding="utf-8")
        chapters = parse_txt(content, path.name)
    elif suffix == ".pdf":
        chapters = parse_pdf(file_path)
    elif suffix == ".docx":
        chapters = parse_docx(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {suffix}")

    total_chars = sum(ch["char_count"] for ch in chapters)
    return chapters, total_chars


def _is_chapter_heading(text: str) -> bool:
    """判断是否为章节标题。"""
    patterns = [
        r"^第[一二三四五六七八九十百千\d]+[章节篇]",
        r"^Chapter\s+\d+",
        r"^CHAPTER\s+\d+",
        r"^\d+\.\s+\S",
        r"^第\d+章",
    ]
    return any(re.match(p, text) for p in patterns)
