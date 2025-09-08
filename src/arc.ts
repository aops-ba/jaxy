import type { BBox, Scaling } from "./helper";

import { Pair } from "./number";
import { origin } from "./number";

import type { Pens } from "./pen";

import { Seen } from "./seen";
import { same } from "./helper";

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

  show(pens: Pens): ($s: Scaling) => string {
    same(pens);
    throw new TypeError("cant draw arcs yet lol");
  }
}

class Circle extends Arc {

  constructor(center: Pair, radius: number) {
    super(center, radius, 0, 360);
  }

  show(pens: Pens): ($s: Scaling) => string {
    return (scaling: Scaling) =>
      `<circle cx="${scaling.x*this.center.x}" cy="${scaling.y*this.center.y}" r="${scaling.x*this.radius}"`
    + `${this.ink(pens)(scaling)} />`
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