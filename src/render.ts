import { loudly, proudly } from "./helper";

import _ from "lodash/fp";

import { randy } from "./main";

import { Grapheme } from "./grapheme";

import { Pair, Real } from "./number";
import { origin, N, S, E, W } from "./number";

import Path from "./path";

import { Arc, Circle } from "./arc";
import { unitcircle } from "./arc";

import type { Pen, Pens } from "./pen";
import { defaultpen, penboard } from "./pen";
import Label from "./label";

const MathJax = window["MathJax" as keyof typeof window];

type BBox = {
  width: number,
  height: number,
  minx: number,
  miny: number
};

type scaling = { x: number, y: number };

interface Seen {
  show(): ($pens: Pens) => ($scaling: scaling) => string;
}

export default class Render {
  static UP = -1; // asy up = svg down
  static PT = 1; // 1pt = 1pt
  static PX = 4/3; // 3px = 4pt
  static INCH = 72; // 1in = 72pt
  static CM = Render.INCH*50/127; // 127cm = 50in
  static MM = Render.CM*10; // 127cm = 50in

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
    this.scaling = { x: 1, y: 1*Render.UP };
    console.log(window.devicePixelRatio);
  }

//  resize(svg: HTMLElement) {
//    this.svgblock.setAttribute("width", `${l.width}`);
//    this.svgblock.setAttribute("height", `${l.height}`);
//  }

  size(x: number, y?: number): void {
    this.scaling.x = x;
    this.scaling.y = (y ?? x)*Render.UP;
  }

  update(knowledge: (($s: scaling) => string)[]): Render {
    this.wisdom = knowledge;
    return this;
  }

  render(): void {
    ((l) => { // this should really be outpulling all the size setters and applying only the last one
      this.svgblock.innerHTML = `${_.join ('')
                                          (_.map ((ls: ($s: scaling) => string) => ls(this.scaling))
                                                 (this.wisdom))}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.width} ${l.height}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");

      MathJax.typeset();

      (_.each ((lf: Element) => ((lr: DOMRect) => {
        lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
        lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
        lf.setAttribute("width", ''+lr.width);
        lf.setAttribute("height", ''+lr.height);
      }) (lf.firstElementChild!.getBoundingClientRect()))
      ) (document.getElementsByTagName("foreignObject"));
      // todo: fix this
 //     await MathJax.typesetPromise(function(resolve: ($ee: HTMLCollectionOf<SVGForeignObjectElement>) => void) {
 //       resolve((_.each ((lf: Element) => ((lr: DOMRect) => {
 //         console.log(lf, lr);
 //         console.log("wah wah wah wah wah");
 //         lf.setAttribute("x", `${Number(lf.getAttribute("x"))-lr.width/2}`);
 //         lf.setAttribute("y", `${Number(lf.getAttribute("y"))-lr.height/2}`);
 //         lf.setAttribute("width", ''+lr.width);
 //         lf.setAttribute("height", ''+lr.height);
 //       }) (lf.firstElementChild!.getBoundingClientRect())
 //     ) (document.getElementsByTagName("foreignObject"))));
 //   })
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

const table = new Map<string, Function>([
  // for jeremy
  ["let", letlet],
  //todo: get rid of randy
  ["size", ([x,y]: Real[]) => randy.size(x.x, (y ?? x).x)],

  ["draw", draw],
  ["fill", fill],
  ["filldraw", filldraw],
  ["label", label],

  ["dot", dot],
  ["circle", ([c,r]: [Pair, number]) => new Circle(c, r)],
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
  ...penboard,
]);

function lookup(name: typeof Grapheme): any {
  return table.has(name) ? table.get(name) : () => name;
}

function letlet([name, value]: [string, unknown]): void {
  console.log("whats up big dog");
  variables.set(name, () => value);
  console.log(`added ${name}: ${value}`);
  console.log(variables);
}

function draw([path, ps]: [Path | Arc, Pen]): ($scaling: scaling) => string {
  return path.show()({ fill: undefined, stroke: ps ?? defaultpen });
}

function fill([path, pf]: [Path | Arc, Pen]): ($scaling: scaling) => string {
  return path.show()({ fill: pf, stroke: undefined });
}

function filldraw([path, pf, pens]: [Path | Arc, Pen, Pen]): (($scaling: scaling) => string)[] {
  return [draw([path, pens]), fill([path, pf])];
}

// todo: calibrate label appearance
function label([text, position, pf]: [string, Pair, Pen]): ($scaling: scaling) => string {
  return new Label(text, position).show()({ fill: pf, stroke: undefined });
}

// todo: calibrate dot size
function dot([pair, pf]: [Pair, Pen]): ($scaling: scaling) => string {
  return fill([new Circle(pair, 2**-4), pf ?? defaultpen]);
}

export { scaling, Seen, variables, lookup };