import { Grapheme } from "./grapheme";
import { Morpheme, Operator } from "./morpheme";
import { Phrase, UnP, InfixP, PrefixP, PostfixP, ApplyP, PairP } from "./phrase";

import { loudly, proudly } from "./helper";

const GodOperator = Operator.God;

export default function parse(morphemes: Morpheme[]): Phrase {
  return bparse(morphemes);
}

function bparse(morphemes: Morpheme[], mother: Operator=GodOperator, depth: number=0): Phrase {
  loudly(`${'.'.repeat(depth)}Welcome to bparse.`);
  const left: Phrase = hparse(morphemes, depth+1);
  return tparse(morphemes, mother, left, depth+1);
}

function hparse(morphemes: Morpheme[], depth: number): Phrase {
  loudly(`${'.'.repeat(depth)}Welcome to hparse.`);
  if (!edible(morphemes)) {
    return undefined as unknown as Phrase;
  } else {
    const meal: Morpheme = eat(morphemes);
    switch (meal.kind) {
      case Grapheme.RoundL:
        const right: Phrase = bparse(morphemes, GodOperator, depth+1);
        const dessert: Morpheme = eat(morphemes);
//        assert(dessert.kind === Grapheme.RoundR);
        return right.head.kind === Grapheme.Comma ? new PairP(right) : right;
      case Grapheme.Cycle:
      case Grapheme.Number:
        return new UnP(meal);
      case Grapheme.Name:
        if (taste(morphemes).kind === Grapheme.RoundL) {
          eat(morphemes);
          const right: Phrase = bparse(morphemes, GodOperator, depth+1);
          const dessert: Morpheme = eat(morphemes);
//          assert(dessert.kind === Grapheme.RoundR);
          return new PrefixP(meal, right);
        } else {
          return new UnP(meal);
        }
      default: // assume it to be a prefix operator
        return ((lo) => ((lr) => (new PrefixP(meal, lr)))(bparse(morphemes, lo, depth+1)))(meal as Operator);
    }
  }
}

function tparse(morphemes: Morpheme[], mother: Operator, left: Phrase, depth: number): Phrase {
  loudly(`${'.'.repeat(depth)}Welcome to tparse with mother '${mother.kind}'.`);
  while (edible(morphemes)) {
    const appetite: Morpheme = taste(morphemes);
    if (appetite.kind === Grapheme.RoundR || appetite.kind === Grapheme.SquareR) break;

    const operator: Operator = appetite as Operator;
    if (strength(operator) < strength(mother)) break;
    if (strength(operator) === strength(mother) && isLassoc(operator)) break;

    eat(morphemes);
    if (operator.kind === Grapheme.RoundL) {
      const right: Phrase = bparse(morphemes, GodOperator, depth+1);
      const dessert: Morpheme = eat(morphemes);
//      assert(dessert.kind === Grapheme.RoundR);
      left = new ApplyP(appetite, left, right);
    } else if (operator.kind === Grapheme.Semicolon) {
      left = edible(morphemes)
        ? new InfixP(appetite, left, bparse(morphemes, operator, depth+1), operator.assoc)
        : new PostfixP(appetite, left);
    } else {
      left = new InfixP(appetite, left, bparse(morphemes, operator, depth+1), operator.assoc);
    }
  }

  return left;
}

function eat(morphemes: Morpheme[]): Morpheme {
  const meal: Morpheme = morphemes[0];
  loudly(`Eating '${meal.kind}'${((lv) => lv ? ": "+lv : "")(meal.value)}…`);
  morphemes.shift();
  return meal;
}

function taste(morphemes: Morpheme[]): Morpheme {
  return ((lt: Morpheme) => {
    loudly(`Tasting '${lt.kind}'${((lv) => lv ? ": "+lv : "")(lt.value)}…`);
    return morphemes[0];
  })(morphemes[0]);
}

function edible(morphemes: Morpheme[]): boolean {
  return morphemes.length > 0;
}

function isLassoc(morpheme: Morpheme): boolean {
  return [Grapheme.Plus, Grapheme.Minus, Grapheme.Times, Grapheme.Divide, Grapheme.Comma, Grapheme.Semicolon, Grapheme.MinusMinus].includes(morpheme.kind);
}

function strength(operator: Operator): number {
  switch (operator.kind as typeof Grapheme) {
    case Grapheme.Name:
      return Infinity;
    case Grapheme.Star:
    case Grapheme.Slash:
      return 4;
    case Grapheme.Plus:
    case Grapheme.Minus:
      return 3;
    // todo: this is going to break on decrementation
    case Grapheme.MinusMinus:
      return 2;
    case Grapheme.Comma:
      return 1;
    case Grapheme.Semicolon:
      return 0;
    case Grapheme.God:
      return -Infinity;
    default:
      console.log(operator);
      throw Error;
  }
}

export { Phrase };