"use client";

import { Fragment, createElement, useMemo, type ReactNode } from "react";
import Latex from "react-latex-next";

const TALL_MATH_PATTERN = /\\(?:d?frac)|\^(?:\{[^}]+\}|\S)/;
const ALLOWED_TAGS = new Set([
  "b",
  "br",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

function hasTallMath(text: string | undefined) {
  if (!text) {
    return false;
  }

  return TALL_MATH_PATTERN.test(text);
}

function loosenInlineLatex(text: string | undefined) {
  if (!text) {
    return "";
  }

  return text.replace(/(\$\$?)(.*?)\1/gs, (match, delimiter, mathText) => {
    if (delimiter === "$$") {
      return match;
    }

    const normalizedMath = mathText.trim();
    if (!hasTallMath(normalizedMath)) {
      return match;
    }

    return `$\\displaystyle ${normalizedMath.replace(/\\frac/g, "\\dfrac")}$`;
  });
}

function getTagClassName(tagName: string) {
  switch (tagName) {
    case "p":
      return "mb-4 last:mb-0";
    case "ul":
      return "my-4 list-disc pl-6";
    case "ol":
      return "my-4 list-decimal pl-6";
    case "li":
      return "mb-1";
    case "table":
      return "my-4 w-full border-collapse overflow-hidden rounded-xl border-2 border-ink-fg bg-surface-white";
    case "thead":
      return "border-b-2 border-ink-fg bg-paper-bg";
    case "th":
      return "border-2 border-ink-fg px-3 py-2 text-left font-bold";
    case "td":
      return "border-2 border-ink-fg px-3 py-2 align-top";
    default:
      return undefined;
  }
}

function renderRichNode(node: Node, key: string, loosenTallInlineMath: boolean): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) {
      return null;
    }

    return <Latex key={key}>{loosenTallInlineMath ? loosenInlineLatex(text) : text}</Latex>;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map((child, index) =>
    renderRichNode(child, `${key}-${index}`, loosenTallInlineMath),
  );

  if (!ALLOWED_TAGS.has(tagName)) {
    return <Fragment key={key}>{children}</Fragment>;
  }

  if (tagName === "br") {
    return <br key={key} />;
  }

  const className = getTagClassName(tagName);
  return createElement(tagName, className ? { key, className } : { key }, children);
}

export default function RichTextWithLatex({
  text,
  loosenTallInlineMath = false,
}: {
  text?: string;
  loosenTallInlineMath?: boolean;
}) {
  const content = useMemo(() => {
    if (!text) {
      return null;
    }

    if (typeof window === "undefined") {
      return <Latex>{loosenTallInlineMath ? loosenInlineLatex(text) : text}</Latex>;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${text}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    if (!root) {
      return null;
    }

    return Array.from(root.childNodes).map((node, index) =>
      renderRichNode(node, `rich-${index}`, loosenTallInlineMath),
    );
  }, [loosenTallInlineMath, text]);

  return <>{content}</>;
}
