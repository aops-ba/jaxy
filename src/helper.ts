import _ from "lodash/fp";

/** For working with iterables **/

function min(...xs: number[]): number {
  return xs.reduce((x,y) => Math.min(x,y));
}

function max(...xs: number[]): number {
  return xs.reduce((x,y) => Math.max(x,y));
}

// [a] -> a on singletons, else id
function shed(body: unknown): unknown | unknown[] {
  return ((l) => l.length > 1 ? l : l[0])(shell(body));
}

// left inverse of `shed`
function shell(body: unknown): unknown[] {
  return _.flatten([body]);
}

function peel<T>(xs: T[]): T[] {
  return xs.slice(1,-1);
}

function maybeArray(s: string | undefined | null): string[] {
  return s ? [s] : [];
}

// do `f` to `body` for each thing in `xs`, and then return `body`
function repeatedly<T,U>(body: T, f: (t: T, u: U) => unknown, xs: U[]): T {
  xs.forEach((x) => f(body, x));
  return body;
}

type Enumlike = { [key: number]: string };

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

function worry<T>(thing: T): void {
  console.log(`Uh oh: ${thing}`);
}

function loudly<T>(thing: T): T {
  console.log(thing);
  return thing;
}

function timely<T,U>(work: ($T: T) => U=_.identity, iterations: number=1): ($T: T) => U {
  const t = _.now();
  _.each (work) (Array(iterations));
  console.log(`${iterations} iterations took ${_.now()-t}ms.`);
  return work;
}

// hides linter warnings
function same(...stuff: any[]): void { stuff ? {} : {}; }

export { min, max, shed, shell };
export { peel, maybeArray };

export type { Enumlike };
export { enumNames, nextSuchThat };

export { weep, loudly, timely, repeatedly, worry, same };