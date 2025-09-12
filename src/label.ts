import { Seen } from "./seen";

import type { Pair } from "./bake";
import { peel } from "./helper";

export default class Label extends Seen {
  text: string;
  position: Pair;
  align: Pair;

  static snip(s: string): string {
    return s.startsWith('"') && s.endsWith('"') ? peel(s) : s;
  }

  constructor(text: string, position: Pair, align: Pair) {
    super();
    this.text = Label.snip(text);
    this.position = position;
    this.align = align;
  }
}