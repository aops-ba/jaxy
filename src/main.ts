import _ from "lodash/fp";

import Render from "./render";

import { Real, Pair } from "./number";
import { unitcircle } from "./types";
import Path from "./path";

import { Phrase, PairP } from "./phrase";

import { Grapheme } from "./grapheme";
import { lookup } from "./render";
import { variables } from "./render";

import { loudly, proudly, molt, shell } from "./helper";

import lex from "./lexer";
import parse from "./parser";
import { flattenDeep } from "lodash";

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as HTMLElement;
const ight = document.getElementById("ight")! as HTMLSpanElement;

export function bemath(s: string | number): string {
  return s.toString();
//  return MathJax.tex2svg(s).firstChild.outerHTML;
}

export const randy: Render = new Render(svgblock);

window.onload = function() {
  asyblock.addEventListener("input", () => transpile());
  window.addEventListener("resize", () => randy.render());
  ight.addEventListener("click", () => twilight());
  transpile();
  twilight();
}

function twilight(): void {
  ((ldate: Date) => 
  ((lsun: string, lmoon: string) => 
  ((lwhich: boolean) =>
  _.curry ((light: string, lhues: string[]) => {
    ight.innerHTML = light;
    _.each ((lxx: [string, string]) => document.body.style.setProperty(lxx[0], lxx[1]))
           (_.zip (["--bg", "--mg", "--fg", "--shadow"]) (lhues))
    ;
  }
  )(lwhich ? lmoon : lsun)
   (lwhich ? ["black", "dimgrey", "lightgrey", "blue"] : ["white", "lightgrey", "black", "red"])
  )(ight.innerHTML === lsun || (ight.innerHTML === "" && Math.abs(ldate.getHours()-12) > 6))
  )('☉', ldate.getDate() < 15 ? '☽' : '☾')
  )(new Date())
  ;
}

function transpile(): void {
  randy.update(weyd(parse(lex(asyblock.value.trim())))).render();
}

function weyd(phrase: Phrase): any {
  console.log(phrase, typeof phrase);
  if (phrase === undefined) {
    return;
  }
  loudly(`Milling '${phrase.name()}'`);
  switch (phrase.kind()) {
    // todo: these should be morphemes
    case Grapheme.Name:
//      return ((l) => (lookup(l))(loudly(shell(phrase.right!))))(phrase.value());
//      if (phrase.value() === "let") {
//        return ((lx) => (lookup(lx))(phrase.right!.left!.value(), ...[weyd(phrase.right!.right!)].flat(Infinity)))(variables.has(phrase.value()) ? variables.get(phrase.value()) : phrase.value());
//      } else {
        return ((lx) => (lookup(lx))(...[weyd(phrase.right!)].flat(Infinity)))(variables.has(phrase.value()) ? variables.get(phrase.value()) : phrase.value());
//      }
    case Grapheme.Plus:
      return weyd(phrase.left!).plus(weyd(phrase.right!));
    case Grapheme.Minus:
      return (phrase.left ? weyd(phrase.left) : new Real(0)).plus(weyd(phrase.right!).negate());
    case Grapheme.Star:
      return weyd(phrase.left!).times(weyd(phrase.right!));
    case Grapheme.Slash:
      console.log(phrase);
      return weyd(phrase.left!).times(weyd(phrase.right!).invert());
    case Grapheme.Comma:
      return phrase instanceof PairP
        ? new Pair(...weyd(phrase.right) as [Real, Real])
        : [weyd(phrase.left!), weyd(phrase.right!)].flat(Infinity);
    case Grapheme.MinusMinus:
      return weyd(phrase.left!) instanceof Pair
        ? new Path([weyd(phrase.left!), weyd(phrase.right!)])
        // todo: why does proudlying this make it print so many times
        : weyd(phrase.left!).add(weyd(phrase.right!));
    case Grapheme.Semicolon:
      return ((lx) => typeof lx === "string" ? lx : '')(weyd(phrase.left!))+(phrase.right ? weyd(phrase.right) : '');
    case Grapheme.Cycle:
      return phrase.head;
    case Grapheme.Number:
      return new Real(phrase.head.value as number);
    default:
      throw new Error(`idk what this is: ${phrase.name()}`);
  }
}