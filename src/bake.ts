import { Circle, unitcircle } from "./arc";
import { assert, CM, Functionlike, INCHES, loudly, Maybe, MM, only, PT, sameArray, underload } from "./helper";
import { Path } from "./path";
import { Color, Pen } from "./pen";
import { Operator, Tokenboard } from "./tokens";
import { Seen } from "./seen";
import { randy } from "./main";
import { draw, fill, filldraw, dot, label } from "./render";

type Bakename = "void" | "bool" | "int" | "real" | "pair" | "path" | "string" | "pen" | "transform";

type Bake<T> = {
  name: Bakename,
  dimensions: number;
  is: (thing: unknown) => thing is T;
}

type Pair = { x: number, y: number };
function pair(x: number, y: number): Pair {
  return { x, y };
}

type Rime = Pair | number;

const BEAN = Math.sqrt(2);

const origin: Pair = { x: 0, y: 0 };
const N: Pair = { x: 0, y: 1 };
const S: Pair = { x: 0, y: -1 };
const E: Pair = { x: 1, y: 0 };
const W: Pair = { x: -1, y: 0 };
const NW: Pair = { x: -BEAN, y: BEAN };
const NE: Pair = { x: BEAN, y: BEAN };
const SW: Pair = { x: -BEAN, y: -BEAN };
const SE: Pair = { x: BEAN, y: -BEAN };

// todo
type Transform = {};

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
    is: (x: unknown): x is number => typeof x === "number",
  } as Bake<number>,
  "real": {
    name: "real",
    dimensions: 0,
    is: (x: unknown): x is number => typeof x === "number",
  } as Bake<number>,
  "pair": {
    name: "pair",
    dimensions: 0,
    is: (x: unknown): x is Pair => (!!x && typeof x === "object" && "x" in x && "y" in x),
  } as Bake<Pair>,
  "path": {
    name: "path",
    dimensions: 0,
    is: (x: unknown): x is Path => x instanceof Path,
  } as Bake<Path>,
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
    is: (x: unknown): x is string => false,
  } as Bake<Transform>
} as const;

const BakedVoid: Bake<undefined> = Typebakes["void"];
const BakedBool: Bake<boolean> = Typebakes["bool"];
const BakedInt: Bake<number> = Typebakes["int"];
const BakedReal: Bake<number> = Typebakes["real"];
const BakedPair: Bake<Pair> = Typebakes["pair"];
const BakedPath: Bake<Path> = Typebakes["path"];
const BakedString: Bake<string> = Typebakes["string"];
const BakedPen: Bake<Pen> = Typebakes["pen"];
const BakedTransform: Bake<Transform> = Typebakes["transform"];

//function isVoid(thing: unknown): thing is undefined {
//  return BakedVoid.is(thing);
//}
//
//function isBool(thing: unknown): thing is boolean {
//  return BakedBool.is(thing);
//}
//
//function isInt(thing: unknown): thing is Int {
//  return BakedInt.is(thing);
//}
//
//function isReal(thing: unknown): thing is Real {
//  return BakedReal.is(thing);
//}
//
//function isString(thing: unknown): thing is string {
//  return BakedString.is(thing);
//}
//
//function isPair(thing: unknown): thing is Pair {
//  return BakedPair.is(thing);
//}
//
//function isPen(thing: unknown): thing is Pen {
//  return BakedPen.is(thing);
//}
//
//function isTransform(thing: unknown): thing is Transform {
//  return BakedTransform.is(thing);
//}
//
function isSeen(thing: unknown): thing is Seen {
  return thing instanceof Seen;
}

function narrow(thing: unknown): Bakename {
  console.log("wah", thing);
  if (isSeen(thing)) return "path";
  else if (BakedPen.is(thing)) return "pen";
  else if (BakedTransform.is(thing)) return "transform";
  else if (BakedString.is(thing)) return "string";
  else if (BakedPath.is(thing)) return "path";
  else if (BakedPair.is(thing)) return "pair";
  else if (BakedReal.is(thing)) return "real";
  else if (BakedInt.is(thing)) return "int";
  else if (BakedBool.is(thing)) return "bool";
  else if (BakedVoid.is(thing)) return "void";
  else {
    throw new Error("idk what type this is");
  }
}

function unload<T extends BakedFunction<any, any>>(fs: T | T[], args: unknown[]) {
  if (!Array.isArray(fs)) return fs(args);
  else if (fs.length === 1) return only(fs)(args);
  else {
    return only(fs.filter(f => sameArray(f.inkinds, loudly(args).map(narrow))))(args);
  }
}

function lift(thing: unknown): unknown {
//  if (BakedInt.is(thing)) return lift(thing);
  if (BakedReal.is(thing)) return lift(pair(thing, 0));
  else if (BakedPair.is(thing)) return lift(new Path([thing]));
  else if (thing instanceof Path) return lift([thing]);
  else return thing;
}

// todo: ints and reals behave the same
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
  bake(Tokenboard[Operator.Plus], ["string", "string"], "string", ([x, y]) => x+y),
  bake("string", ["real"], "string", x => x.toString()),
