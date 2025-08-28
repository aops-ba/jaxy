import type { scaling, Seen } from "./render";
import Render from "./render";

import type { Pair } from "./number";
import { origin } from "./number";

import type { Pens } from "./pen";
import { defaultpen } from "./pen";

class Arc implements Seen {
  center: Pair;
  radius: number;
  from: number;
  to: number;

  constructor(center: Pair, radius: number, from: number, to: number) {
    this.center = center;
    this.radius = radius;
    this.from = from;
    this.to = to;
  }

  show(): ($pens: Pens) => ($scaling: scaling) => string {
    throw new TypeError("cant draw arcs yet lol");
  }
}

class Circle extends Arc {
  static circle(center: Pair, radius: number): Circle {
    return new Circle(center, radius);
  }

  constructor(center: Pair, radius: number) {
    super(center, radius, 0, 360);
  }

  show(): ($pens: Pens) => ($scaling: scaling) => string {
    return ({fill, stroke}) => (scaling) =>
      `<circle cx="${scaling.x*this.center.x}" cy="${scaling.y*this.center.y}" r="${scaling.x*this.radius}"`
     +`fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}" stroke-width="${Render.PT*(stroke ?? defaultpen).width}" />`;
  }
}

const unitcircle: Circle = new Circle(origin, 1);

export { Arc, Circle };
export { unitcircle };