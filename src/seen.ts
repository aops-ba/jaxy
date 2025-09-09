import { BBox } from "./helper";

export abstract class Seen {

  bbox(): BBox {
    throw new ReferenceError(`cant find a bbox for ${this} yet`);
  }

}