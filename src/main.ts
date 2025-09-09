import _ from "lodash/fp";

import Percy from "./parser";
import Randy from "./render";
import { AllP } from "./piler";
import { hurriedly, loudly, roughly } from "./helper";

const asyblock = document.getElementById("asy")! as HTMLTextAreaElement;
const svgblock = document.getElementById("svg")! as unknown as SVGGraphicsElement;
const eyes = document.getElementById("eyes")! as HTMLSpanElement;
const ears = document.getElementById("ears")! as HTMLSpanElement;

window.onload = function() {
  asyblock.addEventListener("input", () => transpile());
  window.addEventListener("resize", () => randy.render());
  eyes.addEventListener("click", () => twilight());
  ears.addEventListener("click", () => truesight());

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
    eyes.innerHTML = light;
    _.each ((lxx: [string, string]) => document.body.style.setProperty(lxx[0], lxx[1]))
           (_.zip (["--bg", "--mg", "--fg", "--shadow"])
                  (lhues));
  }
  ) (lwhich ? ["dimgrey", "black", "white", "blue"] : ["lightgrey", "white", "black", "red"])
  ) (lwhich ? lmoon : lsun)
  ) (eyes.innerHTML === lsun || (eyes.innerHTML === "" && Math.abs(ldate.getHours()-12) > 6))
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
    ears.innerHTML = lasleep ? lopen : lclosed;
  }
  ) ([["open", "block", "none"], ["closed", "none", "block"]])
  ) (ears.innerHTML === lclosed)
  ) ('ɮ', 'ɬ');
}

// Lexy (she/they) the lexer,
// Percy (he/they) the parser,
// Randy (they/them) the renderer,
// Mindy (he/she) the minder/piler/understander.
// the merx
// we all live together in a happy world

export const randy: Randy = new Randy(svgblock);

async function transpile(): Promise<void> {
  console.clear();
  try {
    await randy.update(new Percy(asyblock.value.trim()).parse().understandAll()).render();
    loudly("we did it");
  } catch (e) {
    roughly(`we didn't do it: ${e}`);
  }
}