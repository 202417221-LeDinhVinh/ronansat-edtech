import type { ReactNode } from "react";
import Latex from "react-latex-next";

export type LatexSegment =
  | { type: "text"; value: string }
  | { type: "math"; value: string; delimiter: "$" | "$$" };

const TALL_MATH_PATTERN = /\\(?:d?frac)|\^(?:\{[^}]+\}|\S)/;
const PLAIN_NUMBER_PATTERN = /^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/;
const MONEY_CONTEXT_WORDS = [
  "account",
  "accounts",
  "additional",
  "amount",
  "amounts",
  "budget",
  "charge",
  "charges",
  "charged",
  "cost",
  "costs",
  "deposit",
  "deposited",
  "dollar",
  "dollars",
  "earn",
  "earns",
  "fee",
  "fees",
  "money",
  "paid",
  "pay",
  "payment",
  "payments",
  "price",
  "prices",
  "priced",
  "profit",
  "profits",
  "revenue",
  "salary",
  "sale",
  "sales",
  "selling",
  "spent",
  "wage",
  "wages",
];
const COUNT_CONTEXT_WORDS = [
  "bottle",
  "bottles",
  "book",
  "books",
  "centimeter",
  "centimeters",
  "day",
  "days",
  "feet",
  "foot",
  "hour",
  "hours",
  "mile",
  "miles",
  "month",
  "months",
  "people",
  "point",
  "points",
  "question",
  "questions",
  "response",
  "responses",
  "session",
  "sessions",
  "square",
  "student",
  "students",
  "unit",
  "units",
  "week",
  "weeks",
  "year",
  "years",
];

function isWhitespaceChar(char?: string) {
  return typeof char === "string" && /\s/.test(char);
}

function isEscapedDollar(text: string, index: number) {
  let backslashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === "\\") {
    backslashCount += 1;
    cursor -= 1;
  }

  return backslashCount % 2 === 1;
}

function isValidInlineMathOpener(text: string, index: number) {
  const nextChar = text[index + 1];
  return nextChar !== undefined && !isWhitespaceChar(nextChar);
}

function isValidInlineMathCloser(text: string, index: number) {
  const prevChar = text[index - 1];
  return prevChar !== "\\" && !isWhitespaceChar(prevChar);
}

function getMathInnerValue(segment: Extract<LatexSegment, { type: "math" }>) {
  if (segment.delimiter === "$$") {
    return segment.value.slice(2, -2);
  }

  return segment.value.slice(1, -1);
}

function pushTextSegment(segments: LatexSegment[], textBuffer: string) {
  if (textBuffer.length === 0) {
    return;
  }

  segments.push({ type: "text", value: textBuffer });
}

export function tokenizeLatexSegments(text: string): LatexSegment[] {
  const segments: LatexSegment[] = [];
  let textBuffer = "";
  let cursor = 0;

  while (cursor < text.length) {
    const currentChar = text[cursor];

    if (currentChar === "\\" && text[cursor + 1] === "$") {
      textBuffer += "$";
      cursor += 2;
      continue;
    }

    if (currentChar !== "$" || isEscapedDollar(text, cursor)) {
      textBuffer += currentChar;
      cursor += 1;
      continue;
    }

    if (text[cursor + 1] === "$") {
      let closingIndex = -1;
      let scanCursor = cursor + 2;

      while (scanCursor < text.length - 1) {
        if (text[scanCursor] === "\\" && text[scanCursor + 1] === "$") {
          scanCursor += 2;
          continue;
        }

        if (text[scanCursor] === "$" && text[scanCursor + 1] === "$" && !isEscapedDollar(text, scanCursor)) {
          closingIndex = scanCursor;
          break;
        }

        scanCursor += 1;
      }

      if (closingIndex === -1) {
        textBuffer += "$$";
        cursor += 2;
        continue;
      }

      pushTextSegment(segments, textBuffer);
      textBuffer = "";
      segments.push({
        type: "math",
        value: text.slice(cursor, closingIndex + 2),
        delimiter: "$$",
      });
      cursor = closingIndex + 2;
      continue;
    }

    if (!isValidInlineMathOpener(text, cursor)) {
      textBuffer += "$";
      cursor += 1;
      continue;
    }

    let closingIndex = -1;
    let scanCursor = cursor + 1;

    while (scanCursor < text.length) {
      if (text[scanCursor] === "\\" && text[scanCursor + 1] === "$") {
        scanCursor += 2;
        continue;
      }

      if (text[scanCursor] === "$" && text[scanCursor + 1] === "$" && !isEscapedDollar(text, scanCursor)) {
        scanCursor += 2;
        continue;
      }

      if (text[scanCursor] === "$" && !isEscapedDollar(text, scanCursor) && isValidInlineMathCloser(text, scanCursor)) {
        closingIndex = scanCursor;
        break;
      }

      scanCursor += 1;
    }

    if (closingIndex === -1) {
      textBuffer += "$";
      cursor += 1;
      continue;
    }

    pushTextSegment(segments, textBuffer);
    textBuffer = "";
    segments.push({
      type: "math",
      value: text.slice(cursor, closingIndex + 1),
      delimiter: "$",
    });
    cursor = closingIndex + 1;
  }

  pushTextSegment(segments, textBuffer);
  return segments;
}

