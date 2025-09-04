import { defineBuiltin } from "./builtins";

import _ from "lodash/fp";
import Render, { scaling } from "./render";

import { Real, Pair } from "./number";
import Path from "./path";

import { Grapheme } from "./grapheme";
import { lookup } from "./render";
import { variables } from "./render";

import { loudly, shed, weep } from "./helper";

import lex from "./lexer";
import parse from "./parser";
import { Percy } from "./percy";
import { Phrase, CompilationUnitPhrase } from "./model";

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as HTMLElement;
const ight = document.getElementById("ight")! as HTMLSpanElement;
const thgi = document.getElementById("thgi")! as HTMLSpanElement;

// Randy (they/them) the renderer.
// cf. Lexy (she/they) the lexer and Percy (he/they) the parser.
export const randy: Render = new Render(svgblock);

window.onload = function() {
  asyblock.addEventListener("input", () => transpile());
  window.addEventListener("resize", () => randy.render());
  ight.addEventListener("click", () => twilight());
  thgi.addEventListener("click", () => truesight());

  twilight();
  truesight();
  transpile();
}

function twilight(): void {
  ((ldate: Date) => 
  ((lsun: string, lmoon: string) => 
  ((lwhich: boolean) =>
  ((light: string) =>
  ((lhues: string[]) => {
    ight.innerHTML = light;
    _.each ((lxx: [string, string]) => document.body.style.setProperty(lxx[0], lxx[1]))
           (_.zip (["--bg", "--mg", "--fg", "--shadow"])
                  (lhues));
  }
  ) (lwhich ? ["dimgrey", "black", "white", "blue"] : ["lightgrey", "white", "black", "red"])
  ) (lwhich ? lmoon : lsun)
  ) (ight.innerHTML === lsun || (ight.innerHTML === "" && Math.abs(ldate.getHours()-12) > 6))
  ) ('☉', ldate.getDate() < 15 ? '☽' : '☾')
  ) (new Date())
  ;
}

function truesight(): void {
  ((lopen, lclosed) =>
  ((lasleep: boolean) =>
  _.map (([lwhich, ly, ln]: string[]) => {
    _.each ((le: HTMLElement) => le.style.setProperty("display", lasleep ? ly : ln))
           (document.getElementsByClassName(lwhich));
    thgi.innerHTML = lasleep ? lopen : lclosed;
  }
  ) ([["open", "block", "none"], ["closed", "none", "block"]])
  ) (thgi.innerHTML === lclosed)
  ) ('ɮ', 'ɬ');
}
let trey: CompilationUnitPhrase;

function transpile(): void {
  try {
    console.clear();
    trey = new Percy(asyblock.value.trim()).consumeCompilationUnit();
    randy.update(trey.decls.map(_ => trey.understandNext()) as (($s: scaling) => string)[]).render();
//    randy.update(understand(parse(lex(asyblock.value.trim())))).render();
    console.log("we did it");
  } catch (e) {
    throw new Error(`we didn't do it: ${e}`);
  }
}

//function understand(phrase: Phrase | undefined): any {
//  loudly(`Milling '${phrase?.name()}'`);
//  if (phrase === undefined) {
//    return;
//  }
//
//  switch (phrase.kind()) {
//    // todo: these should be morphemes
//    case Grapheme.Name:
//      if (phrase.value() === "let") {
//        console.log(phrase);
//        return (lookup(phrase.value()))([phrase.right?.left?.value(), _.flatten([understand(phrase.right?.right!)])]);
//      } else {
//        return (lookup(phrase.value()) ?? variables.get(phrase.value() as string))(_.flatten([understand(phrase.right!)]));
//      }
//    case Grapheme.Plus:
//      return understand(phrase.left!).plus(understand(phrase.right!));
//    case Grapheme.Minus:
//      return (understand(phrase.left) ?? new Real(0)).plus(understand(phrase.right!).negate());
//    case Grapheme.Star:
//      return understand(phrase.left!).times(understand(phrase.right!));
//    case Grapheme.Slash:
//      return understand(phrase.left!).times(understand(phrase.right!).invert());
//    case Grapheme.Comma:
//      return phrase instanceof PairP
//        ? Pair.fromArray(understand(phrase.right))
//        : _.flatten([understand(phrase.left!), understand(phrase.right!)]);
//    case Grapheme.MinusMinus:
//      return ((lw) => lw instanceof Pair
//        ? new Path([lw, understand(phrase.right!)])
//        : (lw as Path).add(understand(phrase.right!))
//      ) (shed(understand(phrase.left!)));
//    case Grapheme.Semicolon:
//      return _.compact(_.flattenDeep([understand(phrase.left), understand(phrase.right)]));
//    case Grapheme.Cycle:
//      return "cycle";
//    case Grapheme.Number:
//      return new Real(phrase.head.value as number);
//    case Grapheme.String:
//      return phrase.head.value as string;
//    default:
//      throw new Error(`idk what this is: ${phrase.name()}`);
//  }
//}