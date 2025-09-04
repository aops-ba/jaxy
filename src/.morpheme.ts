import type { Handed } from "./.phrase";
import { Grapheme } from "./.grapheme";

class Morpheme {
  kind: typeof Grapheme;
  span: [number, number];
  value?: string | number;
  assoc?: Handed;

  constructor(kind: typeof Grapheme, span: [number, number], options?: { value?: string | number, assoc?: Handed }) {
    this.kind = kind;
    this.span = span;
    this.value = options?.value;
    this.assoc = options?.assoc;
  }

  name(): string {
    return this.value ?? this.kind;
  }
}

class Operator extends Morpheme {
  declare assoc: Handed;
  static God = new Operator(Grapheme.God, [-Infinity, Infinity]);
}

export { Morpheme, Operator };