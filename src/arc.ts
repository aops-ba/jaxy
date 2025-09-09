import type { BBox } from "./helper";

import { Pair } from "./number";
import { origin } from "./number";

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
      width: 2*this.radius,
      height: 2*this.radius,
      minx: this.center.x-this.radius,
      miny: this.center.y-this.radius,
    }
  }
}

const unitcircle: Circle = new Circle(origin, 1);

export { Arc, Circle };
export { unitcircle };