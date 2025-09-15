import { Circle, unitcircle } from "./arc";
import { CM, Functionlike, INCHES, lift, Maybe, MM, PT } from "./helper";
import { Path } from "./path";
import { Color, Pen } from "./pen";
import { Operator, Tokenboard } from "./tokens";
import { Seen } from "./seen";
import { randy } from "./main";
import { draw, fill, filldraw, dot, label } from "./render";
import { bake, bless, sourdough, underload } from "./yeast";

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

const origin: Pair = { x: 0, y: 0 };
const N: Pair = { x: 0, y: 1 };
const S: Pair = { x: 0, y: -1 };
const E: Pair = { x: 1, y: 0 };
const W: Pair = { x: -1, y: 0 };
const NW: Pair = { x: -Math.sqrt(2), y: Math.sqrt(2) };
const NE: Pair = { x: Math.sqrt(2), y: Math.sqrt(2) };
const SW: Pair = { x: -Math.sqrt(2), y: -Math.sqrt(2) };
const SE: Pair = { x: Math.sqrt(2), y: -Math.sqrt(2) };

// todo
type Transform = {};

function isTypelike(thing: unknown, ...fields: string[]): thing is object {
  return !!thing && typeof thing === "object" && fields.every(s => s in thing);
}

function isSeen(thing: unknown): thing is Seen {
  return thing instanceof Seen;
}

const Typebakes: { [s: string]: Bake<any> } = {
  "void": {
    name: "void",
    dimensions: 0,
    is: (thing: unknown): thing is undefined => typeof thing === "undefined",
  } as Bake<undefined>,
  "bool": {
    name: "bool",
    dimensions: 0,
    is: (thing: unknown): thing is boolean => typeof thing === "boolean",
  } as Bake<boolean>,
  "int": {
    name: "int",
    dimensions: 0,
    is: (thing: unknown): thing is number => typeof thing === "number",
  } as Bake<number>,
  "real": {
    name: "real",
    dimensions: 0,
    is: (thing: unknown): thing is number => typeof thing === "number",
  } as Bake<number>,
  "pair": {
    name: "pair",
    dimensions: 0,
    is: (thing: unknown): thing is Pair => isTypelike(thing, "x", "y"),
  } as Bake<Pair>,
  "path": {
    name: "path",
    dimensions: 0,
    is: (thing: unknown): thing is Seen => thing instanceof Seen,
  } as Bake<Seen>,
  "string": {
    name: "string",
    dimensions: 0,
    is: (thing: unknown): thing is string => typeof thing === "string",
  } as Bake<string>,
  "pen": {
    name: "pen",
    dimensions: 0,
    is: (thing: unknown): thing is Pen => thing instanceof Pen,
  } as Bake<Pen>,
  "transform": {
    name: "transform",
    dimensions: 0,
    is: (thing: unknown): thing is string => false,
  } as Bake<Transform>
} as const;

const BakedVoid: Bake<undefined> = Typebakes["void"];
const BakedBool: Bake<boolean> = Typebakes["bool"];
const BakedInt: Bake<number> = Typebakes["int"];
const BakedReal: Bake<number> = Typebakes["real"];
const BakedPair: Bake<Pair> = Typebakes["pair"];
const BakedPath: Bake<Seen> = Typebakes["path"];
const BakedString: Bake<string> = Typebakes["string"];
const BakedPen: Bake<Pen> = Typebakes["pen"];
const BakedTransform: Bake<Transform> = Typebakes["transform"];

type BakedFunction<T extends unknown[],U> = {
  namey: string,
  inkinds: T | "not a function",
  outkind: U,
  (...args: any): U,
}

function degrees(th: number): number {
  return th*180/Math.PI;
}

function radians(th: number): number {
  return th/degrees(1);
}

/** What has been baked cannot be unbaked. */

