import _ from "lodash/fp";

const loud = false;

//function loudly(...speeches: any[]): any | any[] {
//  return _proudly(loud, ...speeches);
//}
//
//function proudly(...speeches: any[]): any | any[] {
//  return _proudly(true, ...speeches);
//}
//
//function _proudly(condition: boolean=true, ...speeches: any[]): any | any[] {
//  return ((l) => {
//    if (condition) {
//      console.log(l);
//    }
//    return l;
//  })(shed(speeches));
//}

function timely<T,U>(work: ($T: T) => U=_.identity, iterations: number=1): ($T: T) => U {
  const t = _.now();
  _.forEach (work) (Array(iterations));
  console.log(`${iterations} iterations took ${_.now()-t}ms.`);
  return work;
}

// [a] -> a on singletons, else id
function shed(body: unknown): unknown | unknown[] {
  return ((l) => l.length > 1 ? l : l[0])(shell(body));
}

// one-sided inverse of `shed`
// todo: which side
function shell(body: unknown): unknown[] {
  return _.flatten([body]);
}

// hide those warnings
function id(...stuff: any[]): void { stuff ? {} : {}; }

import type { Enumlike } from "./tokens";

function min(...xs: number[]): number {
  return xs.reduce((x,y) => Math.min(x,y));
}

function max(...xs: number[]): number {
  return xs.reduce((x,y) => Math.max(x,y));
}

function peel<T>(xs: T[]): T[] {
  return xs.slice(1,-1);
}

function enumNames(e: Enumlike): string[] {
  return Object.keys(e).filter((k) => isNaN(Number(k)));
}

/**
 * @returns the smallest index `i` in `text[start,text.length]` such that `condition(text[i])`,
 *          or `text.length` otherwise
 */
// todo: beautification
function nextSuchThat(text: string, condition: ($s: string) => boolean, start: number=0): number {
  return [...Array(text.length-start).keys()]
           .map(x => x+start)
           .find(i => condition(text[i]))
         ?? text.length;
}

function weep(tears: string = "wah"): void {
  console.log(tears);
}

function loudly<T>(thing: T): T {
  console.log(thing);
  return thing;
}

function repeatedly<T,U>(body: T, f: (t: T, u: U) => unknown, xs: U[]): T {
  xs.forEach((x) => f(body, x));
  return body;
}

function worry<T>(thing: T): void {
  console.log("uh oh", thing);
}

function maybeArray(s: string | undefined | null): string[] {
  return s ? [s] : [];
}

function meet(thing: Object | null | undefined): void {
  console.log(thing ? thing.constructor.name : "nobody to meet");
}

export { min, max, peel };
export { enumNames, nextSuchThat, maybeArray };
export { weep, loudly, repeatedly, worry, meet };
export { timely, shed, shell, id };