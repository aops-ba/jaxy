import { loudly, proudly } from "./helper";

import { bemath, randy } from "./main";

import { Grapheme } from "./grapheme";

import { Closed, Pair, Real } from "./number";
import { origin, N, S, E, W } from "./number";
import { toDegrees, toRadians } from "./number";

import Path from "./path";

import { Arc, Circle } from "./types";
import { unitcircle } from "./types";

import type { Pen } from "./types";
import { defaultpen, penboard } from "./types";
import { Phrase } from "./phrase";

type BBox = {
  width: number,
  height: number,
  minx: number,
  miny: number
};

export default class Render {
  static PT = 4/3; // 3px = 4pt
  static INCH = Render.PT/72; // 1in = 72pt
//  static SF = 0.5*Render.PT; // linewidth() = 0.5
  static SF = 36;
  static ORIENTATION = -1; // asy up = svg down

  svgblock: HTMLElement;
  knowledge?: Phrase;
  scale: { x: number, y: number };

  constructor(svgblock: HTMLElement) {
    this.svgblock = svgblock;
    ((l) => {
      this.svgblock.setAttribute("width", `${l.width}`);
      this.svgblock.setAttribute("height", `${l.height}`);
    })(this.bbox());

    this.scale = { x: 1, y: 1 };
  }

  size(x: number, y?: number): Render {
    this.scale = { x: x, y: y ?? x };
    console.log(this);
    return this;
  }

  update(knowledge: Phrase): Render {
    this.knowledge = knowledge;
    return this;
  }

  render(): void {
    ((l) => {
      this.svgblock.innerHTML = `${this.knowledge}`;
      this.svgblock.setAttribute("viewBox", `${l.minx} ${l.miny} ${l.width} ${l.height}`);
      this.svgblock.setAttribute("preserveAspectRatio", "xMidYMid meet");
    })(this.scaledbbox());
  }

  private scaledbbox(): BBox {
    return ((l) => ({
      width: l.width/this.scale.x,
      height: l.height/this.scale.y,
      minx: -l.width/2/this.scale.x,
      miny: -l.height/2/this.scale.y,
    }))(this.bbox());
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

export let variables: Map<string, any> = new Map();

const table = new Map<string, Function>([
  ["let", letlet],
  ["size", (x: number, y?: number) => randy.size(x,y)],

  ["draw", draw],
  ["fill", fill],
  ["filldraw", filldraw],
  ["label", label],

  ["dot", dot],
  ["circle", circle],
  ["dir", dir],
  ["degrees", (lz: Pair) => new Real(lz.degrees())],
  ["conjugate", (lz: Pair) => lz.conjugate()],
  ["unitcircle", () => unitcircle],
  ["origin", () => origin],
  ["N", () => N],
  ["S", () => S],
  ["E", () => E],
  ["W", () => W],
  ...penboard,
]);

export function lookup(name: typeof Grapheme): any {
  return table.has(name) ? table.get(name) : () => name;
}

function letlet(name: any, value: any): void {
  console.log(name, value);
  variables.set(name.toString(), value);
}

function draw(path: Path | Arc, ps: Pen): string {
  return gyenh1({path: path, stroke: ps ?? defaultpen});
}

function fill(path: Path | Arc, pf: Pen): string {
  return gyenh1({path: path, fill: pf ?? defaultpen});
}

function filldraw(path: Path | Arc, pf: Pen, ps: Pen): string {
  return fill(path, pf)+draw(path, ps ?? pf);
}

function label(s: string | number, position?: Pair, p?: Pen): string {
  return ((lpos, lpen) => `<g x="${Render.SF*lpos.x}" y="${Render.SF*Render.ORIENTATION*lpos.y}" fill="${lpen.color}" text-anchor="middle" dominant-baseline="middle">${bemath(s.toString())}</g>`)
    (position ?? origin, p ?? defaultpen);
}

function dot(z: Pair, p?: Pen): string {
  return ((lp) => gyenh1({path: new Circle(z, lp.dotsize()), fill: lp}))
         (p ?? defaultpen);
}

// todo: make other shapes drawable
function gyenh1(options: {path: Path | Arc, fill?: Pen, stroke?: Pen}) {
  if (options.path instanceof Path) {
    return `<path d="${options.path.points.map((v: Pair,k: number): string => `${k==0 ? 'M' : 'L'} ${Render.SF*v.x} ${Render.SF*Render.ORIENTATION*v.y} `).join('')}
                     ${options.path.cyclic ? 'Z' : ''}" fill="${options.fill?.color ?? 'none'}" stroke="${options.stroke?.color ?? 'none'}" stroke-width="${2*(options.stroke?.width ?? 0.5)}" />`;
  } else if (options.path instanceof Circle) { // tis a circle then lol
    return `<ellipse rx="${Render.SF*options.path.radius}" ry="${Render.SF*options.path.radius}"
                     cx="${Render.SF*options.path.center.x}" cy="${Render.SF*Render.ORIENTATION*options.path.center.y}"
                     fill="${options.fill?.color ?? 'none'}" stroke="${options.stroke?.color ?? 'none'}" stroke-width="${2*(options.stroke?.width ?? 0.5)}" />`;
  } else return '';
}

function circle(c: Pair, r: number): Arc {
  return new Circle(c, r);
}

function dir(p: Path | number, q?: Path): Pair {
  if (p instanceof Path) {
    if (q instanceof Path) {
      return dir(p).plus(dir(q)).unit();
    } else {
      return dir(p, new Path([new Pair(p.length(), 0)]));
    }
  } else {
    return ((lr) => new Pair(Math.cos(lr), Math.sin(lr)))(toRadians(p));
  }
}