// todo: awaiting int–real rectification
//  bake("string", ["real", "int"], "string", (x, digits) => x.toFixed(digits)),

  bake(Tokenboard[Operator.Hash], ["int", "int"], "int", ([x, y]) => Math.floor(x/y)),
  bake(Tokenboard[Operator.Percent], ["int", "int"], "int", ([x, y]) => x%y),
  bake(Tokenboard[Operator.Gt], ["real", "real"], "bool", ([x, y]) => x>y),
  bake(Tokenboard[Operator.Lt], ["real", "real"], "bool", ([x, y]) => x<y),
  bake(Tokenboard[Operator.EqEq], ["real", "real"], "bool", ([x, y]) => x===y),

  bake(Tokenboard[Operator.Plus], ["real"], "real", ([x]) => x),
  bake(Tokenboard[Operator.Plus], ["real", "real"], "real", ([x, y]) => x+y),
  bake(Tokenboard[Operator.Minus], ["real"], "real", ([x]) => -x),
  bake(Tokenboard[Operator.Minus], ["real", "real"], "real", ([x, y]) => x-y),
  bake(Tokenboard[Operator.Star], ["real", "real"], "real", ([x, y]) => x*y),
  bake(Tokenboard[Operator.Slash], ["real", "real"], "real", ([x, y]) => x/y),
  bake(Tokenboard[Operator.Caret], ["real", "real"], "real", ([x, y]) => x^y),
  bake(Tokenboard[Operator.StarStar], ["real", "real"], "real", ([x, y]) => x**y),
// meditation: assignors are not baked… they are piled outright
  bake(Tokenboard[Operator.Plus], ["pair"], "pair", ([z]) => z),
  bake(Tokenboard[Operator.Plus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x+w.x, z.y+w.y)),
  bake(Tokenboard[Operator.Minus], ["pair"], "pair", ([z]) => pair(-z.x, -z.y)),
  bake(Tokenboard[Operator.Minus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x-w.x, z.y-w.y)),

  // todo: bake in commutativity
  bake(Tokenboard[Operator.Star], ["real", "pair"], "pair", ([r, z]) => pair(r*z.x, r*z.y)),
  bake(Tokenboard[Operator.Star], ["pair", "real"], "pair", ([z, r]) => pair(r*z.x, r*z.y)),

  bake(Tokenboard[Operator.MinusMinus], ["pair", "pair"], "path", ([z, w]) => new Path([z, w])),
  bake(Tokenboard[Operator.MinusMinus], ["path", "pair"], "path", ([p, z]) => p.add(z)),
  bake(Tokenboard[Operator.MinusMinus], ["path", "string"], "path", ([p, cycle]) => p.becycle(cycle)),

  bake("unitrand", ["real"], "real", Math.random),
  bake("round", ["real"], "int", Math.round),
  bake("sqrt", ["real"], "real", Math.sqrt),
  bake("cbrt", ["real"], "real", Math.cbrt),
  bake("abs", ["real"], "real", Math.abs),
  bake("sin", ["real"], "real", Math.sin),
  bake("cos", ["real"], "real", Math.cos),
  bake("tan", ["real"], "real", Math.tan),
  bake("asin", ["real"], "real", Math.asin),
  bake("acos", ["real"], "real", Math.acos),
  bake("atan", ["real"], "real", Math.atan),
  bake("acosh", ["real"], "real", Math.acosh),
  bake("atanh", ["real"], "real", Math.atanh),
  bake("atan2", ["real", "real"], "real", Math.atan2),
  bake("tanh", ["real"], "real", Math.tanh),
  bake("exp", ["real"], "real", Math.exp),
  bake("expm1", ["real"], "real", Math.expm1),
  bake("hypot", ["real", "real"], "real", Math.hypot),
  bake("log", ["real"], "real", Math.log),
  bake("log10", ["real"], "real", Math.log10),
  bake("log1p", ["real"], "real", Math.log1p),
  bake("unit", ["pair"], "pair", z => ((r: number) => pair(z.x/r, z.y/r))(Math.hypot(z.x, z.y))),
  // consider reifying functions like `dir` and `pair` so that you can refer to them in bakes
  bake("dir", ["real"], "pair", th => ((r: number) => pair(Math.cos(r), Math.sin(r)))(th*Math.PI/180)),
];

/** But what has been caked can uncake. */

const cakeboard = [
  ...bakeboard,

  bake("size", ["real", "real"], "void", ([x, y=x]) => randy.size(x, y)),
  bake("unitsize", ["real", "real"], "void", ([x, y=x]) => randy.unitsize(x, y)),
  bake("write", ["string"], "void", ([s]: [string]) => console.log(s)),

  bake("draw", null, "void", (largs: unknown[]) => underload(draw, [BakedString.is, isSeen, BakedPair.is, BakedPen.is], largs)),
  bake("fill", null, "void", (largs: unknown[]) => underload(fill, [isSeen, BakedPen.is], largs)),
  bake("filldraw", null, "void", (largs: unknown[]) => underload(filldraw, [isSeen, BakedPen.is, BakedPen.is], largs)),
  bake("label", null, "void", (largs: unknown[]) => underload(label, [BakedString.is, BakedPair.is, BakedPair.is, BakedPen.is], largs)),
  bake("dot", null, "void", (largs: unknown[]) => underload(dot, [BakedString.is, BakedPair.is, BakedPair.is, BakedPen.is], largs)),
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
  bake("NW", "not a function", "pair", () => NW),
  bake("NE", "not a function", "pair", () => NE),
  bake("SW", "not a function", "pair", () => SW),
  bake("SE", "not a function", "pair", () => SE),
  bake("cycle", "not a function", "string", () => "cycle"),

  ...[...Color.names.entries()].map(([k,v]) => bake(k, "not a function", "pen", () => Pen.fromColor(v))),
];

export type { Bake, Bakename, BakedFunction };
export type { Pair, Rime };
export { origin, N, S, E, W };

export { Typebakes, bakeboard, cakeboard };
export { BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString };

export { bless, bake, narrow, unload };

export { isSeen };