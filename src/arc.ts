import type { BBox } from "./helper";
import type { Pair } from "./bake";
import { origin } from "./bake";

import { Seen } from "./seen";

class Arc extends Seen {
  center: Pair;
  radius: number;
  from: number;
  to: number;

  constructor(center: Pair, radius: number, from: number, to: number) {
    super();
    this.center = center;
    this.radius = radius;
    this.from = from;
    this.to = to;
  }

}

class Circle extends Arc {

  constructor(center: Pair, radius: number) {
    super(center, radius, 0, 360);
  }

  bbox(): BBox {
    return {
      minx: this.center.x-this.radius,
      miny: this.center.y-this.radius,
      maxx: this.center.x+this.radius,
      maxy: this.center.y+this.radius,
    };
  }
}

const unitcircle: Circle = new Circle(origin, 1);

export { Arc, Circle };
export { unitcircle };