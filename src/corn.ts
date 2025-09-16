import { Circle, unitcircle } from "./arc";
import { Yoke } from "./bake";
import { lift, INCHES, CM, MM, PT, only, Functionlike, assert } from "./helper";
import { Color, Pen } from "./pen";
import { size, unitsize, draw, fill, filldraw, label, dot } from "./render";
import { pair, deet, doot, abs, degrees, N, S, E, W, NW, NE, SW, SE, deer, navel, conj } from "./rime";
import { Tokenboard, Operator } from "./tokens";
import { bakework, Bakework, Bakething, bakething, Bread, doRaise, canRaise } from "./yeast";

/** What has been baked cannot be unbaked. */

const bakeworks: Bakework[] = [
  bakework("size", ["real", "real"], "void", size),
  bakework("unitsize", ["real", "real"], "void", unitsize),

  bakework(Tokenboard[Operator.Plus], ["string", "string"], "string", ([x, y]) => x+y),
  bakework("string", ["real"], "string", ([x]) => x.toString()),
  bakework("write", ["string"], "void", lift(console.log)),
  bakework("write", ["real"], "void", lift(console.log)),
  bakework("write", ["pair"], "void", lift(console.log)),

  bakework("string", ["real", "int"], "string", ([x, digits]) => console.log(Number(x).toFixed(Number(digits)))),

  bakework(Tokenboard[Operator.Hash], ["int", "int"], "int", ([x, y]) => Math.floor(x/y)),
  bakework(Tokenboard[Operator.Percent], ["int", "int"], "int", ([x, y]) => x%y),
  bakework(Tokenboard[Operator.Gt], ["real", "real"], "bool", ([x, y]) => x>y),
  bakework(Tokenboard[Operator.Lt], ["real", "real"], "bool", ([x, y]) => x<y),
  bakework(Tokenboard[Operator.EqEq], ["real", "real"], "bool", ([x, y]) => x===y),

  bakework(Tokenboard[Operator.Plus], ["real"], "real", ([x]) => x),
  bakework(Tokenboard[Operator.Plus], ["real", "real"], "real", ([x, y]) => x+y),
  bakework(Tokenboard[Operator.Minus], ["real"], "real", ([x]) => -x),
  bakework(Tokenboard[Operator.Minus], ["real", "real"], "real", ([x, y]) => x-y),
  bakework(Tokenboard[Operator.Star], ["real", "real"], "real", ([x, y]) => x*y),
  bakework(Tokenboard[Operator.Slash], ["real", "real"], "real", ([x, y]) => x/y),
  bakework(Tokenboard[Operator.Caret], ["real", "real"], "real", ([x, y]) => x^y),
  bakework(Tokenboard[Operator.StarStar], ["real", "real"], "real", ([x, y]) => x**y),

// meditation: assignors are not baked… they are piled outright
  bakework(Tokenboard[Operator.Plus], ["pair"], "pair", ([z]) => z),
  bakework(Tokenboard[Operator.Plus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x+w.x, z.y+w.y)),
  bakework(Tokenboard[Operator.Minus], ["pair"], "pair", ([z]) => pair(-z.x, -z.y)),
  bakework(Tokenboard[Operator.Minus], ["pair", "pair"], "pair", ([z, w]) => pair(z.x-w.x, z.y-w.y)),
  bakework(Tokenboard[Operator.Star], ["pair", "pair"], "pair", ([z, w]) => pair(doot(conj(z), w), deet(conj(z), w))),
  bakework(Tokenboard[Operator.Slash], ["pair", "pair"], "pair", ([z, w]) => pair(doot(z, w)/abs(w), deet(z, w)/abs(w))),

  bakework(Tokenboard[Operator.MinusMinus], ["path", "pair"], "path", ([p, z]) => p.add(z)),
  bakework(Tokenboard[Operator.MinusMinus], ["path", "string"], "path", ([p, cycle]) => p.becycle(cycle)),
  bakework("draw", ["string", "path", "pair", "pen"], "void", draw),
  bakework("fill", ["path", "pen"], "void", fill),
  bakework("filldraw", ["path", "pen", "pen"], "void", filldraw),
  bakework("label", ["string", "pair", "pair", "pen"], "void", label),
  bakework("dot", ["string", "pair", "pair", "pen"], "void", dot),

  bakework("circle", ["pair", "real"], "path", ([c,r]) => new Circle(c, r)),
  bakework("round", ["real"], "int", lift(Math.round)),

  bakework("unitrand", ["real"], "real", lift(Math.random)),
  bakework("sqrt", ["real"], "real", lift(Math.sqrt)),
  bakework("cbrt", ["real"], "real", lift(Math.cbrt)),
  bakework("abs", ["real"], "real", lift(Math.abs)),
  bakework("sin", ["real"], "real", lift(Math.sin)),
  bakework("cos", ["real"], "real", lift(Math.cos)),
  bakework("tan", ["real"], "real", lift(Math.tan)),
  bakework("asin", ["real"], "real", lift(Math.asin)),
  bakework("acos", ["real"], "real", lift(Math.acos)),
  bakework("atan", ["real"], "real", lift(Math.atan)),
  bakework("acosh", ["real"], "real", lift(Math.acosh)),
  bakework("atanh", ["real"], "real", lift(Math.atanh)),
  bakework("tanh", ["real"], "real", lift(Math.tanh)),
  bakework("exp", ["real"], "real", lift(Math.exp)),
  bakework("expm1", ["real"], "real", lift(Math.expm1)),
  bakework("log", ["real"], "real", lift(Math.log)),
  bakework("log10", ["real"], "real", lift(Math.log10)),
  bakework("log1p", ["real"], "real", lift(Math.log1p)),

  bakework("atan2", ["real", "real"], "real", lift(Math.atan2)),
  bakework("hypot", ["real", "real"], "real", lift(Math.hypot)),

  bakework("abs", ["pair"], "real", ([z]) => abs(z)),
  bakework("dir", ["real"], "pair", ([th]) => deer(th)),
  bakework("unit", ["pair"], "pair", ([z]) => pair(z.x/abs(z), z.y/abs(z))),
  bakework("degrees", ["pair"], "real", ([z]) => degrees(Math.atan2(z.y, z.x))),
];

