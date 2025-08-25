import type { Token } from "./lexer";
import { GodToken } from "./lexer";
import { Lexeme } from "./tokens";
import { assert } from "./helper";

const yelling: boolean = false;

// todo: fix redundancy between token and operator in this data structure
export abstract class Phrase {
  token: Token;
  operator: Operator | undefined;
  left: Phrase | undefined;
  right: Phrase | undefined;

  constructor(token: Token, operator?: Operator, left?: Phrase, right?: Phrase) {
    this.token = token;
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  name(): string {
    return this.operator?.token.value ?? this.operator?.token.kind ?? this.token.value ?? this.token.kind;
  }

  kind(): string {
    return this.operator?.token.kind ?? this.token.kind;
  }

  value(): string | number | undefined {
    return this.operator?.token.value ?? this.token.value;
  }

  protected _utter(): string {
    return `(${((ll: Phrase | undefined) => ll ? ll._utter() : '')(this.left)}${this.name()}${((lr: Phrase | undefined) => lr ? lr._utter() : '')(this.right)})`;
  }

  utter(): Phrase {
    console.log(this._utter());
    return this;
  }

}

export class UnP extends Phrase {
  declare operator: undefined;
  declare left: undefined;
  declare right: undefined;

  constructor(token: Token) {
    super(token);
  }
}

export class InfixP extends Phrase {
  declare operator: Operator;
  declare left: Phrase;
  declare right: Phrase;

  constructor(token: Token, operator: Operator, left: Phrase, right: Phrase) {
    super(token, operator, left, right);
  }
}

export class PrefixP extends Phrase {
  declare operator: Operator;
  declare left: undefined;
  declare right: Phrase;

  constructor(token: Token, operator: Operator, right: Phrase) {
    super(token, operator, undefined, right)
  }
}

export class PostfixP extends Phrase {
  declare operator: Operator;
  declare left: Phrase;
  declare right: undefined;

  constructor(token: Token, operator: Operator, left: Phrase) {
    super(token, operator, left, undefined);
  }
}

export class ApplyP extends Phrase {
  declare operator: undefined;
  declare left: Phrase;
  declare right: Phrase;

  constructor(token: Token, left: Phrase, right: Phrase) {
    super(token, undefined, left, right);
  }
}

export type Operator = {
  token: Token,
  lassoc?: boolean,
}

const GodOperator: Operator = { token: GodToken };

export default function parse(tokens: Token[]): Phrase {
  return bparse(tokens);//.utter();
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
      return right;
    case Lexeme.Number:
      return new UnP(meal);
    case Lexeme.Name:
      if (taste(tokens).kind === Lexeme.RoundL) {
        eat(tokens);
        const right: Phrase = bparse(tokens, GodOperator, depth+1);
        const dessert: Token = eat(tokens);
        assert(dessert.kind === Lexeme.RoundR, "Yuck!", "Yum!");
        return new PrefixP(meal, { token: meal }, right);
      } else {
        return new UnP(meal);
      }
    default: // assume it to be a prefix operator
      return ((lo) => ((lr) => (new PrefixP(meal, lo, lr)))(bparse(tokens, lo, depth+1)))({ token: meal });
  }
}

function tparse(tokens: Token[], mother: Operator, left: Phrase, depth: number): Phrase {
  yell(`${'.'.repeat(depth)}Welcome to tparse with mother '${mother.token.kind}'.`);
  while (edible(tokens)) {
    const appetite: Token = taste(tokens);
    if (appetite.kind === Lexeme.RoundR) break;

    const operator: Operator = { token: appetite, lassoc: isLassoc(appetite) } as Operator;
    if (strength(operator) < strength(mother)) break;
    if (strength(operator) === strength(mother) && operator.lassoc) break;

    eat(tokens);
    if (operator.token.kind === Lexeme.RoundL) {
      const right: Phrase = bparse(tokens, GodOperator, depth+1);
      const dessert: Token = eat(tokens);
      assert(dessert.kind === Lexeme.RoundR, "Yuck!", "Yum!");
      left = new ApplyP(appetite, left, right);
    } else if (operator.token.kind === Lexeme.Semicolon) {
      left = edible(tokens)
        ? new InfixP(appetite, operator, left, bparse(tokens, operator, depth+1))
        : new PostfixP(appetite, operator, left);
    } else {
      left = new InfixP(appetite, operator, left, bparse(tokens, operator, depth+1));
    }
  }

  return left;
}

function eat(tokens: Token[]): Token {
  const meal: Token = tokens[0];
  yell(`Eating '${meal.kind}'${((lv) => lv ? ': '+lv : '')(meal.value)}…`);
  tokens.shift();
  return meal;
}

function taste(tokens: Token[]): Token {
  return ((lt: Token) => {
    yell(`Tasting '${lt.kind}'${((lv) => lv ? ': '+lv : '')(lt.value)}…`);
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
  switch (operator.token.kind) {
    case Lexeme.Name:
      return Infinity;
    case Lexeme.Times:
    case Lexeme.Divide:
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
      throw new Error(operator.token.kind);
  }
}

function yell(s: string): void {
  if (yelling) console.log(s);
}