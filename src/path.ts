import { proudly } from "./helper";

import type { scaling, Seen } from "./render";
import Render from "./render";

import type { Pair } from "./number";

import type { Pens } from "./pen";
import { defaultpen } from "./pen";

export default class Path implements Seen {
  points: Pair[];
  cyclic: boolean;

  constructor(points?: Pair[], cyclic?: boolean) {
    this.points = points ?? [];
    this.cyclic = cyclic ?? false;
  }

  length(): number {
    return this.points.length+(+!!!this.cyclic);
  }

  becycle(): Path {
    this.cyclic = true;
    return this;
  }

  add(p: Pair | "cycle"): Path {
    if (p === "cycle") {
      this.becycle();
    } else {
      this.points.push(p);
    }
    return this;
  }

  show(): ($pens: Pens) => ($scaling: scaling) => string {
    return ({fill, stroke}) => (scaling) =>
    `<path d="${this.points.map((lpair: Pair, lindex: number): string =>
      `${lindex==0 ? 'M' : ' L'} ${scaling.x*lpair.x} ${scaling.y*lpair.y}`).join('')}${this.cyclic ? ' Z' : ''}"`+
      `fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}" stroke-width="${Render.PT*(stroke ?? defaultpen).width}" />`;
  }
}