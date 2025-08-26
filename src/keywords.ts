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

function draw(args: [Path, Pen]): string {
  return gyenh1([args[0], undefined, args[1] ?? defaultpen]);
}

function fill(args: [Path, Pen]): string {
  return gyenh1([args[0], args[1] ?? defaultpen, undefined]);
}

function filldraw(args: [Path, Pen, Pen?]): string {
  return fill([args[0], args[1]])+draw([args[0], args[2] ?? args[1]]);
}

// todo: this lol
function dot(args: [Pair, Pen?]): string {
  const blargs: any[] = args.length === 1 ? [args] : args;
  return gyenh1([new Circle(blargs[0], blargs[1]?.width/6), (blargs[1] ?? defaultpen), undefined]);
}

// todo: make other shapes drawable
function gyenh1(args: [Path | Arc, Pen | undefined, Pen | undefined]): string {
  const path = args[0];
  const fill = args[1];
  const stroke = args[2];
  if (path instanceof Path) {
    return `<path d="${path.points.map((v: Pair,k: number): string => `${k==0 ? 'M' : 'L'} ${SF*v.x} ${SF*ORIENTATION*v.y} `).join('')}
                     ${path.cyclic ? 'Z' : ''}" fill="${fill?.color ?? 'none'}" stroke="${stroke?.color ?? 'none'}" stroke-width="${2*(stroke?.width ?? 0.5)}" />`;
  } else if (path instanceof Circle) { // tis a circle then lol
    return `<ellipse rx="${SF*path.radius}" ry="${SF*path.radius}"
                     cx="${SF*path.center.x}" cy="${SF*ORIENTATION*path.center.y}"
                     fill="${fill?.color ?? 'none'}" stroke="${stroke?.color ?? 'none'}" stroke-width="${2*(stroke?.width ?? 0.5)}" />`;
  } else return '';
}

function circle(args: [Pair, number]): Arc {
  return new Circle(args[0], args[1]);
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