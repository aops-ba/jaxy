import { loudly } from "./helper";

import { Lexeme } from "./tokens";

import { Fieldable, Pair, Real } from "./field";
import { origin, N, S, E, W } from "./field";
import { toDegrees, toRadians } from "./field";

import Path from "./path";

import { Arc, Circle } from "./types";
import { unitcircle } from "./types";

import type { Pen } from "./types";
import { defaultpen, pentable } from "./types";

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const table = new Map<string, Function>([
  ["filldraw", filldraw],
  ["fill", fill],
  ["draw", draw],
  ["dot", dot],
  ["circle", circle],
  ["dir", dir],
  ["degrees", (lz: Pair) => lz.degrees()],
  ["unitcircle", () => unitcircle],
  ["origin", () => origin],
  ["N", () => N],
  ["S", () => S],
  ["E", () => E],
  ["W", () => W],
  ...pentable,
]);

export default function lookup(name: typeof Lexeme): any {
  return table.get(name);
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

function dot(z: Pair, p?: Pen): string {
  return ((lp) => gyenh1({path: new Circle(z, lp.dotsize()), fill: lp}))
         (p ?? defaultpen);
}

// todo: make other shapes drawable
function gyenh1(options: {path: Path | Arc, fill?: Pen, stroke?: Pen}) {
  if (options.path instanceof Path) {
    return `<path d="${options.path.points.map((v: Pair,k: number): string => `${k==0 ? 'M' : 'L'} ${SF*v.x} ${SF*ORIENTATION*v.y} `).join('')}
                     ${options.path.cyclic ? 'Z' : ''}" fill="${options.fill?.color ?? 'none'}" stroke="${options.stroke?.color ?? 'none'}" stroke-width="${2*(options.stroke?.width ?? 0.5)}" />`;
  } else if (options.path instanceof Circle) { // tis a circle then lol
    return `<ellipse rx="${SF*options.path.radius}" ry="${SF*options.path.radius}"
                     cx="${SF*options.path.center.x}" cy="${SF*ORIENTATION*options.path.center.y}"
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