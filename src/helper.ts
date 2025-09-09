import { Align, Pair } from "./number";
import { Pen } from "./pen";
import { Arc } from "./arc";
import { Path } from "./path";

/** For sundries **/

type Maybe<T> = NonNullable<T> | null;
type MaybeOrNot<T> = Maybe<T> | undefined;
type Enumlike = { [key: number]: string };
type Functionlike<T> = (...args: any) => T;
type Curried<T> = (arg: any) => T;

/** For debugging **/

type Badness = "warning" | "error";

enum LOUDNESS {
  Lexer,
  Parser,
  Spanner,
  Piler,
  Assert,
  Loudly,
}

const UTLOUD = 99;//LOUDNESS.Loudly;

function weep(): void {
  console.log("wah");
}

function loudly<T>(thing: T, loudness: number=LOUDNESS.Loudly): T {
  if (loudness >= UTLOUD) console.log(...shell(thing));
  return thing;
}

function roughly(first: unknown, ...rest: unknown[]): never {
  console.log(first, ...rest);
  throw new Error();
}

function assertively(condition: boolean, message: unknown ="assert", loudness: number=LOUDNESS.Assert): asserts condition {
  if (!condition) roughly(`I can't assert ${message ? `that ${message}` : "this"}…`);
  else if (message) loudly(message, loudness);
}

function unreachably(first: unknown, ...rest: unknown[]): never {
  roughly("Unreachable", first, ...rest);
}

class AsyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsyError";
  }
}

/** For measuring **/

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

type Knowledge = {
  kind?: string,
  (scaling: Scaling): string,
}

const unspell: Knowledge = () => "";

/** For working with iterables **/

function min(...xs: number[]): number {
  return xs.reduce((x,y) => Math.min(x,y));
}

function max(...xs: number[]): number {
  return xs.reduce((x,y) => Math.max(x,y));
}

function only<T>(thing: T[]): T {
  assertively(thing.length === 1);
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

function maybeArray<T>(thing: MaybeOrNot<T>): T[] {
  return thing ? [thing] : [];
}

function flight(n: number): number[] {
  return [...Array(n).keys()];
}

// do `f(body,x)` for each `x` in `xs`, and then return `body`
function toEach<T, U, V>(body: T, f: (t: T, u: U) => V, xs: U[]): T {
  xs.forEach((x: U): V => f(body, x));
  return body;
}

// do `f` to each thing in `body`, and then return `body`
function withEach<T, V>(body: T[], f: ($t: T) => V): T[] {
  body.forEach(f);
  return body;
}

// while `$c` do `$f`, but break if it takes longer than `timeout`
function hurriedly(timeout: number): ($c: Functionlike<boolean>, $f: Functionlike<any>) => void {
  return (lc: Functionlike<boolean>, lf: Functionlike<any>) => ((lt) => { while (lc()) {
    if (Date.now()-lt > timeout) {
      console.log("too slow");
      break;
    } else lf();
  }})(Date.now());
}

function enumNames(e: Enumlike): string[] {
  return Object.keys(e).filter((k) => isNaN(Number(k)));
}

// returns the least index `i` in `text[start, text.length` such that `condition(text[i])`,
//   or else `text.length`
function nextSuchThat(text: string, condition: ($s: string) => boolean, start: number=0): number {
  return flight(text.length-start).map(x => x+start).find(i => condition(text[i])) ?? text.length;
}

function timely<T,U>(work: ($T: T) => U=same, iterations: number=1): ($T: T) => U {
  const t = Date.now();
  Array(iterations).forEach(work);
  console.log(`${iterations} runs took ${Date.now()-t}ms.`);
  return work;
}

/** for growing the brain **/

// lots of todos, this is just a temporary implementation
// make it upcast-safe is the big one
function underload(f: Functionlike<any>, checks: Functionlike<boolean>[], args: unknown[]): ReturnType<typeof f> {
  loudly([f, checks, args], 0);
  if (args.length === 0) {
    loudly("got em all", 0);
    return f([]);
  } else if (checks[0](args[0])) {
    loudly("this ones good", 0);
    return underload((lrest) => f([args[0], ...lrest]), checks.slice(1), args.slice(1));
  } else {
    loudly("this ones bad", 0);
    return underload((lrest) => f([null, ...lrest]), checks.slice(1), args);
  }
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
function isAlign(thing: unknown): thing is Align {
  return thing instanceof Pair || thing instanceof Align;
}

function isPen(thing: unknown): thing is Pen {
  return thing instanceof Pen;
}

function isPathlike(thing: unknown): thing is Path | Arc {
  return thing instanceof Path || thing instanceof Arc ;
}

function eff([a, b, c]: [Maybe<boolean>, Maybe<number>, Maybe<string>] ): string {
  return `${a ?? true} ... ${b ?? 1} ... ${c ?? "T"}`;
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

function hasTex(s: string): boolean {
  return (s.includes('\\(') && s.includes('\\)'))
      || (s.includes('$') && s.includes('$'))
}

// hides linter warnings
function same(...stuff: any[]): any { stuff ? {} : {}; }

export type { Badness };
export { AsyError, LOUDNESS };
export { weep, loudly, timely, same, roughly, assertively, unreachably, hurriedly };

export type { BBox, Scaling, Knowledge };
export { PT, PX, INCH, CM, MM, unspell };
export { hasTex };

export type { Maybe, Enumlike, Functionlike, Curried };
export { min, max, only, peel, shed, shell, flight, toEach, withEach, maybeArray, enumNames, nextSuchThat };

export { underload, isAlign, isBoolean, isNumber, isPair, isPen, isString, isPathlike };