const bakeboard: BakedFunction<any, any>[] = [
  sourdough(Tokenboard[Operator.Plus], ["string", "string"], "string", ([x, y]) => x+y),
//  sourdough("string", ["real"], "string", x => x.toString()),
// todo: awaiting int–real rectification
//  bake("string", ["real", "int"], "string", (x, digits) => x.toFixed(digits)),

  sourdough(Tokenboard[Operator.Hash], ["int", "int"], "int", ([x, y]) => Math.floor(x/y)),
  sourdough(Tokenboard[Operator.Percent], ["int", "int"], "int", ([x, y]) => x%y),
  sourdough(Tokenboard[Operator.Gt], ["real", "real"], "bool", ([x, y]) => x>y),
  sourdough(Tokenboard[Operator.Lt], ["real", "real"], "bool", ([x, y]) => x<y),
  sourdough(Tokenboard[Operator.EqEq], ["real", "real"], "bool", ([x, y]) => x===y),

  sourdough(Tokenboard[Operator.Plus], ["real"], "real", ([x]) => x),
  sourdough(Tokenboard[Operator.Plus], ["real", "real"], "real", ([x, y]) => x+y),
  sourdough(Tokenboard[Operator.Minus], ["real"], "real", ([x]) => -x),
  sourdough(Tokenboard[Operator.Minus], ["real", "real"], "real", ([x, y]) => x-y),
  sourdough(Tokenboard[Operator.Star], ["real", "real"], "real", ([x, y]) => x*y),
  sourdough(Tokenboard[Operator.Slash], ["real", "real"], "real", ([x, y]) => x/y),
  sourdough(Tokenboard[Operator.Caret], ["real", "real"], "real", ([x, y]) => x^y),
  sourdough(Tokenboard[Operator.StarStar], ["real", "real"], "real", ([x, y]) => x**y),
// meditation: assignors are not baked… they are piled outright
  sourdough(Tokenboard[Operator.Plus], ["pair"], "pair", ([z]) => z),
  sourdough(Tokenboard[Operator.Plus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x+w.x, z.y+w.y)),
  sourdough(Tokenboard[Operator.Minus], ["pair"], "pair", ([z]) => pair(-z.x, -z.y)),
  sourdough(Tokenboard[Operator.Minus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x-w.x, z.y-w.y)),
  sourdough(Tokenboard[Operator.Star], ["pair", "pair"], "pair", ([z, w]) => pair(deet(z, w), doot(z, w))),

  sourdough(Tokenboard[Operator.MinusMinus], ["path", "pair"], "path", ([p, z]) => p.add(z)),
  sourdough(Tokenboard[Operator.MinusMinus], ["path", "string"], "path", ([p, cycle]) => p.becycle(cycle)),
];

function doot(z: Pair, w: Pair): number {
  return z.x*w.y+z.y*w.x;
}

function deet(z: Pair, w: Pair): number {
  return z.x*w.x-z.y*w.y;
}

/** But what has been caked can uncake. */

