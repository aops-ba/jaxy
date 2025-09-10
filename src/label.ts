import { Seen } from "./seen";

import { Pair, Align } from "./reckon";
import { peel } from "./helper";

export default class Label extends Seen {
  text: string;
  position: Pair;
  align: Align;

  static snip(s: string): string {
    return s.startsWith('"') && s.endsWith('"') ? peel(s) : s;
  }

  constructor(text: string, position: Pair, align: Align) {
    super();
    this.text = Label.snip(text);
    this.position = position;
    this.align = align;
  }
}