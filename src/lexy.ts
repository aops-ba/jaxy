import { CompileError } from "./error";
import { asyAssert, asyUnreachable } from "./error";
import { nextSuchThat } from "./helper";

import { Keyword, Operator, Separator, Other, span } from "./tokens";

import type { Erroneous, Token } from "./tokens";
import { isStringKeywordOrLiteral } from "./tokens";
import { tokenTypeToLength } from "./tokens";

function isHex(c: string): boolean {
  asyAssert(c.length === 1, `${c} is of length 1`);
  return ((c >= "0" && c <= "9")
       || (c >= "a" && c <= "f")
       || (c >= "A" && c <= "F"));
}

/**
 * @type of trying to parse a `bigint` at a given span
 */
type BigIntParseResult = {
  value: bigint; // base-10n worth
  realDigits: number; // how many digits
} | string; // error

/**
 * @returns the base-`base` integer at `text[start:end]`.
 */
function checkedBigInt(text: string, start: number, end: number, base: number): BigIntParseResult {
  asyAssert([2, 8, 10, 16].includes(base), `${base} is a supported base`);

  try {
    return {
      value: [...Array(end-start).keys()].reduce((x: bigint, y: number) =>
        BigInt(base)*x + BigInt(Number.parseInt(text[y+start]!, base)), 0n),
      realDigits: end - start,
    };
  } catch {
    return "bad digit";
  }
}

/**
 * Parse a decimal float. Note that floats can end in f or F to signify a float32,
 * or d or D to explicitly make it a double. Otherwise, parsing occurs according to JS rules,
 * so we leverage that for the hard work of conversion.
 * @returns Successful or erroneous parse, and the number of characters read.
 */
function parseDecimalFloatSloppy(text: string, offset: number):
  [Token<Other.FloatLiteral> | Erroneous, number] {
  let i = offset;
  let hasDigits = false;

  function skipDigits(){
    while (text[i] && (text[i] >= "0" && text[i] <= "9")) {
      hasDigits = true;
      i++;
    }
  }

  skipDigits();
  // Skip .
  if (text[i] === ".") ++i;
  skipDigits();
  if (!hasDigits)
    return [{kind: Other.Bad, value: "Invalid floating-point literal"}, i];

  let expStart = i;
  if (text[i] === "e" || text[i] === "E") {
    // read exponent
    ++i;
    if (text[i] === "+" || text[i] === "-") ++i; // read optional exponent sign
    hasDigits = false;
    while (i < text.length && text[i]! >= "0" && text[i]! <= "9") {
      // read exponent digits
      hasDigits = true;
      ++i;
    }

    if (!hasDigits) {
      // Parse it as <number> multiplied by variable e or E rather than as a floating point literal
      i = expStart;
    }
  }


  return [{
    kind: Other.FloatLiteral,
    isHexFloat: false,
    value: Number(text.slice(offset, i)),
    span: {start: offset, end: i},
  }, i];
}

/**
 * Process escape like \n and return the char code (or erroneous token) and the amount of characters consumed.
 * Preconditions: Text should start with \
 * See section 3.10
 * @param text The text to remove an escape code from
 * @param offset Where to read the escape code from.
 * @param isSingleQuote Whether this is a 'string' or a "string" -- these have different escape rules. See page 29
 * of the manual
 */
