import "./helper";
import { Real, Pair } from "./number";
import { unitcircle } from "./types";
import Path from "./path";

import { Phrase, PairP } from "./phrase";

import { Grapheme } from "./grapheme";
import lookup from "./keywords";
import { variables } from "./keywords";

import { loudly, proudly } from "./helper";

import lex from "./lexer";
import parse from "./parser";

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as HTMLElement;
const ight = document.getElementById("ight")! as HTMLSpanElement;

const W = svgblock.getBoundingClientRect().width*7/8;
const H = svgblock.getBoundingClientRect().height*7/8;
const ULX = -W/2;
const ULY = -H/2;

asyblock.addEventListener("input", update);
ight.addEventListener("click", twilight);

function update(): void {
  svgblock.innerHTML = transpile(asyblock.value.trim());
//  console.log(svgblock.getBoundingClientRect());
  console.log("we did it");
}

export function bemath(s: string | number): string {
  return MathJax.tex2svg(s).firstChild.outerHTML;
}

window.onload = function() {
  update();
  twilight();
}

function twilight(): void {
  ((ldate, lg) => ((lisday, light) => ((lsun, lmoon) => {
    if (light === lsun || (light === "" && !lisday)) {
      lg(lmoon, (lx) => document.body.classList.add(lx), ["black", "dimgrey", "lightgrey", "blue"]);
    } else if (light === lmoon || (light === "" && lisday)) {
      lg(lsun, (lx) => document.body.classList.add(lx), ["white", "lightgrey", "black", "red"]);
    } else throw new Error([ldate, lisday, light].toString());
  })
  ('☉', ldate.getDate() < 15 ? '☽' : '☾'))
  (Math.abs(ldate.getHours()-12) < 6, ight.innerHTML))
  (new Date(), (light: string, lf: (lx: string) => void, lhues: string[]) => {
    ight.innerHTML = light;
    lf("night");
    ["--bg", "--mg", "--fg", "--shadow"].map((v,k) => [v,lhues[k]])
      .forEach((lxx: string[]) => (document.querySelector(":root") as HTMLElement).style.setProperty(lxx[0], lxx[1]));
  });
}

function transpile(innards: string): string {
  return `<svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}"
           xmlns="http://www.w3.org/2000/svg">${(mill(parse(lex(innards))))}</svg>`;
}

function mill(phrase: Phrase): any {
  if (phrase === undefined) return;
  loudly(`Milling '${phrase.name()}'`);
  switch (phrase.kind()) {
    case Grapheme.Name:
      if (phrase.value() === "let") {
        return ((lx) => (lookup(lx))(phrase.right!.left!.value(), ...[mill(phrase.right!.right!)].flat(Infinity)))(variables.has(phrase.value()) ? variables.get(phrase.value()) : phrase.value());
      } else {
        return ((lx) => (lookup(lx))(...[mill(phrase.right!)].flat(Infinity)))(variables.has(phrase.value()) ? variables.get(phrase.value()) : phrase.value());
      }
    case Grapheme.Plus:
      return mill(phrase.left!).plus(mill(phrase.right!));
    case Grapheme.Minus:
      return (phrase.left ? mill(phrase.left) : new Real(0)).plus(mill(phrase.right!).negate());
    case Grapheme.Star:
      return mill(phrase.left!).times(mill(phrase.right!));
    case Grapheme.Slash:
      return mill(phrase.left!).times(mill(phrase.right!).invert());
    case Grapheme.Comma:
      return phrase instanceof PairP
        ? new Pair(...mill(phrase.right) as [Real, Real])
        : [mill(phrase.left!), mill(phrase.right!)].flat(Infinity);
    case Grapheme.MinusMinus:
      return mill(phrase.left!) instanceof Pair
        ? new Path([mill(phrase.left!), mill(phrase.right!)])
        // todo: why does this proudly get hit so many times
        : proudly(mill(phrase.left!).add(mill(phrase.right!)));
    case Grapheme.Semicolon:
      return mill(phrase.left!)+(phrase.right ? mill(phrase.right) : '');
    case Grapheme.Cycle:
      return phrase.head;
    case Grapheme.Number:
      return new Real(phrase.head.value as number);
    default:
      throw new Error(`idk what this is: ${phrase.name()}`);
  }
}

// todo: add cycle
function path(rest: Pair | Path, last: Pair | typeof Grapheme.Cycle): Path {
  if (rest instanceof Pair) {
    return new Path([rest, last]);
  } else {
    return rest.add(last);
  }
}