const bakethings: Bakething[] = [
  bakething("inches", "real", INCHES),
  bakething("cm", "real", CM),
  bakething("mm", "real", MM),
  bakething("pt", "real", PT),
  bakething("pi", "real", Math.PI),

  bakething("origin", "pair", navel),
  bakething("N", "pair", N),
  bakething("S", "pair", S),
  bakething("E", "pair", E),
  bakething("W", "pair", W),
  bakething("NW", "pair", NW),
  bakething("NE", "pair", NE),
  bakething("SW", "pair", SW),
  bakething("SE", "pair", SE),
  bakething("unitcircle", "path", unitcircle),

  // todo: this
  bakething("cycle", "string", "cycle"),

  ...[...Color.names.entries()].map(([k,v]) => bakething(k, "pen", Pen.fromColor(v))),
];

const bakeboard: Bread[] = (bakeworks as Bread[]).concat(bakethings);

type Cakething = Bakething;
const cakeboard: Cakething[] = [];

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

function getBakething(name: string): Bakething {
  return only(sluice(bakethings, name));
}

function isCake(name: string): boolean {
  return sluice(cakeboard, name).length > 0;
}

function setCake(name: string, y: Yoke, worth: unknown): Cakething {
  console.log("setCake", name, y, worth);
  return isCake(name)
    ? ((cake: Cakething) => {
        cake.worth = doRaise(y, worth);
        return cake;
      })(getCake(name))
    : ((cake: Cakething) => {
        cakeboard.push(cake);
        return cake;
      })({ name, born: y, worth: doRaise(y, worth) });
}

function getCake(name: string): Cakething {
  return only(sluice(cakeboard, name));
}

function wendCake(name: string, f: Functionlike<unknown>): Cakething {
  return ((cake: Cakething) => {
    (lw => {
      assert(canRaise(cake.born, lw), [lw, "can be raised to", cake.born]);
      setCake(cake.name, cake.born, lw);
    })(f(cake.worth));
    return getCake(cake.name);
  })(getCake(name));
}

function emptyCake(): void {
  cakeboard.length = 0;
}

export type { Cakething };
export { bakeworks, bakethings, bakeboard, cakeboard };
export { isBakework, getBakeworks, isBakething, getBakething, emptyCake, isCake, setCake, getCake, wendCake };