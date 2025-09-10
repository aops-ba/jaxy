import { Arc } from "./arc";
import { assertively, Functionlike } from "./helper";
import { Real, Pair, AsyMath, Align, Int } from "./reckon";
import { Path } from "./path";
import { Pen } from "./pen";
import { Operator, Tokenboard } from "./tokens";

type Baked<T> = {
  name: string;
  dimensions: number;
  is: (thing: unknown) => thing is T;
}

const BakedTypes: { [s: string]: Baked<unknown> } = {
  "void": {
    name: "void",
    dimensions: 0,
    is: (x: unknown): x is undefined => typeof x === "undefined",
  } as Baked<undefined>,
  "bool": {
    name: "bool",
    dimensions: 0,
    is: (x: unknown): x is boolean => typeof x === "boolean",
  } as Baked<boolean>,
  "int": {
    name: "int",
    dimensions: 0,
    is: (x: unknown): x is Int => x instanceof Int,
  } as Baked<Int>,
  "real": {
    name: "real",
    dimensions: 0,
    is: (x: unknown): x is Real => x instanceof Real,
  } as Baked<Real>,
  "pair": {
    name: "pair",
    dimensions: 0,
    is: (x: unknown): x is Pair => x instanceof Pair,
  } as Baked<Pair>,
  "string": {
    name: "string",
    dimensions: 0,
    is: (x: unknown): x is string => typeof x === "string",
  } as Baked<string>,
//  "transform": {
//    name: "transform",
//    dimensions: 0,
//    is: (x: unknown): x is string => x instanceof Transform,
//  } as Baked<Transform>
  "pen": {
    name: "pen",
    dimensions: 0,
    is: (x: unknown): x is Pen => x instanceof Pen,
  } as Baked<Pen>,
} as const;

const BakedVoid = BakedTypes["void"];
const BakedBool = BakedTypes["bool"];
const BakedInt = BakedTypes["int"];
const BakedReal  = BakedTypes["real"];
const BakedPair = BakedTypes["pair"];
const BakedString = BakedTypes["string"];

function bless<T>(thing: T, typename: string): T {
  assertively(BakedTypes[typename].is(
    // todo: put this in `piler` instead because its ugly here
    (thing && typeof thing === "object" && "memory" in thing) ? thing.memory : thing));
  return thing;
}

//function isBool(thing: unknown): thing is boolean {
//  return typeof thing === "boolean";
//}
//
//function isInt(thing: unknown): thing is Int {
//  return thing instanceof Int;
//}
//
//function isBakedReal(thing: unknown): thing is Real {
//  return thing instanceof Real;
//}
//
//function isBakedString(thing: unknown): thing is string {
//  return typeof thing === "string";
//}
//
//function isBakedPair(thing: unknown): thing is Pair {
//  return thing instanceof Pair;
//}

// todo: more wisdom
function isAlign(thing: unknown): thing is Align {
  return thing instanceof Pair || thing instanceof Align;
}

function isPen(thing: unknown): thing is Pen {
  return thing instanceof Pen;
}

function isPathlike(thing: unknown): thing is Path | Arc {
  return thing instanceof Path || thing instanceof Arc ;
}

function lift(thing: unknown): unknown {
  if (thing instanceof Int) return lift(new Real(thing));
  else if (thing instanceof Real) return lift(new Pair(thing));
  else if (thing instanceof Pair) return lift(new Path([thing]));
  else if (thing instanceof Path) return lift([thing]);
  else return thing;
}

const bakeboard: Map<string, Functionlike<unknown>> = new Map([
  [Tokenboard[Operator.Plus], AsyMath.plus],
  [Tokenboard[Operator.Minus], AsyMath.minus],
  [Tokenboard[Operator.Star], AsyMath.times],
  [Tokenboard[Operator.Slash], AsyMath.divide],
  [Tokenboard[Operator.Caret], AsyMath.power],
  [Tokenboard[Operator.StarStar], AsyMath.power],
  [Tokenboard[Operator.Gt], AsyMath.gt],
  [Tokenboard[Operator.Lt], AsyMath.lt],
  [Tokenboard[Operator.EqEq], AsyMath.eq],
  [Tokenboard[Operator.MinusMinus], Path.make],
] as [string, Functionlike<unknown>][]);

export type { Baked };
export { BakedTypes, bakeboard };
export { BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString };

export { bless };

export { isAlign, isPathlike, isPen };