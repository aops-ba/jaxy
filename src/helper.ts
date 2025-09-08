import type { Span } from "./tokens";
import { Align, Pair } from "./number";
import { Pen } from "./pen";
import { Arc } from "./arc";
import { Path } from "./path";

export type { Scaling, Knowledge };
export { unspell };

const MADNESS = 0;

// updates at 0
// asserts at 1

function aside(message: unknown, madness: number=2): void {
  if (madness >= MADNESS) console.log(...shell(message));
}

const PT = 1; // 1pt = 1pt
const PX = 4/3; // 3px = 4pt
const INCH = 72; // 1in = 72pt
const CM = INCH*50/127; // 127cm = 50in
const MM = CM*10; // 127cm = 50in

type BBox = {
  width: number,
  height: number,
  minx: number,
  miny: number
};


// coordinates of screen area thingy, not coordinates of asymptote world
type Scaling = { x: number, y: number };
type Knowledge = ($s: Scaling) => string;
const unspell: Knowledge = _ => "";

/** For working with iterables **/

function min(...xs: number[]): number {
  return xs.reduce((x,y) => Math.min(x,y));
}

function max(...xs: number[]): number {
  return xs.reduce((x,y) => Math.max(x,y));
}

function only<T>(thing: T[]): T {
  asyAssert(thing.length === 1);
  return thing[0];
}

// [a] -> a on singletons, else id
function shed(body: unknown): unknown | unknown[] {
  return Array.isArray(body) && body.length === 1 ? only(body) : body;
}

// partial inverse of `shed`
function shell(body: unknown): unknown[] {
  return (Array.isArray(body)) ? body : [body];
}

function peel<T>(xs: T[]): T[] {
  return xs.slice(1,-1);
}

function maybeArray(s: string | undefined | null): string[] {
  return s ? [s] : [];
}

// do `f` to `body` for each thing in `xs`, and then return `body`
function repeatedly<T,U>(body: T, f: (t: T, u: U) => unknown, xs: U[]): T {
  xs.forEach(x => f(body, x));
  return body;
}

type Maybe<T> = NonNullable<T> | null;
type Enumlike = { [key: number]: string };
type Functionlike<T> = (...args: any) => T;

function enumNames(e: Enumlike): string[] {
  return Object.keys(e).filter((k) => isNaN(Number(k)));
}

// todo: beautification
// returns the least index `i` in `text[start, text.length` such that `condition(text[i])`,
//   or else `text.length`
function nextSuchThat(text: string, condition: ($s: string) => boolean, start: number=0): number {
  return [...Array(text.length-start).keys()]
           .map(x => x+start)
           .find(i => condition(text[i]))
         ?? text.length;
}

/** For debugging **/

function weep(tears: string = "wah"): void {
  console.log(tears);
}

function loudly<T>(thing: T): T {
  console.log(thing);
  return thing;
}

function timely<T,U>(work: ($T: T) => U=same, iterations: number=1): ($T: T) => U {
  const t = Date.now();
  Array(iterations).forEach(work);
  console.log(`${iterations} iterations took ${Date.now()-t}ms.`);
  return work;
}

function implies(fore: boolean): ($after: boolean) => boolean {
  if (fore) {
    asyAssert(fore);
    return (lafter) => lafter;
  } else {
    return (lafter) => true;
  }
}

// lots of todos, this is just a temporary implementation
// make it upcast-safe is the big one
function underload(f: Functionlike<any>, checks: Functionlike<boolean>[], args: unknown[]): ReturnType<typeof f> {
  aside([f, checks, args]);
  if (args.length === 0) {
    aside("got em all", 0);
    return f([]);
  } else if (checks[0](args[0])) {
    aside("this ones good", 0);
    return underload((lrest) => f([args[0], ...lrest]), checks.slice(1), args.slice(1));
  } else {
    aside("this ones bad", 0);
    return underload((lrest) => f([null, ...lrest]), checks.slice(1), args);
  }
}

function eff([a, b, c]: [Maybe<boolean>, Maybe<number>, Maybe<string>] ): string {
  return `${a ?? true} ... ${b ?? 1} ... ${c ?? "T"}`;
}

function isBoolean(thing: unknown): thing is boolean {
  return typeof thing === "boolean";
}

function isNumber(thing: unknown): thing is number {
  return typeof thing === "number";
}

function isString(thing: unknown): thing is string {
  return typeof thing === "string";
}

function isPair(thing: unknown): thing is Pair {
  return thing instanceof Pair;
}

// todo: more wisdom
function isAlign(thing: unknown): boolean {
  return thing instanceof Pair || thing instanceof Align;
}

function isPen(thing: unknown): boolean {
  return thing instanceof Pen;
}

function isPathlike(thing: unknown): boolean {
  return thing instanceof Path || thing instanceof Arc ;
}

function underloadTests() {
  console.log(underload(eff, [isBoolean, isNumber, isString], []));
  console.log("first");
  console.log(underload(eff, [isBoolean, isNumber, isString], [false]));
  console.log(underload(eff, [isBoolean, isNumber, isString], [-1]));
  console.log(underload(eff, [isBoolean, isNumber, isString], ["hoynos"]));
  console.log("second");
  console.log(underload(eff, [isBoolean, isNumber, isString], [false, -2]));
  console.log(underload(eff, [isBoolean, isNumber, isString], [false, "dwoh"]));
  console.log(underload(eff, [isBoolean, isNumber, isString], [-2, "dwoh"]));
  console.log("third");
  console.log(underload(eff, [isBoolean, isNumber, isString], [false, -3, "treyes"]));
  console.log("fourth");
}

// hides linter warnings
function same(...stuff: any[]): any { stuff ? {} : {}; }

type Badness = "warning" | "error";

class CompileError {
  constructor(
    public readonly message: string,
    public readonly span: Span,
    public readonly errorType: Badness = "error"
  ) {}
}

class AsyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsyError";
  }
}

function asyAssert(condition: boolean, message?: unknown): asserts condition {
  if (!condition) throw new Error(`I can't assert ${message ? `that ${message}` : "this"}…`);
  else aside(message, 1);
}

function asyUnreachable(message: string = ""): never {
  throw new Error(`Unreachable: ${message}`);
}

export type { Badness };
export { CompileError, AsyError };
export { asyAssert, asyUnreachable };

export { PT, PX, INCH, CM, MM };

export { min, max, shed, shell };
export { peel, maybeArray };

export type { Enumlike, Maybe, Functionlike, BBox };
export { enumNames, nextSuchThat };

export { underload, isAlign, isBoolean, isNumber, isPair, isPen, isString, isPathlike };

export { aside, weep, loudly, timely, repeatedly, same, implies };

export { underloadTests };