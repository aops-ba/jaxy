import _ from "lodash/fp";

import { loudly, proudly } from "./helper";

import { Grapheme } from "./grapheme";
import { Morpheme } from "./morpheme";

export default function lex(asy: string): Morpheme[] {
  const t: number = _.now();
  let lexy: Morpheme[] = [];
  let line: number = 0;
  let index: number = 0;

  ((la) => ((ll) => {
    loudly(`Lexing ${ll} characters…`);
    while (la !== '') {
      ((lnext) => {
        if (isComment(lnext)) {
          loudly(`Skipping '${lnext}' with ${la.length-lnext.length} more on the way…`);
        } else {
          loudly(`Lexing '${lnext}' with ${la.length-lnext.length} more on the way…`);
          ((lt: Morpheme) => {
            if (isWhitespace(lt)) {
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

    proudly(`Lexed ${ll} characters into ${lexy.length} tokens in ${_.now()-t} milliseconds! The lex is:\n
${((lg) => [(lt: Morpheme) => lt.value ?? lt.kind, (lt: Morpheme) => lt.kind].map(lg).join('\n=>\n'))
  ((lf: ($t: Morpheme) => string | number) => lexy.map(lf).join(''))}`);
  })(la.length))(asy+'\n');

  return lexy;
}

function next(asy: string): string {
  return (asy.slice(0,2) === '//')
    ? asy.slice(0, [...asy].findIndex((lc) => /[\n|\r]/.test(lc))+1)
    : asy[0] === '"'
      ? asy.slice(0, [...asy].slice(1).findIndex((lc) => lc === '"')+2)
      : asy.slice(0, Math.max(1, ((li) => li === -1 ? asy.length : li)
                               ([...asy].findIndex((_,k) => !alphanumeric(asy.slice(0, k+1))
                                                         && !Object.values(Grapheme).includes(asy.slice(0, k+1)))
                                ?? asy.length)));
}

function lookup(chars: string, index: number): Morpheme {
  if (/^['|"].*['|"]$/.test(chars)) {
    return morph(Grapheme.String, index, chars);
  } else if (numeric(chars)) {
    return morph(Grapheme.Number, index, +chars);
  } else if (Object.values(Grapheme).includes(chars as typeof Grapheme)) {
    return morph(chars as typeof Grapheme, index);
  } else {
    return morph(Grapheme.Name, index, chars);
  }
}

function morph(name: typeof Grapheme, index: number, value?: string | number): Morpheme {
  return new Morpheme(name, [index, index+(value?.toString() ?? name).length], { value: value });
}

export function isNewline(token: Morpheme): boolean {
  return token.kind === Grapheme.CR || token.kind === Grapheme.Newline;
}

export function isSpacetab(token: Morpheme): boolean {
  return token.kind === Grapheme.Space || token.kind === Grapheme.Tab;
}

export function isWhitespace(token: Morpheme): boolean {
  return isNewline(token) || isSpacetab(token);
}

export function isComment(s: string): boolean {
  return s.slice(0,2) === '//' && ['\n', '\r'].includes(s.at(-1) ?? "");
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