function getNeighboringText(segments: LatexSegment[], startIndex: number, direction: -1 | 1) {
  let cursor = startIndex + direction;
  let collected = "";

  while (cursor >= 0 && cursor < segments.length) {
    const segment = segments[cursor];
    if (segment.type !== "text") {
      break;
    }

    collected = direction === -1 ? `${segment.value}${collected}` : `${collected}${segment.value}`;
    cursor += direction;
  }

  return collected;
}

function hasContextKeyword(context: string, keywords: string[]) {
  const normalizedContext = context.toLowerCase();
  return keywords.some((keyword) =>
    new RegExp(`(^|[^a-z])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[^a-z]|$)`, "i").test(
      normalizedContext,
    ),
  );
}

function classifyNumericInlineMath(
  innerValue: string,
  leftText: string,
  rightText: string,
): "currency" | "count" | "math" {
  if (!PLAIN_NUMBER_PATTERN.test(innerValue)) {
    return "math";
  }

  const normalizedLeft = leftText.slice(-80).toLowerCase();
  const normalizedRight = rightText.slice(0, 80).toLowerCase();
  const hasMoneyContext =
    hasContextKeyword(normalizedLeft, MONEY_CONTEXT_WORDS) ||
    hasContextKeyword(normalizedRight, MONEY_CONTEXT_WORDS);
  const hasCountContext = hasContextKeyword(normalizedRight, COUNT_CONTEXT_WORDS);

  if (hasCountContext && !hasMoneyContext) {
    return "count";
  }

  if (hasMoneyContext) {
    return "currency";
  }

  if (hasCountContext) {
    return "count";
  }

  return "math";
}

function mergeAdjacentTextSegments(segments: LatexSegment[]) {
  return segments.reduce<LatexSegment[]>((mergedSegments, segment) => {
    if (segment.type === "text" && mergedSegments.at(-1)?.type === "text") {
      const previousSegment = mergedSegments.at(-1) as Extract<LatexSegment, { type: "text" }>;
      previousSegment.value += segment.value;
      return mergedSegments;
    }

    mergedSegments.push(segment);
    return mergedSegments;
  }, []);
}

export function normalizeRenderableLatexSegments(segments: LatexSegment[]) {
  const normalizedSegments = segments.map((segment, index) => {
    if (segment.type !== "math" || segment.delimiter !== "$") {
      return segment;
    }

    const innerValue = getMathInnerValue(segment).trim();
    const classification = classifyNumericInlineMath(
      innerValue,
      getNeighboringText(segments, index, -1),
      getNeighboringText(segments, index, 1),
    );

    if (classification === "currency") {
      return { type: "text" as const, value: `$${innerValue}` };
    }

    if (classification === "count") {
      return { type: "text" as const, value: innerValue };
    }

    return segment;
  });

  return mergeAdjacentTextSegments(normalizedSegments);
}

export function hasTallMath(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  return TALL_MATH_PATTERN.test(text);
}

function normalizeMathSegment(segment: Extract<LatexSegment, { type: "math" }>) {
  const innerValue = getMathInnerValue(segment).trim();

  if (segment.delimiter === "$" && hasTallMath(innerValue)) {
    return `$\\displaystyle ${innerValue.replace(/\\frac/g, "\\dfrac")}$`;
  }

  return segment.delimiter === "$$" ? `$$${innerValue}$$` : `$${innerValue}$`;
}

export function renderHtmlLatexContent(text: string | undefined): ReactNode {
  if (!text) {
    return "";
  }

  const segments = normalizeRenderableLatexSegments(tokenizeLatexSegments(text));

  if (segments.length === 0) {
    return "";
  }

  return segments.map((segment, index) => {
    if (segment.type === "text") {
      return (
        <span
          key={`text-${index}`}
          dangerouslySetInnerHTML={{ __html: segment.value }}
        />
      );
    }

    return <Latex key={`math-${index}`}>{normalizeMathSegment(segment)}</Latex>;
  });
}
