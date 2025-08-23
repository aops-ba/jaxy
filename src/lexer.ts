import { chain, loudly, assert } from "./helpers.ts";

enum Token {
  Identifier,
  If, Else,
  String, Number,
  RoundL, RoundR, CurlyL, CurlyR, SquareL, SquareR,
  Comma, Colon, Semicolon,
  Comment,
  Plus, Minus, Times, Divide,
}

type token = {
  name: Token,
  value?: string | number,
  span: [number, number],
}

export function lex(asy: string, index: number=0): Array<token> {
  return asy === ''
    ? []
    : ((next) => (next ? [betoken(next, index)] : []).concat(lex(asy.slice(next.length), index+next.length)))(next(asy));
}

function next(asy: string): string {
  if (/^\s*$/.test(asy[0])) return ''; // todo: test this
  else return asy[0] + (asy.length > 1 && alphabetic(asy[0], asy[1]) ? next(asy.slice(1)) : '');
}

function betoken(chars: string, index: number): token {
  if (/^['|"].*['|"]$/.test(chars)) return { name: Token.String, value: chars, span: [index, index+chars.length] };
  else if (numeric(chars)) return { name: Token.Number, value: +chars, span: [index, index+chars.length] };
  else if (chars === 'if') return { name: Token.If, value: chars, span: [index, index+chars.length] };
  else if (chars === 'else') return { name: Token.Else, value: chars, span: [index, index+chars.length] };
  else if (chars === '(') return { name: Token.RoundL, span: [index, index+1] };
  else if (chars === ')') return { name: Token.RoundR, span: [index, index+1] };
  else if (chars === '+') return { name: Token.Plus, span: [index, index+1] };
  else if (chars === '-') return { name: Token.Minus, span: [index, index+1] };
  else if (chars === ',') return { name: Token.Comma, span: [index, index+1] };
  else if (chars === ';') return { name: Token.Semicolon, span: [index, index+1] };
  else return { name: Token.Identifier, value: chars, span: [index, index+chars.length] };
}

function alphabetic(...ss: string[]): boolean | boolean[] {
  return ss.every((s) => /^[a-zA-Z]+$/.test(s));
}

function numeric(...ss: string[]): boolean | boolean[] {
  return ss.every((s) => /^\d+$/.test(s));
}

function alphanumeric(...ss: string[]): boolean | boolean[] {
  return ss.every((s) => alphabetic(s) && numeric(s));
}

function somewhatLoudly(tokens: Array<token>): Array<token> {
  console.log(tokens.map((x) => Token[x.name]).join(','));
  return tokens;
}