function processCharacterOrOctalEscape(
  text: string,
  offset: number,
  isSingleQuote: boolean
): [number | Erroneous, number] {
  asyAssert(text[offset] === "\\", "processEscape precondition fail");

  if (!isSingleQuote) {
    // Only escapes are \\ -> \\ and \" -> ".
    switch (text[offset + 1]) {
      case '"':
        return [34, 2];
      case undefined: // only undefined if at EOF
        return [{kind: Other.Bad, value: "Unterminated escape sequence"
        }, 1];
      case "\\":
        asyUnreachable("Should have been handled outside");
      // fallthrough
      default: // just process as a slash
        return [92, 1];
    }
  }

  switch (text[offset + 1]) {
    case "a": return [7, 2];
    case "b": return [8, 2];
    case "v": return [11, 2];
    case "?": return [63, 2];
    case "t": return [9, 2];
    case "n": return [10, 2];
    case "f": return [12, 2];
    case "r": return [13, 2];
    case '"': return [34, 2];
    case "'": return [39, 2];
    case "\\": return [92, 2];

    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7": {
      // octal escape sequence
      let i = offset + 2;
      while (
        i < text.length &&
        i < offset + 4 /* maximum 3 chars */ &&
        text[i]! >= "0" &&
        text[i]! <= "7"
        )
        ++i;
      const val = Number.parseInt(text.slice(offset + 1, i), 8);
      if (val > 0xff) {
        // maximum allowed value is 0xff
        return [
          {kind: Other.Bad, value: "Invalid octal escape sequence"},
          i - offset,
        ];
      }
      return [val, i - offset];
    }
    case "x": {
      // Hex escape sequence
      let i = offset + 2;
      while (
        i < text.length &&
        i < offset + 4 /* maximum 2 chars */ &&
        isHex(text[i]!)
        )
        ++i;
      if (i === offset + 2) {
        return [
          {kind: Other.Bad, value: "Invalid hex escape sequence"},
          2,
        ];
      }
      const val = Number.parseInt(text.slice(offset + 2, i), 16);
      if (val > 0xff) {
        // maximum allowed value is 0xff
        return [
          {kind: Other.Bad, value: "Invalid hex escape sequence"},
          i - offset,
        ];
      }
      return [val, i - offset];
    }

    case undefined: // only undefined if at EOF
      return [{ kind: Other.Bad, value: "Unterminated escape sequence" }, 1];
    default: // just process as a backslash
      return [92, 1];
  }
}

const charIndicatesFloat: Set<string | undefined> = new Set([...".eE"]);

// Whether the character code can start an identifier
function isIdentifierStart(val: number) {
  return (val >= 65 && val <= 90) /* A-Z */
      || (val >= 97 && val <= 122) /* a-z */
      || (val === 95) /* _ */
      || (val >= 128);
}

// Whether the character code can be part of an identifier
function isIdentifierPart(val: number) {
  return isIdentifierStart(val)
      || (val >= 48 && val <= 57); /* 0-9 */
}

type LexyOptions = {};

class Lexy {
  _text: string;
  offset: number;

  errors: CompileError[];
  options: LexyOptions;
  // For each line number, store the (0-indexed) offset of the line start. For example,
  // offsetToLine[0] is always 0.
  offsetToLine: number[] = [];

  // Map between token (or comment) and the comment that precedes it. Useful for assembling docstrings
  commentMap: Map<Token<any>, Token<Other.Comment>> = new Map();
  // List of all comments
  comments: Token<Other.Comment>[] = [];
  // Most recent comment
  private _lastComment: Token<Other.Comment> | null = null;

  constructor(text: string, options: LexyOptions) {
    this._text = text;
    this.options = options;
    this.offset = 0;
    let n = 0;
    this.offsetToLine = text.split("\n").map(x => {
      const offs = n;
      n += x.length + 1;
      return offs;
    });
    this.errors = [];
  }

  mapOffset(offset: number): { line: number, lineOffset: number} {
    return ((loffsets) => {
      let low = 0;
      let high = loffsets.length - 1;
      while (low < high) {
        const m = (low + high) >>> 1;
        if (offset > loffsets[m]) {
          low = m + 1;
        } else if (offset < loffsets[m]) {
          high = m - 1;
        } else {
          low = m;
          break;
        }
      }
    return { line: low, lineOffset: offset - loffsets[low] };
    }) (this.offsetToLine);
  }

  lineOf(offset: number): number {
    return this.mapOffset(offset).lineOffset;
  }

