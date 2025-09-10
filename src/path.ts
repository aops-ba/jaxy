import { BBox, min, max } from "./helper";
import { Seen } from "./seen";

import { Pair, toRadians } from "./reckon";

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
    else if (left instanceof Path && right instanceof Pair) return left.add(right);
    else if (left instanceof Pair && right instanceof Pair) return new Path([left as Pair, right as Pair]);
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

  bbox(): BBox {
    return {
      minx: min(...this.points.map(z => z.x)),
      miny: min(...this.points.map(z => z.y)),
      maxx: max(...this.points.map(z => z.x)),
      maxy: max(...this.points.map(z => z.y)),
    };
  }
}

export { Path };