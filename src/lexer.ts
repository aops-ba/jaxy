import { loudly } from "./helper";
import { Lexeme } from "./tokens";

const yelling: boolean = true;

export type Token = {
  kind: typeof Lexeme,
  value?: string | number,
  span: [number, number],
}

export const GodToken: Token = { kind: Lexeme.God, span: [-Infinity, Infinity] };

export default function lex(asy: string): Token[] {
  const t: number = new Date().getTime();
  let lexy: Token[] = [];
  let line: number = 0;
  let index: number = 0;

  ((ll) => {
    yell(`Lexing ${ll} characters…`);
    while (asy !== '') {
      ((lnext) => {
        yell(`Lexing '${lnext}' with ${asy.length-lnext.length} more on the way…`);
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

    yell(`Lexed ${ll} characters into ${lexy.length} tokens in ${new Date().getTime()-t} milliseconds! The lex is:
${((lg) => [(lt: Token) => lt.value ?? lt.kind, (lt: Token) => lt.kind].map(lg).join(' => '))
  ((lf: ($t: Token) => string | number) => lexy.map(lf).join(''))}`);
  })(asy.length);

  return lexy;
}

function next(asy: string): string {
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
  return { kind: name, value: value, span: [index, index+(value?.toString().length ?? name.length)] };
}

function newline(token: Token): boolean {
  return token.kind === Lexeme.CR || token.kind === Lexeme.Newline;
}

function whitespace(token: Token): boolean {
  return newline(token) || token.kind === Lexeme.Space || token.kind === Lexeme.Tab;
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

function yell(s: string): void {
  if (yelling) console.log(s);
}