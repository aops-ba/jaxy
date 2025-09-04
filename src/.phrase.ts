import { Grapheme } from "./.grapheme";
import { Morpheme } from "./.morpheme";

type Handed = "left" | "right";

abstract class Phrase {
  head: Morpheme;
  left?: Phrase;
  right?: Phrase;
  assoc?: Handed;

  constructor(head: Morpheme, options?: { left?: Phrase, right?: Phrase, assoc?: Handed }) {
    this.head = head;
    this.left = options?.left;
    this.right = options?.right;
    this.assoc = options?.assoc;
  }

  name(): string {
    if (this instanceof PairP) return "pair";
    else return this.head.name();
  }

  kind(): string {
    return this.head.kind;
  }

  value(): string | number | undefined {
    return this.head.value;
  }

  isOperator(): boolean {
    return this.assoc !== undefined;
  }
}

class UnP extends Phrase {
  declare left: undefined;
  declare right: undefined;
  declare assoc: undefined;

  constructor(head: Morpheme) {
    super(head);
  }
}

class InfixP extends Phrase {
  declare left: Phrase;
  declare right: Phrase;
  declare assoc: Handed;

  constructor(head: Morpheme, left: Phrase, right: Phrase, assoc: Handed) {
    super(head, { left: left, right: right, assoc: assoc });
  }
}

class PrefixP extends Phrase {
  declare left: undefined;
  declare right: Phrase;
  declare assoc: undefined;

  constructor(head: Morpheme, right: Phrase) {
    super(head, { right: right });
  }
}

class PostfixP extends Phrase {
  declare left: Phrase;
  declare right: undefined;
  declare assoc: undefined;

  constructor(head: Morpheme, left: Phrase) {
    super(head, { left: left });
  }
}

class ApplyP extends Phrase {
  declare left: Phrase;
  declare right: Phrase;
  declare assoc: undefined;

  constructor(head: Morpheme, left: Phrase, right: Phrase) {
    super(head, { left: left, right: right });
  }
}

class PairP extends PrefixP {
  constructor(right: Phrase) {
    super(new Morpheme(Grapheme.Comma, [0,0]), right);
  }
}

export type { Handed };
export { Phrase, UnP, InfixP, PrefixP, PostfixP, ApplyP, PairP };