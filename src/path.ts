import { type Scaling, type Knowledge, BBox, min, max } from "./helper";
import { Seen } from "./seen";

import { Pair, toRadians } from "./number";

import type { Pens } from "./pen";
import { BakedPair } from "./bake";

class Path extends Seen {
  // todo: improve this
  static cycle: "cycle";
  points: Pair[];
  cyclic: boolean;

  static dir(p: Path | number, q?: Path): Pair {
    if (p instanceof Path) {
      if (q instanceof Path) {
        return Path.dir(p).plus(Path.dir(q)).unit();
      } else {
        return Path.dir(p, new Path([new Pair(p.length(), 0)]));
      }
    } else {
      return ((lr) => new Pair(Math.cos(lr), Math.sin(lr)))(toRadians(p));
    }
  }

  // todo: this is actually redundant because of upcasting
  static make(left: Path | Pair, right: Pair | "cycle"): Path {
    if (left instanceof Path && right === "cycle") return left.becycle();
    else if (left instanceof Path && BakedPair.is(right)) return left.add(right);
    else if (BakedPair.is(left) && BakedPair.is(right)) return new Path([left as Pair, right as Pair]);
    else throw new Error("bad path");
  }

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

  show(pens: Pens): Knowledge {
    return Object.assign((scaling: Scaling) =>
    `<path d="${this.points.map((lpair: Pair, lindex: number): string =>
      `${lindex==0 ? 'M' : ' L'} ${scaling.x*lpair.x} ${scaling.y*lpair.y}`).join('')}
       ${this.cyclic ? ' Z' : ''}"` + this.ink(pens)(scaling) + ` />`,
      { kind: "show a… path!!" });
  }

  bbox(): BBox {
    return {
      minx: min(...this.points.map(z => z.x)),
      miny: min(...this.points.map(z => z.y)), 
      width: max(...this.points.map(z => z.x))-min(...this.points.map(z => z.x)), 
      height: max(...this.points.map(z => z.y))-min(...this.points.map(z => z.y)), 
    };
  }
}

export { Path };