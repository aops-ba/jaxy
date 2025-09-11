import { Circle, unitcircle } from "./arc";
import { assert, CM, Functionlike, INCHES, Maybe, MM, PT, underload } from "./helper";
import { Real, Pair, AsyMath, Int, Unclosed, E, N, S, W, origin } from "./reckon";
import { Path } from "./path";
import { Color, Pen } from "./pen";
import { Operator, Tokenboard } from "./tokens";
import { Seen } from "./seen";
import { randy } from "./main";
import { draw, fill, filldraw, dot, label } from "./render";

type Bakename = "void" | "bool" | "int" | "real" | "pair" | "string" | "pen" | "transform";

type Bake<T> = {
  name: Bakename,
  dimensions: number;
  is: (thing: unknown) => thing is T;
}

const Typebakes: { [s: string]: Bake<any> } = {
  "void": {
    name: "void",
    dimensions: 0,
    is: (x: unknown): x is undefined => typeof x === "undefined",
  } as Bake<undefined>,
  "bool": {
    name: "bool",
    dimensions: 0,
    is: (x: unknown): x is boolean => typeof x === "boolean",
  } as Bake<boolean>,
  "int": {
    name: "int",
    dimensions: 0,
    is: (x: unknown): x is Int => typeof AsyMath.land(x as Unclosed) === "number",
  } as Bake<Int>,
  "real": {
    name: "real",
    dimensions: 0,
    is: (x: unknown): x is number => typeof x === "number",
  } as Bake<number>,
  "pair": {
    name: "pair",
    dimensions: 0,
    is: (x: unknown): x is Pair => x instanceof Pair,
  } as Bake<Pair>,
  "string": {
    name: "string",
    dimensions: 0,
    is: (x: unknown): x is string => typeof x === "string",
  } as Bake<string>,
  "pen": {
    name: "pen",
    dimensions: 0,
    is: (x: unknown): x is Pen => x instanceof Pen,
  } as Bake<Pen>,
  "transform": {
    name: "transform",
    dimensions: 0,
    is: (x: unknown): x is string => x instanceof Transform,
  } as Bake<Transform>
} as const;

// todo
class Transform {}

const BakedVoid: Bake<undefined> = Typebakes["void"];
const BakedBool: Bake<boolean> = Typebakes["bool"];
const BakedInt: Bake<Int> = Typebakes["int"];
const BakedReal: Bake<number> = Typebakes["real"];
const BakedPair: Bake<Pair> = Typebakes["pair"];
const BakedString: Bake<string> = Typebakes["string"];
const BakedPen: Bake<Pen> = Typebakes["pen"];
const BakedTransform: Bake<Transform> = Typebakes["transform"];

function isVoid(thing: unknown): thing is undefined {
  return BakedVoid.is(thing);
}

function isBool(thing: unknown): thing is boolean {
  return BakedBool.is(thing);
}

function isInt(thing: unknown): thing is Int {
  return BakedInt.is(thing);
}

function isReal(thing: unknown): thing is Real {
  return BakedReal.is(thing);
}

function isString(thing: unknown): thing is string {
  return BakedString.is(thing);
}

function isPair(thing: unknown): thing is Pair {
  return BakedPair.is(thing);
}

function isPen(thing: unknown): thing is Pen {
  return BakedPen.is(thing);
}

function isTransform(thing: unknown): thing is Transform {
  return BakedTransform.is(thing);
}

function isSeen(thing: unknown): thing is Seen {
  return thing instanceof Seen;
}

function lift(thing: unknown): unknown {
  if (thing instanceof Int) return lift(new Real(thing));
  else if (thing instanceof Real) return lift(new Pair(thing));
  else if (thing instanceof Pair) return lift(new Path([thing]));
  else if (thing instanceof Path) return lift([thing]);
  else return thing;
}

function bless<T>(thing: T, type: Bakename): T {
  assert(Typebakes[type].is(thing), ["Go,", thing, ", and be now of type", type, "."]);
  return thing;
}

