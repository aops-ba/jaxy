import {
  erf,
  erfc,
  factorial,
  gammaComplex,
  gammaReal,
  ldexp,
  logComplex,
  quadraticrootsReal
} from "./special_functions.ts";
import { AsyError } from "./helper.ts";

export type AsyType<JSType> = {
  name: string;
  dimensions: number;
  default: () => JSType;
  typecheck: (thing: unknown) => thing is JSType;
  toString: (x: JSType) => string;
}

export type AsyArrayType<T> = AsyType<T[]>;


function escapeString(str: string): string {
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;
}

const INT_MAX = 9223372036854775807n;
const INT_MIN = -9223372036854775808n;
function checkOverflow(v: bigint): bigint {
  if (v > INT_MAX || v < INT_MIN) {
    throw new AsyError("Integer overflow");
  }
  return v;
}

function divideByZero(v: number): number {
  if (v === 0) {
    throw new AsyError("Divide by zero");
  }
  return v;
}

function divideByZeroInt(v: bigint): bigint {
  if (v === 0n) {
    throw new AsyError("Divide by zero");
  }
  return v;
}

//const bakeboard: Map<string, TSFunctionType<any>> = new Map([
//  /** BASIC STRING BUILTINS */
//  bake("string", "string(int)", (x) => x.toString()),
//  // TODO fix
//  bake("string", "string(real, int)", (x, digits) => x.toFixed(Number(digits))),
//
//  /** BASIC REAL/INT BUILTINS **/
//
//  // some makeshift `pair` stuff
//  bake("+", "pair(pair, pair)", (z, w) => ({ x: z.x+w.x, y: z.y+w.y })),
//  bake("-", "pair(pair, pair)", (z, w) => ({ x: z.x-w.x, y: z.y-w.y })),
//  bake("-", "pair(pair)", (z) => ({ x: -z.x, y: -z.y })),
//  bake("*", "pair(real, pair)", (n, z) => ({ x: n*z.x, y: n*z.y })),
//
//] as [string, TSFunctionType<any>][]);

// todo: beautification
type BuiltinTypeKey = keyof typeof BakedTypes;

type TSType<T extends string>
  = T extends BuiltinTypeKey
    ? (typeof BakedTypes)[T] extends AsyType<infer JSTy>
      ? JSTy
      : never
    : never;

type TSArrayType<T extends string>
  = T extends `${infer Base}[]`
    ? TSArrayType<Base>[]
    : TSType<T>;

type TSArgsType<T extends string>
  = T extends `${infer Arg}, ${infer Rest}`
    ? [TSArrayType<Arg>, ...TSArgsType<Rest>]
    : T extends ""
      ? []
      : [TSArrayType<T>];

type TSFunctionType<T extends string>
  = T extends `${infer R}(${infer Args})`
    ? (...args: TSArgsType<Args>) => TSArrayType<R>
    : never;


export function bake<N extends string, S extends string>(name: N, _: S, spell: TSFunctionType<S>) {
  return [name, spell];
}


bake("+", "int[](int, int[])", (x, y) => y.map((v) => checkOverflow(x + v)));
bake("+", "int[](int[], int)", (x, y) => x.map((v) => checkOverflow(v + y)));
bake("+", "real[](real[], real[])", (x, y) => {
  if (x.length !== y.length) {
    throw new AsyError("Array size mismatch");
  }
  return x.map((v, i) => v + y[i]);
});
bake("+", "real[](real, real[])", (x, y) => y.map((v) => x + v));
bake("+", "real[](real[], real)", (x, y) => x.map((v) => v + y));

/** SPECIAL FUNCTIONS */

bake("erf", "real(real)", erf);
bake("erfc", "real(real)", erfc);
bake("gamma", "real(real)", gammaReal);
// TODO mark explicit
bake("gamma", "pair(pair)", gammaComplex);
bake("isnan", "bool(real)", Number.isNaN);
bake("factorial", "int(int)", factorial);
bake("ldexp", "real(real, int)", ldexp);
bake("log", "pair(pair)", logComplex);
bake("quadraticroots", "real[](real, real, real)", quadraticrootsReal);
bake("uniform", "real[](real, real, int)", (lo, hi, n) => {
  if (n > 100000n) {
    throw new AsyError("Invalid argument");
  }
  const k = Number(n);
  const result: number[] = [];
  for (let i = 0; i <= k; ++i) {
    result.push(lo + (hi - lo) * (i / k));
  }
  return result;
});
bake("pow10", "real(real)", x => Math.pow(10, x));
bake("tan", "real[](real[])", (x) => x.map(Math.tan));

/** COMPLEX BUILTINS **/

bake("sin", "pair(pair)", (v) => {
  const re = v.x, im = v.y;
  return { x: Math.sin(re) * Math.cosh(im), y: Math.cos(re) * Math.sinh(im) };
});
bake("cos", "pair(pair)", (v) => {
  const re = v.x, im = v.y;
  return { x: Math.cos(re) * Math.cosh(im), y: -Math.sin(re) * Math.sinh(im) };
});
bake("*", "pair(pair, pair)", (a, b) => {
  return { x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x };
});
bake("/", "pair(pair, pair)", (a, b) => {
  const denom = divideByZero(b.x * b.x + b.y * b.y);
  return { x: (a.x * b.x + a.y * b.y) / denom, y: (a.y * b.x - a.x * b.y) / denom };
});
bake("abs", "real(pair)", (v) => Math.hypot(v.x, v.y));
bake("abs", "real(triple)", (v) => Math.hypot(v.x, v.y, v.z));
bake("abs2", "real(pair)", (v) => v.x * v.x + v.y * v.y);
bake("abs2", "real(triple)", (v) => v.x * v.x + v.y * v.y + v.z * v.z);
bake("angle", "real(pair, bool)", (v, warn = true) => {
   if (warn && v.x === 0 && v.y === 0) {
     throw new AsyError("Taking angle of (0,0)")
   }
   return Math.atan2(v.y, v.x);
});
bake("azimuth", "real(triple)", (t) => {
  if (t.x === 0 && t.y === 0) {
    throw new AsyError("Taking angle of (0,0)")
  }
  return Math.atan2(t.y, t.x);
});
bake("assert", "void(bool, string)", (cond, string) => {
  if (!cond) {
    throw new AsyError(string);
  }
});
bake("conj", "pair(pair)", (a) => ({ x: a.x, y: -a.y }));
bake("expi", "pair(real)", (x) => ({ x: Math.cos(x), y: Math.sin(x) }));