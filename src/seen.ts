import { PT, Knowledge, weep, Scaling, BBox } from "./helper";
import { Pens, defaultpen } from "./pen";

export abstract class Seen {

  ink({ fill, stroke }: Pens, text: string=""): Knowledge {
    return (scaling) => `fill="${fill?.color ?? "none"}" stroke="${stroke?.color ?? "none"}"`
      + ` stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10"`
      + ` stroke-width="${PT*(stroke ?? defaultpen).linewidth}"`;
  }

  show(pens: Pens): Knowledge {
    throw new TypeError(`${this} is too abstract to use ${pens}`);
  }

  bbox(): BBox {
    throw new ReferenceError(`cant find a bbox for ${this} yet`);
  }
}