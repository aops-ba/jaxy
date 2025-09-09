import { Arc } from "./arc";
import { assertively, Functionlike } from "./helper";
import { Real, Pair, AsyMath, Align, Int } from "./number";
import { Path } from "./path";
import { Pen } from "./pen";

/**
 * The baked types of Asymptote are `void`, `bool`, `int`, `real`, and so on.
 * The baked types of TypeScript are `undefined`, `boolean`, `bigint`, `number`, and so on.
 * Each type `Baked<T>` represents the Asymptote implementation of the TypeScript type `T`,
 *   and `BakedTypes` is the warehouse thereof.
 * A TypeScript primitive of type `T` is to be wrapped inside
 *   a Jaxy class using the information in `Baked<T>`.
 * For example, the TS primitive `0.1` (: number) is to be typechecked using `BakedReal.is`,
 *   and then used as `new Real(0.1)`,
**/

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

const bakeboard: Map<string, Functionlike<unknown>> = new Map([
  ["+", AsyMath.plus],
  ["-", AsyMath.minus],
  ["*", AsyMath.times],
  ["/", AsyMath.divide],
  [">", AsyMath.gt],
  ["<", AsyMath.lt],
  ["==", AsyMath.eq],
  ["--", Path.make],
] as [string, Functionlike<unknown>][]);

export type { Baked };
export { BakedTypes, bakeboard };
export { BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString };

export { bless };

export { isAlign, isPathlike, isPen };