  /**
   * @returns the next token.
   */
  next(): Token<any> {
    while (true) {
      const lastComment = this._lastComment;
      this.skipWhitespace();

      const lastOffset = this.offset; // so that token spans don't include whitespace
      const token = this.nextImpl();
      if (token === null) {
        return { kind: Other.Eof, span: { start: this.offset, end: this.offset } };
      }

      if (token.kind === Other.Bad) {
        this.error(token.value as string, lastOffset, this.offset);
        asyAssert(this.offset > lastOffset, "Did not advance after erroneous");
        continue;
      }

      if (lastComment !== null) {
        this.commentMap.set(token as Token<any>, lastComment);
      }

      if (token.kind === Other.Comment) {
        this.comments.push(token as Token<any>);
        this._lastComment = token as Token<any>;
      } else {
        this._lastComment = null;
        return token as Token<any>;
      }
    }
  }

  private eat(howmany: number) {
    asyAssert(howmany !== 0, "we ate at least one bite");
    this.offset += howmany;
  }

  private eatUntil(newOffset: number) {
    asyAssert(newOffset > this.offset, "we ate forwards");
    this.offset = newOffset;
  }

  /**
   * Consume a string literal. Preconditions: The remaining text's first character should be a double quote.
   * This will never fail in the sense that a string literal will always be returned, as the string is consumed
   * maximally and errors are handled by substituting bad escapes by ?, or terminating the string early if there is
   * a newline.
   */
  private nextString(): Token<Other.StringLiteral> {
    const text = this._text;
    const char = text[this.offset];
    const isSingleQuoted = char === "'";  // escape algorithm for single quoted strings is different than double quoted!
    asyAssert(char === '"' || isSingleQuoted, "nextString precondition");

    const INVAL = "?"; // character substituted for invalid escape sequences

    let i = this.offset + 1;
    let result = "";
    while (i < text.length) {
      const start = this.offset;
      const c = text[i];
      switch (c) {
        case "\\":
          if (text[i + 1] === "\\" && !isSingleQuoted) {
            // \\ -> \\ in double-quoted strings. Handle this out here because it's one of the weird
            // cases where an escape generates more than one character
            result += "\\\\";
            i += 2;
          } else {
            const [val, consumed] = processCharacterOrOctalEscape(text, i, isSingleQuoted);
            if (typeof val === "number") {
              result += String.fromCharCode(val);
            } else {
              this.error(val.value, i, i + consumed);
              result += INVAL;
            }
            i += consumed;
          }
          continue;
        case char: // Found end of string
          this.eatUntil(i + 1 /* skip read chars + string terminator */);
          return {
            kind: Other.StringLiteral,
            value: result,
            span: {start, end: i + 1},
          };
        default:
          result += c;
      }
      ++i;
    }

    // Only here if we didn't finish parsing
    this.error("Unterminated string literal", this.offset, i);
    const span = {start: this.offset, end: i};
    this.eatUntil(i);

    return {
      kind: Other.StringLiteral,
      value: result,
      span,
    };
  }

  /**
   * Skip all whitespace to the next non-whitespace character or end of file
   */
  private skipWhitespace(): string {
    (lindex => { if (lindex !== this.offset) this.eatUntil(lindex); })
    (nextSuchThat(this._text, x => !/\s/.test(x), this.offset));
    return this._text;
  }

  private nextInlineComment(): Token<Other.Comment> {
    asyAssert(this._text.startsWith("//", this.offset), `this line begins with "//")`);

    return ((lindex) => {
      this.eatUntil(lindex);
      return {
        kind: Other.Comment,
        value: this._text.slice(this.offset, lindex),
        span: { start: this.offset, end: lindex },
      };
    }) (nextSuchThat(this._text, x => x === "\n", this.offset + "//".length));
  }

