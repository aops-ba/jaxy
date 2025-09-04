import _ from "lodash/fp";

import { randy } from "./main";

import { Grapheme } from "./grapheme";

import { Pair, Real } from "./number";
import { origin, N, S, E, W } from "./number";

import Path from "./path";

import { Dot, Arc, Circle } from "./arc";
import { unitcircle } from "./arc";

import type { Pen } from "./pen";
import { defaultpen, penboard } from "./pen";
import Label from "./label";
import { loudly, shed, weep } from "./helper";
import { Keyword, Operator, Other, Token, Tokenboard } from "./tokens";
import { defineBuiltin } from "./builtins";

const MathJax = window["MathJax" as keyof typeof window];

type BBox = {
  width: number,
  height: number,
  minx: number,
  miny: number
};

type scaling = { x: number, y: number };

export default class Render {
  static UP = -1; // asy up = svg down
  static PT = 1; // 1pt = 1pt
  static PX = 4/3; // 3px = 4pt
  static INCH = 72; // 1in = 72pt
  static CM = Render.INCH*50/127; // 127cm = 50in
  static MM = Render.CM*10; // 127cm = 50in
  static DEFAULTSIZE = 40; // empirical painful
  static SCALE = 3/2; // empirical painful

  svgblock: HTMLElement;
  wisdom: (($s: scaling) => string)[];
  scaling: scaling;

  constructor(svgblock: HTMLElement) {
    this.svgblock = svgblock;
    ((l) => {
      this.svgblock.setAttribute("width", `${l.width}`);
      this.svgblock.setAttribute("height", `${l.height}`);
    })(this.bbox());

    this.wisdom = [];
    this.scaling = { x: 0, y: 0 };
    console.log(window.devicePixelRatio);
  }

  size(x: number, y?: number): ($s: scaling) => string {
    return ((ls: scaling) => {
      ls.x = x/(20/3);
      ls.y = (y ?? x)*Render.UP/(20/3);
      return "";
    });
  }

  update(knowledge: (($s: scaling) => string)[]): Render {
    this.wisdom = [this.size(Render.DEFAULTSIZE, Render.DEFAULTSIZE)].concat(_.compact (_.flattenDeep (knowledge)));
    return this;
  }

  async render(): Promise<void> {
    await (async (l): Promise<void> => { // this should really be outpulling all the size setters and applying only the last one
      this.svgblock.innerHTML = `${_.join ('')
                                          (_.map ((ls: ($s: scaling) => string) => ls(this.scaling))
                                                 (this.wisdom))}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.width} ${l.height}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");

      await MathJax.typesetPromise();

      (_.each ((lf: Element) => ((lr: DOMRect) => {
        lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
        lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
        lf.setAttribute("width", ''+lr.width);
        lf.setAttribute("height", ''+lr.height);
      }) (lf.firstElementChild!.getBoundingClientRect()))
      ) (document.getElementsByTagName("foreignObject"))
 ;     
//    );
    })(this.bbox());
  }

  private bbox(): BBox {
    return ((l) => ({
      width: l.width,
      height: l.height,
      minx: -l.width/2,
      miny: -l.height/2
    }))(this.svgblock.getBoundingClientRect());
  }
}

let variables: Map<string, any> = new Map();

export const nameboard = new Map<string, Function>([
  //todo: get rid of randy
  ["size", ([x,y=x]: number[]) => randy.size(x, y)],
  ["write", (s: string[]) => console.log(shed(s))],

  ["draw", draw],
  ["fill", fill],
  ["filldraw", filldraw],
  ["label", label],

  ["dot", dot],
  ["circle", ([c,r]: [Pair, number]) => new Circle(c, Number(r))],
  ["dir", (p: Path | number, q?: Path) => Pair.dir(p, q)],
  ["degrees", (lz: Pair) => new Real(lz.degrees())],
  ["conjugate", (lz: Pair) => lz.conjugate()],
  ["unitcircle", () => unitcircle],
  ["origin", () => origin],
  ["N", () => N],
  ["S", () => S],
  ["E", () => E],
  ["W", () => W],
  ["inches", () => Render.INCH],
  ["cm", () => Render.CM],
  ["mm", () => Render.MM],
  ["pt", () => Render.PT],
  defineBuiltin("+", "real(real, real)", (x, y) => x + y),
  ...penboard,
] as [string, Function][]);

function lookup(thing: Token<Keyword | Operator | Other.Identifier> | null): any {
  if (thing === null) return;
  return (lname => {
    return nameboard.has(lname) ? nameboard.get(lname) : () => thing;
  }) ("value" in thing ? thing.value as string : Tokenboard[thing.kind]);
}

function draw([path, ps]: [Path | Arc, Pen]): ($scaling: scaling) => string {
  return path.show({ fill: undefined, stroke: ps ?? defaultpen });
}

function fill([path, pf]: [Path | Arc, Pen]): ($scaling: scaling) => string {
  return path.show({ fill: pf, stroke: undefined });
}

function filldraw([path, pf, ps]: [Path | Arc, Pen, Pen]): (($scaling: scaling) => string)[] {
  return [draw([path, ps]), fill([path, pf])];
}

// todo: calibrate label appearance
function label([text, position, pf]: [string, Pair, Pen]): ($scaling: scaling) => string {
  return new Label(text, position).show({ fill: pf, stroke: undefined });
}

type Align = Pair;
// todo: calibrate dot size
function dot([pair, pf, text, align]: [Pair, Pen, string, Pair]): ($scaling: scaling) => string {
  return fill([new Dot(pair, text, align), pf ?? defaultpen]);
}

export { scaling, variables, lookup, Align };