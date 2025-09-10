import { BBox } from "./helper";

export abstract class Seen {

  bbox(): BBox {
    throw new ReferenceError(`cant reckon a bbox for ${this} yet`);
  }

}