  private nextBlockComment(): Token<Other.Comment> {
    asyAssert(this._text.startsWith("/*", this.offset), `this line begins with "/*"`);

    return ((lindex) => {
      if (lindex === -1) { // missing "*/"
        this.error("Endless comment", this.offset, this._text.length);
        this.eatUntil(this._text.length);
        return {
          kind: Other.Comment,
          value: this._text + "*/", // so as not to befuddle comment parsers
          span: span(this.offset, this._text.length),
        };
      } else {
        this.eatUntil(lindex+"*/".length);
        return {
          kind: Other.Comment,
          value: this._text.slice(this.offset, lindex+"*/".length),
          span: span(this.offset, lindex+2),
        };
      }
    }) (this._text.indexOf("*/", this.offset+"/*".length));
  }

  /**
   * Get the next normal, decimal float.
   */
  private nextDecimalFloat(): Token<Other.FloatLiteral> | Erroneous {
    return (([ltoken, leaten]) => {
      this.eatUntil(leaten);
      return ltoken;
    }) (parseDecimalFloatSloppy(this._text, this.offset));
  }

  /**
   * Get the next numeric token: integer or floating point.
   * Contract: First character must be . or 0 through 9.
   */
  private nextNumeric(): Token<Other.IntegerLiteral | Other.FloatLiteral> | Erroneous {
    const text = this._text;
    const start = this.offset;

    asyAssert(
      text[start] === "." || (text[start]! >= "0" && text[start]! <= "9"),
      "nextNumeric precondition"
    );

    if (text[start] === ".") {
      return this.nextDecimalFloat();
    }

    const digitsStart = start;
    let digitsEnd = digitsStart;

    const validChar = (char: string) => char >= "0" && char <= "9";
    // Skip digits to detect whether this is a float
    while (digitsEnd < text.length && validChar(text[digitsEnd]!)) {
      digitsEnd++;
    }
    if (charIndicatesFloat.has(text[digitsEnd])) {
      return this.nextDecimalFloat();
    }

    const value = checkedBigInt(text, digitsStart, digitsEnd, /*base=*/10);
    const span = {start, end: digitsEnd};

    this.eatUntil(digitsEnd);
    if (typeof value === "string") {
      return { kind: Other.Bad, value: value };
    }

    // to-do: Check overflow which is an error
    return {
      kind: Other.IntegerLiteral,
      value: Number(value.value), // for testing… no bigints for now. 3/9/25 KB
//    value: value.value,
      originalType: "decimal",
      span,
    };
  }

