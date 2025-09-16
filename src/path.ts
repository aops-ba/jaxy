import { BBox, min, max } from "./helper";
import { Pair } from "./rime";
import { Seen } from "./seen";

class Path extends Seen {

  constructor (
    public points: Pair[],
    public cyclic: boolean =false
  ) {
    super();
    this.points = points;
    this.cyclic = cyclic;
  }

  length(): number {
    return this.points.length+(+!!!this.cyclic);
  }

  becycle(s: string): Path {
    this.cyclic = s === "cycle";
    return this;
  }

  add(p: Pair): Path {
    this.points.push(p);
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