enum Other {
  God = 'א',
  Name = 'id',
}

enum Literal {
  String,
  Number,
}

enum Keyword {
  Operator = 'operator',
  Struct = 'struct',
  New = 'new',
  If = 'if',
  Else = 'else',
  Cycle = 'cycle',
}

enum Separator {
  Dot = '.',
  Comma = ',',
  Colon = ':',
  Semicolon = ';',
  DotDotDot = '...',

  RoundL = '(',
  RoundR = ')',
  CurlyL = '{',
  CurlyR = '}',
  SquareL = '[',
  SquareR = ']',
}

enum Operator {
  Plus = '+',
  Minus = '-',
  Star = '*',
  Slash = '/',
  Hash = '#',
  Percent = '%',
  Caret = '^',
  Eq = '=',
  Bang = '!',
  Lt = '<',
  Gt = '>',

  DotDot = '..',
  CaretCaret = '^^',
  MinusMinusMinus = '---',

  Dollar = '$',
  At = '@',
  Question = '?',
  Colon = ':',
  Amp = '&',
  Bar = '|',

  PlusEq = '+=',
  MinusEq = '-=',
  StarEq = '*=',
  SlashEq = '/=',
  HashEq = '#=',
  PercentEq = '%=',
  CaretEq = '^=',
  EqEq = '==',
  BangEq = '!=',
  LtEq = '<=',
  GtEq = '>=',

  PlusPlus = '++',
  MinusMinus = '--',

  AmpAmp = '&&',
  BarBar = '||',
  GtGt = '>>',
  LtLt = '<<',
  LtGt = '<>',
  DollarDollar = '$$',
  AtAt = '@@',
}

enum Whitespace {
  Space = ' ',
  Tab = '\t',
  Newline = '\n',
  CR = '\r',
}

const Lexeme = Object.assign({}, Other, Literal, Keyword, Operator, Separator, Whitespace);

class Token {
  kind: typeof Lexeme;
  value?: string | number;
  span?: [number, number];

  constructor(kind: typeof Lexeme, options?: {value?: string | number, span?: [number, number]}) {
    this.kind = kind;
    this.value = options?.value;
    this.span = options?.span;
  }

  name(): string {
    return this.value ?? this.kind;
  }
}

const GodToken = new Token(Lexeme.God, {span: [-Infinity, Infinity]});

export { Lexeme, Token, GodToken };