  private nextImpl(): Token<Exclude<any, Other.Comment>> | Token<Other.Comment> | null | Erroneous {
    const text = this._text,
      offset = this.offset;
    if (offset >= text.length) return null;

    // Emit an operator token.
    const op = (s: Operator | Separator): Token<Operator | Separator> => {
      return ((llength) => {
        this.eat(llength);
        return { kind: s, span: {start: this.offset, end: this.offset + llength}};
      }) (tokenTypeToLength(s));
    };

    const char = text[offset]!;
    switch (char) {
      case '"':
      case "'":
        return this.nextString();
      case "/": {
        switch (text[offset + 1]) {
          case "/": return this.nextInlineComment();
          case "*": return this.nextBlockComment();
          case "=": return op(Operator.SlashEq);
          default: return op(Operator.Slash);
        }
      }
      case "=": return op(text[offset + 1] === "=" ? Operator.EqEq : Operator.Eq);
      case ">": {
        switch (text[offset + 1]) {
          case ">": return op(Operator.GtGt);
          case "=": return op(Operator.GtEq);
          default: return op(Operator.Gt);
        }
      }
      case "<": {
        switch (text[offset + 1]) {
          case "=": return op(Operator.LtEq);
          case "<": return op(Operator.LtLt);
          case ">": return op(Operator.LtGt);
          default: return op(Operator.Lt);
        }
      }
      case "!": return op(text[offset + 1] === "=" ? Operator.BangEq : Operator.Bang);
      case "&": return op(text[offset + 1] === "&" ? Operator.AmpAmp : Operator.Amp);
      case "|": return op(text[offset + 1] === "|" ? Operator.BarBar : Operator.Bar);
      case "+": {
        switch (text[offset + 1]) {
          case "+": return op(Operator.PlusPlus);
          case "=": return op(Operator.PlusEq);
          default: return op(Operator.Plus);
        }
      }
      case "-": {
        switch (text[offset + 1]) {
          case "-": return op(text[offset + 2] === "-" ? Operator.MinusMinusMinus : Operator.MinusMinus)
          case "=": return op(Operator.MinusEq);
          default: return op(Operator.Minus);
        }
      }
      case "*": {
        switch (text[offset + 1]) {
          case "*": return op(Operator.StarStar);
          case "=": return op(Operator.StarEq);
          default: return op(Operator.Star);
        }
      }
      case "%": return op(text[offset + 1] === "=" ? Operator.PercentEq : Operator.Percent);
      case "^": {
        switch (text[offset + 1]) {
          case "^": return op(Operator.CaretCaret);
          case "=": return op(Operator.CaretEq);
          default: return op(Operator.Caret);
        }
      }
      case "?": return op(Operator.Question);
      case ":": return op(text[offset + 1] === ":" ? Operator.ColonColon : Operator.Colon);
      case "(": return op(Separator.LRound);
      case ")": return op(Separator.RRound);
      case "{": return op(Separator.LCurly);
      case "}": return op(Separator.RCurly);
      case "[": return op(Separator.LSquare);
      case "]": return op(Separator.RSquare);
      case ";": return op(Separator.Semicolon);
      case ",": return op(Separator.Comma);
      case ".": {
        if (text.startsWith("...", offset)) {
          return op(Separator.DotDotDot);
        } else if (text.startsWith("..", offset)) {
          return op(Operator.DotDot);
        } else if (
          text[offset + 1] !== undefined &&
          text[offset + 1]! >= "0" &&
          text[offset + 1]! <= "9"
        ) {
          // Floating-point literal without leading digits
          return this.nextNumeric();
        } else {
          return op(Separator.Dot);
        }
      }
      case "@": return op(text[offset + 1] === "@" ? Operator.AtAt : Operator.At);
      case "#": return op(text[offset + 1] === "=" ? Operator.HashEq : Operator.Hash);
      case "$": return op(text[offset + 1] === "$" ? Operator.DollarDollar : Operator.Dollar);
      case "~": return op(Operator.Twiddle);
      default:
        // Must be a literal, keyword, or identifier.
        return (char >= "0" && char <= "9") ? this.nextNumeric() : this.nextKeywordOrIdentifier();
    }
  }

  /**
   * Add an error with the given message, in an absolute position. Return an erroneous token
   * representing the error, and the number of characters consumed.
   */
  private error(message: string, start: number=0, end: number=start+1): [Erroneous, number] {
    return ((lend) => {
      this.errors.push(new CompileError(message, {start: start, end: lend}));
      return [{ kind: Other.Bad, value: this._text.slice(start, lend) }, lend-start];
    }) (Math.max(end, start + 1));
  }

  private nextKeywordOrIdentifier():
    | Token<Keyword | Operator | Other.Identifier | Other.BooleanLiteral | Other.NullLiteral>
    | Erroneous {
    const text = this._text,
      offset = this.offset;
    if (isIdentifierStart(text.charCodeAt(offset) || 0)) {
      let i = offset + 1;
      while (i < text.length && isIdentifierPart(text.charCodeAt(i))) ++i;

      const ident = text.slice(offset, i);
      const span = {start: this.offset, end: i};
      this.eatUntil(i);

      if (isStringKeywordOrLiteral(ident)) {
        if (ident === "true" || ident === "false") {
          return { kind: Other.BooleanLiteral, value: ident === "true", span };
        } else if (ident === "null") {
          return { kind: Other.NullLiteral, span }
        } else if (ident === "and") {
          return { kind: Operator.and, span }
        }
        return { kind: Reflect.get(Keyword, ident), span };
      } else {
        return { kind: Other.Identifier, value: ident, span };
      }
    }

    this.eat(1);
    return this.error("Invalid character " + text[offset], offset)[0];
  }
}

export type { LexyOptions };
export { Lexy };