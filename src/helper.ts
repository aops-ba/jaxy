/** For sundries **/

type Maybe<T> = T | null;
type MaybeOrNot<T> = Maybe<T> | undefined;
type Enumlike = { [key: number]: string };
type Functionlike<T> = (...args: any) => T;
type Curried<T> = (arg: unknown) => T;

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

const UTLOUD = LOUDNESS.Loudly;

function loudly<T>(thing: T, loudness: number=LOUDNESS.Loudly): T {
  if (loudness >= UTLOUD) console.log(...shell(thing));
  return thing;
}

function assert(condition: boolean, message: unknown =null, loudness: number =LOUDNESS.Assert): asserts condition {
  if (!condition) throw new Error(`I can't assert ${message ? `that ${Array.isArray(message) ? message.join(' ') : message}` : "this"}…`);
  else if (message && loudness >= UTLOUD) console.log(...shell(message));
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
  minx: number,
  miny: number
  maxx: number,
  maxy: number,
};

// coordinates of screen area thingy, not coordinates of asymptote world
type Scaling = { x: number, y: number };

type Knowledge = {
  kind?: string,
  (scaling: Scaling): string,
}

const unknowledge: Knowledge = () => "";

/** For working with iterables **/

function min(...xs: number[]): number {
  return xs.reduce((x,y) => Math.min(x,y));
}

function max(...xs: number[]): number {
  return xs.reduce((x,y) => Math.max(x,y));
}

function only<T>(thing: T[]): T {
  assert(thing.length === 1, [thing, "has only one thing in it."]);
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

function peel<T extends unknown[] | string>(xs: T): T {
  return xs.slice(1, -1) as typeof xs;
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
function hurriedly(timeout: number): ($c: Functionlike<boolean>, $f: Functionlike<unknown>) => void {
  return (lc: Functionlike<boolean>, lf: Functionlike<unknown>) => ((lt: number) => { while (lc()) {
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

function timedly<T,U>(work: ($T: T) => U, iterations: number=1): ($T: T) => U {
  const t = Date.now();
  Array(iterations).forEach(work);
  console.log(`${iterations} runs took ${Date.now()-t}ms.`);
  return work;
}

function zip(...teeth: unknown[][]): unknown[][] {
  return flight(Math.max(...teeth.map(x => x.length))).map((_,i) => teeth.map(x => x[i]));
}

/** for growing the brain **/

// lots of todos, this is just a temporary implementation
// make it upcast-safe is the big one
function underload(f: Functionlike<unknown>, checks: Functionlike<boolean>[], args: unknown[]): ReturnType<typeof f> {
  console.log(f, checks, args);
  return (args.length === 0)
    ? f([])
    : (([lleft, lright]: [Maybe<typeof args[0]>, unknown[]]) =>
        (underload((llrest) => f([lleft, ...llrest]), checks.slice(1), lright))
      ) ((checks[0](args[0]) ? [args[0], args.slice(1)] : [null, args]));
}

//function eff([a, b, c]: [Maybe<boolean>, Maybe<number>, Maybe<string>] ): string {
//  return `${a ?? true} ... ${b ?? 1} ... ${c ?? "T"}`;
//}
//
//function underloadTests() {
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], []));
//  console.log("first");
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [false]));
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [-1]));
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], ["hoynos"]));
//  console.log("second");
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [false, -2]));
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [false, "dwoh"]));
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [-2, "dwoh"]));
//  console.log("third");
//  console.log(underload(eff, [BakedBool.is, BakedReal.is, BakedString.is], [false, -3, "treyes"]));
//  console.log("fourth");
//}

function hasTex(s: string): boolean {
  return (s.includes('\\(') && s.includes('\\)'))
      || (s.includes('$') && s.includes('$'))
}

// hides linter warnings
function same(...stuff: unknown[]): void { stuff ? {} : {}; }

export type { Badness };
export { AsyError, LOUDNESS };
export { loudly, timedly, same, assert, hurriedly };

export type { BBox, Scaling, Knowledge };
export { PT, PX, INCH as INCHES, CM, MM, unknowledge };
export { hasTex };

export type { Maybe, MaybeOrNot, Enumlike, Functionlike, Curried };
export { min, max, only, peel, shed, shell, flight, toEach, withEach, maybeArray, enumNames, nextSuchThat, zip };

export { underload };