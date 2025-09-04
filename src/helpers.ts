//import type { Enumlike } from "./tokens";
//
//function min(...xs: number[]): number {
//  return xs.reduce((x,y) => Math.min(x,y));
//}
//
//function max(...xs: number[]): number {
//  return xs.reduce((x,y) => Math.max(x,y));
//}
//
//function peel<T>(xs: T[]): T[] {
//  return xs.slice(1,-1);
//}
//
//function enumNames(e: Enumlike): string[] {
//  return Object.keys(e).filter((k) => isNaN(Number(k)));
//}
//
///**
// * @returns the smallest index `i` in `text[start,text.length]` such that `condition(text[i])`,
// *          or `text.length` otherwise
// */
//// todo: beautification
//function nextSuchThat(text: string, condition: ($s: string) => boolean, start: number=0): number {
//  return [...Array(text.length-start).keys()]
//           .map(x => x+start)
//           .find(i => condition(text[i]))
//         ?? text.length;
//}
//
//function weep(tears: string = "wah"): void {
//  console.log(tears);
//}
//
//function loudly<T>(thing: T): T {
//  console.log(thing);
//  return thing;
//}
//
//function repeatedly<T,U>(body: T, f: (t: T, u: U) => unknown, xs: U[]): T {
//  xs.forEach((x) => f(body, x));
//  return body;
//}
//
//function worry<T>(thing: T): void {
//  console.log("uh oh", thing);
//}
//
//function maybeArray(s: string | undefined | null): string[] {
//  return s ? [s] : [];
//}
//
//export { min, max, peel };
//export { enumNames, nextSuchThat, maybeArray };
//export { weep, loudly, repeatedly, worry };