import type { Scaling } from "./randy";
import { Shape } from "./seen";

import type { Pair } from "./number";

import type { Pens } from "./pen";
import { Keyword } from "./tokens";

export default class Path extends Shape {
  static cycle: "cycle";
  points: Pair[];
  cyclic: boolean;

  constructor(points?: Pair[], cyclic?: boolean) {
    super();
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

  // todo: this is ugly
  add(p: Pair | "cycle"): Path {
    if (p === "cycle") {
      this.becycle();
    } else {
      this.points.push(p);
    }
    return this;
  }

  show(pens: Pens): ($s: Scaling) => string {
    return (scaling: Scaling) =>
    `<path d="${this.points.map((lpair: Pair, lindex: number): string =>
      `${lindex==0 ? 'M' : ' L'} ${scaling.x*lpair.x} ${scaling.y*lpair.y}`).join('')}
       ${this.cyclic ? ' Z' : ''}"` + this.ink(pens)('') + ` />`;
  }
}