const cakeboard = [
  ...bakeboard,

//  sourdough("size", ["real", "real"], "void", randy.size),
//  sourdough("unitsize", ["real", "real"], "void", randy.unitsize),
  sourdough("write", ["string"], "void", lift(console.log)),
  sourdough("write", ["real"], "void", lift(console.log)),
  sourdough("write", ["pair"], "void", lift(console.log)),

  sourdough("draw", ["path", "pen"] , "void", draw),//(largs: unknown[]) => underload(draw, [BakedString.is, isSeen, BakedPair.is, BakedPen.is], largs)),
//  sourdough("draw", ["string", "path", "pair", "pen"] , "void", lift(draw)),//(largs: unknown[]) => underload(draw, [BakedString.is, isSeen, BakedPair.is, BakedPen.is], largs)),
//  bake("fill", null, "void", lift(fill)),//(largs: unknown[]) => underload(fill, [isSeen, BakedPen.is], largs)),
//  bake("filldraw", null, "void", lift(filldraw)),//(largs: unknown[]) => underload(filldraw, [isSeen, BakedPen.is, BakedPen.is], largs)),
//  bake("label", null, "void", lift(label)),//(largs: unknown[]) => underload(label, [BakedString.is, BakedPair.is, BakedPair.is, BakedPen.is], largs)),
//  bake("dot", null, "void", lift(dot)),//(largs: unknown[]) => underload(dot, [BakedString.is, BakedPair.is, BakedPair.is, BakedPen.is], largs)),

//  bake("inches", "not a function", "real", () => INCHES),
//  bake("cm", "not a function", "real", () => CM),
//  bake("mm", "not a function", "real", () => MM),
//  bake("pt", "not a function", "real", () => PT),
//  bake("pi", "not a function", "real", () => Math.PI),

  sourdough("origin", null, "pair", () => origin),
  sourdough("N", null, "pair", () => N),
  sourdough("S", null, "pair", () => S),
  sourdough("E", null, "pair", () => E),
  sourdough("W", null, "pair", () => W),
  sourdough("NW", null, "pair", () => NW),
  sourdough("NE", null, "pair", () => NE),
  sourdough("SW", null, "pair", () => SW),
  sourdough("SE", null, "pair", () => SE),

  sourdough("circle", ["pair", "real"], "path", ([c,r]) => new Circle(c, r)),
//  bake("unitcircle", "not a function", "path", () => unitcircle),
//
//  bake("round", ["real"], "int", lift(Math.round)),
//
//  bake("unitrand", ["real"], "real", lift(Math.random)),
//  bake("sqrt", ["real"], "real", lift(Math.sqrt)),
//  bake("cbrt", ["real"], "real", lift(Math.cbrt)),
//  bake("abs", ["real"], "real", lift(Math.abs)),
//  bake("sin", ["real"], "real", lift(Math.sin)),
//  bake("cos", ["real"], "real", lift(Math.cos)),
//  bake("tan", ["real"], "real", lift(Math.tan)),
//  bake("asin", ["real"], "real", lift(Math.asin)),
//  bake("acos", ["real"], "real", lift(Math.acos)),
//  bake("atan", ["real"], "real", lift(Math.atan)),
//  bake("acosh", ["real"], "real", lift(Math.acosh)),
//  bake("atanh", ["real"], "real", lift(Math.atanh)),
//  bake("tanh", ["real"], "real", lift(Math.tanh)),
//  bake("exp", ["real"], "real", lift(Math.exp)),
//  bake("expm1", ["real"], "real", lift(Math.expm1)),
//  bake("log", ["real"], "real", lift(Math.log)),
//  bake("log10", ["real"], "real", lift(Math.log10)),
//  bake("log1p", ["real"], "real", lift(Math.log1p)),
//
//  bake("atan2", ["real", "real"], "real", lift(Math.atan2)),
//  bake("hypot", ["real", "real"], "real", lift(Math.hypot)),
//
//  bake("abs", ["pair"], "pair", ([z]) => Math.hypot(z.x, z.y)),
//  bake("unit", ["pair"], "pair", ([z]) => ((r: number) => pair(z.x/r, z.y/r))(Math.hypot(z.x, z.y))),
//  // consider reifying functions like `dir` and `unit` so that you can refer to them in bakes
//  bake("dir", ["real"], "pair", ([th]) => ((r: number) => pair(Math.cos(r), Math.sin(r)))(degrees(th))),
//  bake("degrees", ["pair"], "real", ([z]) => degrees(Math.atan2(z.y, z.x))),

  ...[...Color.names.entries()].map(([k,v]) => sourdough(k, null, "pen", () => Pen.fromColor(v))),
];


export type { Bake, Bakename, BakedFunction as TypedFunction };
export type { Pair, Rime };
export { pair, origin, N, S, E, W };

export { Typebakes, bakeboard, cakeboard };
export { BakedVoid, BakedBool, BakedInt, BakedReal, BakedPair, BakedString, BakedPen, BakedPath, BakedTransform };

export { bake, isSeen };