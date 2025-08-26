import { Pair } from "./field";

export default class Path {
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

  add(p: Pair): Path {
    this.points.push(p);
    return this;
  }
}
