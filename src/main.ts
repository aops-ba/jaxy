import _ from "lodash/fp";

import Percy from "./percy";
import Randy from "./randy";
import { Scaling } from "./randy";
import { AllP } from "./model";

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as HTMLElement;
const ight = document.getElementById("ight")! as HTMLSpanElement;
const thgi = document.getElementById("thgi")! as HTMLSpanElement;

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

// Lexy (she/they) the lexer,
// Percy (he/they) the parser,
// Randy (they/them) the renderer.

export const randy: Randy = new Randy(svgblock);
let tree: AllP;

function transpile(): void {
  try {
    console.clear();
    tree = new Percy(asyblock.value.trim()).parse();
    randy.update(tree.decls.map(_ => tree.understandNext()) as (($s: Scaling) => string)[]).render();
    console.log("we did it");
  } catch (e) {
    throw new Error(`we didn't do it: ${e}`);
  }
}