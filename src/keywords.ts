import { loudly } from "./helper";

import { Lexeme } from "./tokens";

import { Pair, Path } from "./types";

import { Arc, Circle } from "./types";
import { unitcircle, origin } from "./types";

import type { Pen } from "./types";
import { red, blue, green, defaultpen } from "./types";
import { unfill, unstroke } from "./types";

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const table = new Map<string, Function>([
  ['filldraw', filldraw as Function],
  ['fill', fill],
  ['draw', draw],
  ['circle', circle],
  ['dir', dir],
  ['degrees', degrees],
  ['unitcircle', () => unitcircle],
  ['origin', () => origin],
  ['blue', () => blue],
  ['green', () => green],
  ['red', () => red],
]);

export default function lookup(name: typeof Lexeme): any {
  return table.get(name);
}

function draw(args: [Path, Pen]): string {
  return gyenh1([args[0], unfill(args[1] ?? defaultpen)]);
}

function fill(args: [Path, Pen]): string {
  return gyenh1([args[0], unstroke(args[1] ?? defaultpen)]);
}

function filldraw(args: [Path, Pen, Pen?]): string {
  return fill([args[0], args[1]])+draw([args[0], args[1] ?? args[2]]);
}

// todo: make other shapes drawable
function gyenh1(args: [Path | Arc, Pen]): string {
  const path = args[0];
  const pen = args[1];
  if (path instanceof Path) {
    return `<path d="${path.points.map((v: Pair,k: number): string => `${k==0 ? 'M' : 'L'} ${SF*v.x} ${SF*ORIENTATION*v.y} `).join('')}
                     ${path.cyclic ? 'Z' : ''}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`;
  } else if (path instanceof Circle) { // tis a circle then lol
    return `<ellipse rx="${SF*path.radius}" ry="${SF*path.radius}"
                     cx="${SF*path.center.x}" cy="${SF*ORIENTATION*path.center.y}"
                     fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`;
  } else return '';
}

function circle(args: [Pair, number]): Arc {
  return new Circle(args[0], args[1]);
}

function dir(p: Path | number, q?: Path): Pair {
  if (p instanceof Path) {
    if (q instanceof Path) {
    return unit(dir(p).plus(dir(q)));
    } else {
      return dir(p, new Path([new Pair(p.length(), 0)]));
    }
  } else {
    return ((lr) => new Pair(Math.cos(lr), Math.sin(lr)))(toRadians(p));
  }
}

function unit(z: Pair): Pair {
  return ((ll) => ll == 0 ? new Pair(0,0) : ((ls) => new Pair(z.x*ls, z.y*ls))(1/ll))(z.length());
}

function degrees(z: Pair): number {
  return Math.atan2(z.y, z.x);
}

function toDegrees(r: number): number {
  return r*180/Math.PI;
}

function toRadians(r: number): number {
  return r/180*Math.PI;
}