import { Circle, unitcircle } from "./arc";
import { lift, INCHES, CM, MM, PT, only } from "./helper";
import { Color, Pen } from "./pen";
import { size, unitsize, draw, fill, filldraw, label, dot } from "./render";
import { pair, deet, doot, abs, degrees, N, S, E, W, NW, NE, SW, SE, deer, navel, conj } from "./rime";
import { Tokenboard, Operator } from "./tokens";
import { bake, Bakework, Bakething, cake, Bread as Bread } from "./yeast";

/** What has been baked cannot be unbaked. */

const bakeworks: Bakework[] = [
  bake("size", ["real", "real"], "void", size),
  bake("unitsize", ["real", "real"], "void", unitsize),

  bake(Tokenboard[Operator.Plus], ["string", "string"], "string", ([x, y]) => x+y),
  bake("string", ["real"], "string", ([x]) => x.toString()),
  bake("write", ["string"], "void", lift(console.log)),
  bake("write", ["real"], "void", lift(console.log)),
  bake("write", ["pair"], "void", lift(console.log)),

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
  bake(Tokenboard[Operator.Star], ["pair", "pair"], "pair", ([z, w]) => pair(deet(z, conj(w)), doot(z, conj(w)))),
  bake(Tokenboard[Operator.Slash], ["pair", "pair"], "pair", ([z, w]) => pair(doot(z, w)/abs(w), deet(z, w)/abs(w))),

  bake(Tokenboard[Operator.MinusMinus], ["path", "pair"], "path", ([p, z]) => p.add(z)),
  bake(Tokenboard[Operator.MinusMinus], ["path", "string"], "path", ([p, cycle]) => p.becycle(cycle)),
  bake("draw", ["string", "path", "pair", "pen"], "void", draw),
  bake("fill", ["path", "pen"], "void", fill),
  bake("filldraw", ["path", "pen", "pen"], "void", filldraw),
  bake("label", ["string", "pair", "pair", "pen"], "void", label),
  bake("dot", ["string", "pair", "pair", "pen"], "void", dot),

  bake("circle", ["pair", "real"], "path", ([c,r]) => new Circle(c, r)),
  bake("round", ["real"], "int", lift(Math.round)),

  bake("unitrand", ["real"], "real", lift(Math.random)),
  bake("sqrt", ["real"], "real", lift(Math.sqrt)),
  bake("cbrt", ["real"], "real", lift(Math.cbrt)),
  bake("abs", ["real"], "real", lift(Math.abs)),
  bake("sin", ["real"], "real", lift(Math.sin)),
  bake("cos", ["real"], "real", lift(Math.cos)),
  bake("tan", ["real"], "real", lift(Math.tan)),
  bake("asin", ["real"], "real", lift(Math.asin)),
  bake("acos", ["real"], "real", lift(Math.acos)),
  bake("atan", ["real"], "real", lift(Math.atan)),
  bake("acosh", ["real"], "real", lift(Math.acosh)),
  bake("atanh", ["real"], "real", lift(Math.atanh)),
  bake("tanh", ["real"], "real", lift(Math.tanh)),
  bake("exp", ["real"], "real", lift(Math.exp)),
  bake("expm1", ["real"], "real", lift(Math.expm1)),
  bake("log", ["real"], "real", lift(Math.log)),
  bake("log10", ["real"], "real", lift(Math.log10)),
  bake("log1p", ["real"], "real", lift(Math.log1p)),

  bake("atan2", ["real", "real"], "real", lift(Math.atan2)),
  bake("hypot", ["real", "real"], "real", lift(Math.hypot)),

  bake("abs", ["pair"], "real", ([z]) => abs(z)),
  bake("dir", ["real"], "pair", ([th]) => deer(th)),
  bake("unit", ["pair"], "pair", ([z]) => pair(z.x/abs(z), z.y/abs(z))),
  bake("degrees", ["pair"], "real", ([z]) => degrees(Math.atan2(z.y, z.x))),
];

const bakethings: Bakething[] = [
  cake("inches", "real", INCHES),
  cake("cm", "real", CM),
  cake("mm", "real", MM),
  cake("pt", "real", PT),
  cake("pi", "real", Math.PI),

  cake("origin", "pair", navel),
  cake("N", "pair", N),
  cake("S", "pair", S),
  cake("E", "pair", E),
  cake("W", "pair", W),
  cake("NW", "pair", NW),
  cake("NE", "pair", NE),
  cake("SW", "pair", SW),
  cake("SE", "pair", SE),
  cake("unitcircle", "path", unitcircle),

  ...[...Color.names.entries()].map(([k,v]) => cake(k, "pen", Pen.fromColor(v))),
];

const bakeboard: Bread[] = (bakeworks as Bread[]).concat(bakethings);

function sluice<T extends { name: string }>(board: T[], name: string): T[] {
  return board.filter(x => x.name === name);
}

function isBakework(name: string): boolean {
  return sluice(bakeworks, name).length > 0;
}

function getBakeworks(name: string): Bakework[] {
  return sluice(bakeworks, name);
}

function isBakething(name: string): boolean {
  return sluice(bakethings, name).length > 0;
}

function getBakething(name: string): unknown {
  return only(sluice(bakethings, name)).worth;
}

export { bakeworks, bakethings, bakeboard };
export { isBakework, getBakeworks, isBakething, getBakething };