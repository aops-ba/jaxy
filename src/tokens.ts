import type { Enumlike } from "./helper";
import { enumNames, toEach } from "./helper";
import { max, min, peel} from "./helper";

type Span = { start: number; end: number };

const DEFSPAN = span(-1, -1);

function span(start: number, end: number): Span {
  return { start, end };
}

function allspan(...spans: Span[]): Span {
  return {
    start: min(...spans.map(s => s.start)),
    end: max(...spans.map(s => s.end)),
  };
}

function rightAfter(span: Span): Span {
  return { start: span.end, end: span.end+1 };
}

enum Keyword {
  first,

  import, access, from,

  new, struct, typedef,
  static, public, private, restricted,
  unravel, operator,
  explicit,

  atleast, controls, tension, curl,

  return,
  if, else,
  for,
  do, while,
  break, continue,

  interactive,

  last,
}

enum Operator {
  first = Keyword.last + 1,

  Plus, Minus, Star, Slash, // + - * /
  Hash, Percent, // # %
  Caret, // ^
  Bang, // !
  Eq, Lt, Gt, // = < >
  Question, Colon, // ? :
  Amp, Bar, // & |
  At, Dollar, Twiddle, // @ $ ~

  StarStar, // **

  BangEq, // !=
  AmpAmp, BarBar, // && ||
  EqEq, LtEq, GtEq, // == <= >=

  PlusEq, MinusEq, StarEq, SlashEq, // += -= *= /=
  HashEq, PercentEq, // #= %=
  CaretEq, // ^=
  PlusPlus, MinusMinus, // ++ --

  DotDot, CaretCaret, ColonColon, MinusMinusMinus, // .. ^^ :: ---

  GtGt, LtLt, LtGt, AtAt, DollarDollar, // >> << <> @@ $$
  and,  // and

  last,
}

enum Separator {
  first = Operator.last + 1,

  LRound, RRound, // ( )
  LCurly, RCurly, // { }
  LSquare, RSquare, // [ ]
  Dot, Comma, DotDotDot, // . , ...
  Semicolon, // ;

  last,
}

enum Other {
  first = Separator.last + 1,

  Identifier,
  IntegerLiteral,
  FloatLiteral,
  StringLiteral,
  BooleanLiteral,
  NullLiteral,
  Comment,
  Eof,
  Bad,

  last,
}

const Tokenboard: Enumlike = {
  [Operator.Plus]: "+",
  [Operator.Minus]: "-",
  [Operator.Star]: "*",
  [Operator.Slash]: "/",

  [Operator.Hash]: "#",
  [Operator.Percent]: "%",

  [Operator.Caret]: "^",

  [Operator.Bang]: "!",

  [Operator.Eq]: "=",
  [Operator.Lt]: "<",
  [Operator.Gt]: ">",

  [Operator.Question]: "?",
  [Operator.Colon]: ":",

  [Operator.Amp]: "&",
  [Operator.Bar]: "|",

  [Operator.At]: "@",
  [Operator.Dollar]: "$",
  [Operator.Twiddle]: "~",

  [Operator.StarStar]: "**",

  [Operator.BangEq]: "!=",
  [Operator.AmpAmp]: "&&",
  [Operator.BarBar]: "||",
  [Operator.EqEq]: "==",
  [Operator.LtEq]: "<=",
  [Operator.GtEq]: ">=",

  [Operator.PlusEq]: "+=",
  [Operator.MinusEq]: "-=",
  [Operator.StarEq]: "*=",
  [Operator.SlashEq]: "/=",
  [Operator.HashEq]: "#=",
  [Operator.PercentEq]: "%=",
  [Operator.CaretEq]: "^=",
  [Operator.PlusPlus]: "++",
  [Operator.MinusMinus]: "--",

  [Operator.DotDot]: "..",
  [Operator.CaretCaret]: "^^",
  [Operator.ColonColon]: "::",
  [Operator.MinusMinusMinus]: "---",

  [Operator.GtGt]: ">>",
  [Operator.LtLt]: "<<",
  [Operator.LtGt]: "<>",
  [Operator.AtAt]: "@@",
  [Operator.DollarDollar]: "$$",

  [Separator.LRound]: "(",
  [Separator.RRound]: ")",
  [Separator.LCurly]: "{",
  [Separator.RCurly]: "}",
  [Separator.LSquare]: "[",
  [Separator.RSquare]: "]",

  [Separator.Comma]: ",",
  [Separator.Dot]: ".",
  [Separator.DotDotDot]: "...",

  [Separator.Semicolon]: ";",
};