function bake(name: string,
  inkinds: Maybe<Bakename[]> | "not a function", outkind: Bakename | string,
  f: Functionlike<unknown>): BakedFunction<any, typeof outkind> {
  return ((lf: any) => { lf.namey = name; lf.inkinds = inkinds; lf.outkind = outkind; return lf; })
    ((args: any) => f((args ?? []).map((v: unknown, i: number) => Array.isArray(inkinds) ? bless(v, inkinds[i]) : v)));
}

type BakedFunction<T extends unknown[],U> = {
  namey: string,
  inkinds: T | "not a function",
  outkind: U,
  (...args: any): U,
}

/** What has been baked cannot be unbaked. */

const bakeboard: BakedFunction<any, any>[] = [
  bake(Tokenboard[Operator.Plus], ["real", "real"], "real", ([x, y]) => x+y),
  bake(Tokenboard[Operator.Minus], ["real", "real"], "real", ([x, y]) => x-y),
  bake(Tokenboard[Operator.Star], ["real", "real"], "real", ([x, y]) => x*y),
  bake(Tokenboard[Operator.Slash], ["real", "real"], "real", ([x, y]) => x/y),
  bake(Tokenboard[Operator.Caret], ["real", "real"], "real", ([x, y]) => x^y),
  bake(Tokenboard[Operator.StarStar], ["real", "real"], "real", ([x, y]) => x**y),
//  bake(Tokenboard[Operator.Plus], ["pair", "pair"], "pair", (z,w) => ({ x: z.x+w.x, y: z.y+w.y })),
//  [Tokenboard[Operator.Gt], AsyMath.gt],
//  [Tokenboard[Operator.Lt], AsyMath.lt],
//  [Tokenboard[Operator.EqEq], AsyMath.eq],
//  [Tokenboard[Operator.MinusMinus], Path.make],
];

/** But what has been caked can uncake. */

const cakeboard = [
  ...bakeboard,

  bake("size", ["real", "real"], "void", ([x, y=x]) => randy.size(x, y)),
  bake("unitsize", ["real", "real"], "void", ([x, y=x]) => randy.unitsize(x, y)),
  bake("write", ["string"], "void", ([s]: [string]) => console.log(s)),

  bake("draw", null, "void", (largs: unknown[]) => underload(draw, [BakedString.is, isSeen, isPair, isPen], largs)),
  bake("fill", null, "void", (largs: unknown[]) => underload(fill, [isSeen, isPen], largs)),
  bake("filldraw", null, "void", (largs: unknown[]) => underload(filldraw, [isSeen, isPen, isPen], largs)),
  bake("label", null, "void", (largs: unknown[]) => underload(label, [BakedString.is, BakedPair.is, BakedPair.is, isPen], largs)),
  bake("dot", null, "void", (largs: unknown[]) => underload(dot, [BakedString.is, BakedPair.is, BakedPair.is, isPen], largs)),
//  ["dir", (p: Path | number, q?: Path) => Path.dir(p, q)],
//  ["degrees", (lz: Pair) => new Real(lz.degrees())],

  bake("circle", ["pair", "real"], "path", ([c,r]) => new Circle(c, r)),

  bake("unitcircle", "not a function", "path", () => unitcircle),
  bake("origin", "not a function", "pair", () => origin),
  bake("inches", "not a function", "real", () => INCHES),
  bake("cm", "not a function", "real", () => CM),
  bake("mm", "not a function", "real", () => MM),
  bake("pt", "not a function", "real", () => PT),
  bake("N", "not a function", "pair", () => N),
  bake("S", "not a function", "pair", () => S),
  bake("E", "not a function", "pair", () => E),
  bake("W", "not a function", "pair", () => W),

  ...[...Color.names.entries()].map(([k,v]) => bake(k, "not a function", "pen", () => Pen.fromColor(v))),
];

export type { Bake, Bakename, BakedFunction };
export { Typebakes, bakeboard, cakeboard };
export { BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString };

export { bless, bake };

export { isVoid, isBool, isInt, isReal, isPair, isTransform, isString, isSeen, isPen };