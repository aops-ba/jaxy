import { loudly } from "./helper";

import { Token } from "./tokens";
import { Lexeme } from "./tokens";

const yelling: boolean = false;

export default function lex(asy: string): Token[] {
  const t: number = new Date().getTime();
  let lexy: Token[] = [];
  let line: number = 0;
  let index: number = 0;

  ((la) => ((ll) => {
    yell(`Lexing ${ll} characters…`);
    while (la !== '') {
      ((lnext) => {
        if (isComment(lnext)) {
          yell(`Skipping '${lnext}' with ${la.length-lnext.length} more on the way…`);
        } else {
          yell(`Lexing '${lnext}' with ${la.length-lnext.length} more on the way…`);
          ((lt: Token) => {
            if (whitespace(lt)) {
              line++;
              index = 0;
            } else {
              lexy.push(lt);
            }
          })(lookup(lnext, index))
        };
        la = la.slice(lnext.length);
        index += lnext.length;
      })(next(la));
    }

    yell(`Lexed ${ll} characters into ${lexy.length} tokens in ${new Date().getTime()-t} milliseconds! The lex is:\n
${((lg) => [(lt: Token) => lt.value ?? lt.kind, (lt: Token) => lt.kind].map(lg).join('\n=>\n'))
  ((lf: ($t: Token) => string | number) => lexy.map(lf).join(''))}`);
  })(la.length))(asy+'\n');

  return lexy;
}

function next(asy: string): string {
  if (asy.slice(0,2) === '//') return asy.slice(0, [...asy].findIndex((lc) => /\n/.test(lc))+1);
  return asy.slice(0, Math.max(1, ((li) => li === -1 ? asy.length : li)
    ([...asy].findIndex((_,k) => !alphanumeric(asy.slice(0, k+1))
                              && !Object.values(Lexeme).includes(asy.slice(0, k+1)))
    ?? asy.length)));
}

function lookup(chars: string, index: number): Token {
  if (/^['|"].*['|"]$/.test(chars)) {
    return betoken(Lexeme.String, index, chars);
  } else if (numeric(chars)) {
    return betoken(Lexeme.Number, index, +chars);
  } else if (Object.values(Lexeme).includes(chars as typeof Lexeme)) {
    return betoken(chars as typeof Lexeme, index);
  } else {
    return betoken(Lexeme.Name, index, chars);
  }
}

function betoken(name: typeof Lexeme, index: number, value?: string | number): Token {
  return new Token(name, {value: value, span: [index, index+(value?.toString().length ?? name.length)]});
}

export function newline(token: Token): boolean {
  return token.kind === Lexeme.CR || token.kind === Lexeme.Newline;
}

export function spacetab(token: Token): boolean {
  return token.kind === Lexeme.Space || token.kind === Lexeme.Tab;
}

export function whitespace(token: Token): boolean {
  return newline(token) || spacetab(token);
}

export function isComment(s: string): boolean {
  return s.slice(0,2) === '//' && s.at(-1) === '\n';
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

function yell(s: any): void {
  if (yelling) console.log(s);
}