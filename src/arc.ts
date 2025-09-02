import type { scaling } from "./render";
//import { Seen } from "./render";

import type { Pair } from "./number";
import { origin } from "./number";

import type { Pens } from "./pen";
import { defaultpen } from "./pen";

import { Shape } from "./seen";
import Label from "./label";
import { id } from "./helper";

class Arc extends Shape {
  center: Pair;
  radius: number;
  from: number;
  to: number;

  constructor(center: Pair, radius: number, from: number, to: number, label?: string, align?: Pair) {
    super(label, align);
    this.center = center;
    this.radius = radius;
    this.from = from;
    this.to = to;
  }

  show(pens: Pens): ($s: scaling) => string {
    id(pens);
    throw new TypeError("cant draw arcs yet lol");
  }
}

class Circle extends Arc {

  constructor(center: Pair, radius: number, label?: string, align?: Pair) {
    super(center, radius, 0, 360, label, align);
  }

  show(pens: Pens): ($s: scaling) => string {
    return (scaling: scaling) =>
      `<circle cx="${scaling.x*this.center.x}" cy="${scaling.y*this.center.y}" r="${scaling.x*this.radius}"`
    + `${ this.ink(pens)('')} />`
    + `${!!this.label ? new Label(this.label!, this.center.minus(this.radius).plus((this.align ?? origin).times(12*(pens.stroke ?? defaultpen).width)))?.show(pens)({x: 1, y: 1}) : ''}`;
  }
}

class Dot extends Circle {
  constructor(center: Pair, label?: string, align?: Pair) {
    super(center, 2**-4+2**-5, label, align);
  }
}

const unitcircle: Circle = new Circle(origin, 1);

export { Arc, Circle, Dot };
export { unitcircle };