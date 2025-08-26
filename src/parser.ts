import { Token } from "./tokens";
import { Lexeme, GodToken } from "./tokens";
import { loudly, assert } from "./helper";

const yelling: boolean = true;

export abstract class Phrase {
  token: Token;
  lassoc?: boolean; // true if left associative, false if right associative, undefined if not an operator
  left: Phrase | undefined;
  right: Phrase | undefined;

  constructor(token: Token, lassoc?: boolean, left?: Phrase, right?: Phrase) {
    this.token = token;
    this.lassoc = lassoc;
    this.left = left;
    this.right = right;
  }

  name(): string {
    if (this instanceof PairP) return "pair";
    else return this.token.name();
  }

  kind(): string {
    return this.token.kind;
  }

  value(): string | number | undefined {
    return this.token.value;
  }

  isOperator(): boolean {
    return this.lassoc === undefined;
  }

  //todo: beautify this
  protected _utter(): string {
    if (this.left || this.right)
      return `(${((ll: Phrase | undefined) => ll ? ll._utter() : "")(this.left)}${this.name()}${((lr: Phrase | undefined) => lr ? lr._utter() : "")(this.right)})`;
    else return this.name();
  }

  utter(): Phrase {
    console.log(this._utter());
    return this;
  }

}

export class UnP extends Phrase {
  declare lassoc: undefined;
  declare left: undefined;
  declare right: undefined;

  constructor(token: Token) {
    super(token);
  }
}

export class InfixP extends Phrase {
  declare lassoc: boolean;
  declare left: Phrase;
  declare right: Phrase;

  constructor(token: Token, lassoc: boolean, left: Phrase, right: Phrase) {
    super(token, lassoc, left, right);
  }
}

export class PrefixP extends Phrase {
  declare lassoc: undefined;
  declare left: undefined;
  declare right: Phrase;

  constructor(token: Token, right: Phrase) {
    super(token, undefined, undefined, right)
  }
}

export class PairP extends PrefixP {
  constructor(right: Phrase) {
    super(new Token(Lexeme.Comma), right);
  }
}

export class PostfixP extends Phrase {
  declare lassoc: undefined;
  declare left: Phrase;
  declare right: undefined;

  constructor(token: Token, left: Phrase) {
    super(token, undefined, left, undefined);
  }
}

export class ApplyP extends Phrase {
  declare lassoc: undefined;
  declare left: Phrase;
  declare right: Phrase;

  constructor(token: Token, left: Phrase, right: Phrase) {
    super(token, undefined, left, right);
  }
}

type Operator = Token;
const GodOperator = GodToken;

export default function parse(tokens: Token[]): Phrase {
  return bparse(tokens).utter();
}

function bparse(tokens: Token[], mother: Operator=GodOperator, depth: number=0): Phrase {
  yell(`${'.'.repeat(depth)}Welcome to bparse.`);
  const left: Phrase = hparse(tokens, depth+1);
  return tparse(tokens, mother, left, depth+1);
}

function hparse(tokens: Token[], depth: number): Phrase {
  yell(`${'.'.repeat(depth)}Welcome to hparse.`);
  const meal: Token = eat(tokens);
  switch (meal.kind) {
    case Lexeme.RoundL:
      const right: Phrase = bparse(tokens, GodOperator, depth+1);
      const dessert: Token = eat(tokens);
      assert(dessert.kind === Lexeme.RoundR, "Yuck!", "Yum!");
      return right.token.kind === Lexeme.Comma ? new PairP(right) : right;
    case Lexeme.Number:
      return new UnP(meal);
    case Lexeme.Name:
      if (taste(tokens).kind === Lexeme.RoundL) {
        eat(tokens);
        const right: Phrase = bparse(tokens, GodOperator, depth+1);
        const dessert: Token = eat(tokens);
        assert(dessert.kind === Lexeme.RoundR, "Yuck!", "Yum!");
        return new PrefixP(meal, right);
      } else {
        return new UnP(meal);
      }
    default: // assume it to be a prefix operator
      return ((lo) => ((lr) => (new PrefixP(meal, lr)))(bparse(tokens, lo, depth+1)))(meal as Operator);
  }
}

function tparse(tokens: Token[], mother: Operator, left: Phrase, depth: number): Phrase {
  yell(`${'.'.repeat(depth)}Welcome to tparse with mother '${mother.kind}'.`);
  while (edible(tokens)) {
    const appetite: Token = taste(tokens);
    if (appetite.kind === Lexeme.RoundR) break;

    const operator: Operator = appetite as Operator;
    if (strength(operator) < strength(mother)) break;
    if (strength(operator) === strength(mother) && isLassoc(operator)) break;

    eat(tokens);
    if (operator.kind === Lexeme.RoundL) {
      const right: Phrase = bparse(tokens, GodOperator, depth+1);
      const dessert: Token = eat(tokens);
      assert(dessert.kind === Lexeme.RoundR, "Yuck!", "Yum!");
      left = new ApplyP(appetite, left, right);
    } else if (operator.kind === Lexeme.Semicolon) {
      left = edible(tokens)
        ? new InfixP(appetite, isLassoc(operator), left, bparse(tokens, operator, depth+1))
        : new PostfixP(appetite, left);
    } else {
      left = new InfixP(appetite, isLassoc(operator), left, bparse(tokens, operator, depth+1));
    }
  }

  return left;
}

function eat(tokens: Token[]): Token {
  const meal: Token = tokens[0];
  yell(`Eating '${meal.kind}'${((lv) => lv ? ": "+lv : "")(meal.value)}…`);
  tokens.shift();
  return meal;
}

function taste(tokens: Token[]): Token {
  return ((lt: Token) => {
    yell(`Tasting '${lt.kind}'${((lv) => lv ? ": "+lv : "")(lt.value)}…`);
    return tokens[0];
  })(tokens[0]);
}

function edible(tokens: Token[]): boolean {
  return tokens.length > 0;
}

function isLassoc(token: Token): boolean {
  return [Lexeme.Plus, Lexeme.Minus, Lexeme.Times, Lexeme.Divide, Lexeme.Comma, Lexeme.Semicolon, Lexeme.MinusMinus].includes(token.kind);
}

function strength(operator: Operator): number {
  switch (operator.kind as typeof Lexeme) {
    case Lexeme.Name:
      return Infinity;
    case Lexeme.Star:
    case Lexeme.Slash:
      return 4;
    case Lexeme.Plus:
    case Lexeme.Minus:
      return 3;
    // todo: this is going to break on decrementation
    case Lexeme.MinusMinus:
      return 2;
    case Lexeme.Comma:
      return 1;
    case Lexeme.Semicolon:
      return 0;
    case Lexeme.God:
      return -Infinity;
    default:
      console.log(operator);
      throw Error;
  }
}

function yell(s: any): void {
  if (yelling) console.log(s);
}