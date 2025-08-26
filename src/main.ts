import "./global.d";

import { Pair, Path, AsyNumber } from "./types";

import { Phrase, PairP } from "./parser";

import { Lexeme } from "./tokens";
import lookup from "./keywords";

import { loudly, timely, assert } from "./helper";

import lex from "./lexer";
import parse from "./parser";

const yelling: boolean = false;

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

// todo: compute these based on bounding box (which also needs computed)
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

window.onload = function() {
  Array.from(document.getElementsByTagName("script"))
    .filter((lscript) => lscript.getAttribute("type") === "text/asy")
    .forEach((lscript) => lscript.outerHTML = transpile(lscript.innerHTML.trim()));
}

function transpile(innards: string): string {
  return ((lmilled) => {
    return `<svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${lmilled}
    </svg>`;
  })(mill(parse(lex(innards))));
}

// the mill that turns phrases into strings
// nb: this analogy no longer works since the phrases aren't called trees anymore
function mill(phrase: Phrase): any {
  if (!phrase) return;
  yell(`Milling '${phrase.name()}'…`);
  switch (phrase.kind()) {
    case Lexeme.Name:
      return (lookup(phrase.value()))([mill(phrase.right!)].flat());
    case Lexeme.Plus:
      return mill(phrase.left!) + mill(phrase.right!);
    case Lexeme.Minus:
      return (phrase.left ? mill(phrase.left) : 0) + negate(mill(phrase.right!));
    case Lexeme.Star:
      return mill(phrase.left!) * mill(phrase.right!);
    case Lexeme.Slash:
      return mill(phrase.left!) / mill(phrase.right!);
    case Lexeme.Comma:
      if (phrase instanceof PairP) {
        return new Pair(...mill(phrase.right!) as [number, number]);
      } else {
        return [mill(phrase.left!), mill(phrase.right!)].flat(Infinity);
      }
    case Lexeme.MinusMinus:
      return path(mill(phrase.left!), mill(phrase.right!));
    case Lexeme.Semicolon:
      return mill(phrase.left!)+(phrase.right ? mill(phrase.right) : '');
    case Lexeme.Cycle:
      return phrase.token.value;
    case Lexeme.Number:
      return new AsyNumber(phrase.token.value);
    default:
      complain(phrase.name());
  }
}

function yell(s: any): void {
  if (yelling) console.log(s);
}

function complain(complaint: string) {
  throw new Error(`What the heck is this: ${complaint}`);
}

// todo: fix this
function path(rest: Pair | Path, last: Pair): Path {
  if (rest instanceof Pair) {
    return new Path([rest, last]);
  } else {
    return rest.add(last);
  }
}

function negate(arg: number): number {
  return -arg;
}