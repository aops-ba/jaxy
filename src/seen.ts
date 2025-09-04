import { Pair } from "./number";
import { Pens, defaultpen } from "./pen";
import Render from "./randy";

export interface Seen {
  ink({fill, stroke}: Pens): ($s: string) => string;
}

export abstract class Shape implements Seen {
  label?: string;
  align?: Pair;

  constructor(label?: string, align?: Pair) {
    this.label = label;
    this.align = align;
  }

  ink({fill, stroke}: Pens): ($s: string) => string {
    return (_) => `fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}"`
      + ` stroke-width="${Render.PT*(stroke ?? defaultpen).width}"`;
  }
}