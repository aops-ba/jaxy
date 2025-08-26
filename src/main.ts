import { Real, Pair } from "./field";
import { unitcircle } from "./types";
import Path from "./path";

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

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as HTMLDivElement;

const W = svgblock.getBoundingClientRect().width*7/8;
const H = svgblock.getBoundingClientRect().height*7/8;
const ULX = -W/2;
const ULY = -H/2;

asyblock.addEventListener("input", update);

function update(): void {
  svgblock.innerHTML = transpile(asyblock.value.trim());
}

window.onload = function() {
  update();
}

function transpile(innards: string): string {
  return `<svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}"
           xmlns="http://www.w3.org/2000/svg">${(mill(parse(lex(innards))))}</svg>`;
}

function mill(phrase: Phrase): any {
  if (phrase === undefined) return;
  yell(`Milling '${phrase.name()}'`);
  switch (phrase.kind()) {
    case Lexeme.Name:
      return (lookup(phrase.value()))(mill(phrase.right!));
    case Lexeme.Plus:
      return mill(phrase.left!).plus(mill(phrase.right!));
    case Lexeme.Minus:
      return (phrase.left ? mill(phrase.left) : new Real(0)).plus(mill(phrase.right!).negate());
    case Lexeme.Star:
      return mill(phrase.left!).times(mill(phrase.right!));
    case Lexeme.Slash:
      return mill(phrase.left!).times(mill(phrase.right!).invert());
    case Lexeme.Comma:
      return phrase instanceof PairP
        ? new Pair(...mill(phrase.right) as [Real, Real])
        : [mill(phrase.left!), mill(phrase.right!)].flat(Infinity);
    case Lexeme.MinusMinus:
      return path(mill(phrase.left!), mill(phrase.right!));
    case Lexeme.Semicolon:
      return mill(phrase.left!)+(phrase.right ? mill(phrase.right) : '');
    case Lexeme.Cycle:
      return phrase.token;
    case Lexeme.Number:
      return new Real(phrase.token.value as number);
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

// todo: add cycle
function path(rest: Pair | Path, last: Pair | typeof Lexeme.Cycle): Path {
  if (rest instanceof Pair) {
    return new Path([rest, last]);
  } else {
    return rest.add(last);
  }
}