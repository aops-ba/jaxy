import { loudly } from "./helper.ts";

export type Token = {
  kind: TokenEnum,
  value?: string | number,
  span: [number, number],
}

export enum TokenEnum {
  GodEnum = 'א',
  Start = 'start', End = 'end',
  Identifier = 'id',
  If = 'if', Else = 'else',
  String = '$', Number = '#',
  RoundL = '(', RoundR = ')', CurlyL = '{', CurlyR = '}', SquareL = '[', SquareR = ']',
  Comma = ',', Colon = ':', Semicolon = ';',
  Comment = '//',
  Plus = '+', Minus = '-', Times = '*', Divide = '/',
  Space = ' ', Tab = '\t', Newline = '\n', CR = '\r',
}

export const GodToken: Token = { kind: TokenEnum.GodEnum, span: [-Infinity, Infinity] };

export default function lex(asy: string): Token[] {
  console.log(`Lexing ${asy.length} characters…`);

  const t: number = new Date().getTime();
  let lexy: Token[] = [];
  let line: number = 0;
  let index: number = 0;

  while (asy !== '') {
    ((lnext) => {
      console.log(`Lexing ${lnext} with ${asy.length-lnext.length} characters on the way…`);
      ((lt: Token) => {
        if (whitespace(lt)) {
          if (newline(lt)) {
            line++;
            index = 0;
          }
        } else {
          lexy.push(lt);
        }
      })(lookup(lnext, index));
      asy = asy.slice(lnext.length);
      index += lnext.length;
    })(next(asy));
  }

  console.log(`Lexed ${lexy.length} tokens in ${new Date().getTime()-t} milliseconds!`);
  console.log(((lg) => [(lt: Token) => lt.value ?? lt.kind, (lt: Token) => lt.kind].map(lg).join(' => '))
              ((lf: ($t: Token) => string | number) => lexy.map(lf).join('')));

  return lexy;
}

function next(asy: string): string {
  return asy.slice(0, Math.max(1, ((li) => li === -1 ? asy.length : li)([...asy].findIndex((s) => !alphanumeric(s)) ?? asy.length)));
}

function lookup(chars: string, index: number): Token {
  if (/^['|"].*['|"]$/.test(chars)) {
    return betoken(TokenEnum.String, index, chars);
  } else if (numeric(chars)) {
    return betoken(TokenEnum.Number, index, +chars);
  } else if (Object.values(TokenEnum).includes(chars as TokenEnum)) {
    return betoken(chars as TokenEnum, index);
  } else {
    return betoken(TokenEnum.Identifier, index, chars);
  }
}

function betoken(name: TokenEnum, index: number, value?: string | number): Token {
  return { kind: name, value: value, span: [index, index+(value?.toString().length ?? name.length)] };
}

function newline(token: Token): boolean {
  return token.kind === TokenEnum.CR || token.kind === TokenEnum.Newline;
}

function whitespace(token: Token): boolean {
  return newline(token) || token.kind === TokenEnum.Space || token.kind === TokenEnum.Tab;
}

function alphabetic(...ss: string[]): boolean {
  return ss.every((s) => /^[a-zA-Z]+$/.test(s));
}

function numeric(...ss: string[]): boolean {
  return ss.every((s) => /^\d+$/.test(s));
}

function alphanumeric(...ss: string[]): boolean {
  return ss.every((s) => alphabetic(s) || numeric(s));
}