type TokenType = Keyword | Operator | Separator | Other;

type Token<T extends TokenType> = {
  kind: T,
  span: Span,
  value?: T extends Other.BooleanLiteral ? boolean
        : T extends Other.FloatLiteral ? number
        : T extends Other.IntegerLiteral ? number//bigint
        : T extends Other.StringLiteral ? string
        : T extends Other.Identifier ? string
        : T extends Other.Comment ? string
        : undefined,
  originalType?: T extends Other.IntegerLiteral ? "decimal" : undefined,
  isHexFloat?: T extends Other.FloatLiteral ? boolean : undefined,
}

type BadToken = {
  kind: Other.Bad;
  value: string;
}

function isKeyword(e: number): e is Keyword {
  return e in Keyword;
}

function isSeparator(e: number): e is Separator {
  return e in Separator;
}

function isOperator(e: number): e is Operator {
  return e in Operator;
}

// List of all keywords and literals (true/false/null), as strings, to distinguish them from identifiers
const keywordSet: Set<string> = toEach(new Set(peel(enumNames(Keyword))),
                                           (x,y) => x.add(y),
                                           ["true", "false", "null", "and"]);

function isStringKeywordOrLiteral(s: string): boolean {
  return keywordSet.has(s);
}

// tt -> bestringing of tt
function tokenTypeToString(tt: TokenType): string {
  return isKeyword(tt)
    ? Keyword[tt]
    : isSeparator(tt) || isOperator(tt)
      ? Tokenboard[tt]
      : Other[tt];
}

function tokenTypeToLength(tt: Operator | Separator): number {
  return tokenTypeToString(tt).length;
}

// a "φ-or" is an operator with property φ
// the suffix "-or" is pronounced /-ɔr/ with an irreducible vowel
type Unor = Operator.Plus | Operator.Minus
  | Operator.Bang | Operator.Twiddle
// danger: ++ and -- are both unors and assignors; this may be unsafe
  | Operator.PlusPlus | Operator.MinusMinus
  | Keyword.tension | Keyword.controls | Keyword.curl | Keyword.atleast;

type Binor = Operator | Keyword.controls | Keyword.tension;

type Modifactor = Keyword.private | Keyword.public | Keyword.restricted
  | Keyword.explicit | Keyword.interactive;

type Assignor = Operator.Eq
  | Operator.PlusEq | Operator.MinusEq | Operator.StarEq | Operator.SlashEq
  | Operator.HashEq | Operator.PercentEq | Operator.CaretEq
// danger: ++ and -- are both unors and assignors; this may be unsafe
  | Operator.PlusPlus | Operator.MinusMinus;

type Literal = Other.IntegerLiteral | Other.FloatLiteral
  | Other.StringLiteral | Other.BooleanLiteral | Other.NullLiteral;

export { Keyword, Operator, Separator, Other };

export type { Span };
export { DEFSPAN, span, allspan, rightAfter };

export type { BadToken, Token, TokenType };
export type { Binor, Unor, Assignor, Modifactor, Literal };
export { Tokenboard, isKeyword, isOperator, isSeparator, isStringKeywordOrLiteral };
export { tokenTypeToLength, tokenTypeToString };