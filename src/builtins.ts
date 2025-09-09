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
import {AsyError, Functionlike} from "./helper.ts";
import { loudly, weep } from "./helper.ts";
import { AsyMath, Fielded, Real } from "./number.ts";
import { Path } from "./path.ts";

export type AsyType<JSType> = {
  name: string;
  dimensions: number;
  default: () => JSType;
  typecheck: (thing: unknown) => thing is JSType;
  toString: (x: JSType) => string;
}

export type AsyArrayType<T> = AsyType<T[]>;

//function makeReifiedArrayType<T>(ty: AsyReifiedType<T>): AsyReifiedArrayType<AsyReifiedType<T>> {
//
//}

// Whiteboard?
export type Vector2 = { x: number, y: number };
export type Vector3 = { x: number, y: number, z: number };
export type AffineTransform = [number, number, number, number, number, number];

function escapeString(str: string): string {
  return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")}"`;
}

export const BakedType = {
  "real": {
    name: "real",
    dimensions: 0,
    default: () => 0.0,
    typecheck: (v: any): v is number => typeof v === "number",
    debugPrint: (v: number) => v.toString(),
  } as AsyType<number>,
  "void": {
    name: "void",
    dimensions: 0,
    default: () => undefined,
    typecheck: (v: any): v is undefined => v === undefined,
    debugPrint: (_v: undefined) => "void",
  } as AsyType<undefined>,
  "pair": {
    name: "pair",
    dimensions: 0,
    default: () => ({ x: 0, y: 0 }),
    typecheck: (v: any): v is Vector2 => typeof v === "object" && v !== null && typeof v.x === "number" && typeof v.y === "number",
    debugPrint: (v: Vector2) => `(${v.x}, ${v.y})`,
  } as AsyType<Vector2>,
  "int": {
    name: "int",
    dimensions: 0,
    default: () => 0n,
    typecheck: (v: any): v is bigint => typeof v === "bigint" && (BigInt.asIntN(64, v) === v),
    debugPrint: (v: bigint) => v.toString(),
  } as AsyType<bigint>,
  "string": {
    name: "string",
    dimensions: 0,
    default: () => "",
    typecheck: (v: any): v is string => typeof v === "string",
    debugPrint: escapeString,
  } as AsyType<string>,
  "bool": {
    name: "bool",
    dimensions: 0,
    default: () => false,
    typecheck: (v: any): v is boolean => typeof v === "boolean",
    debugPrint: (x: boolean) => x.toString(),
  } as AsyType<boolean>,
  "triple": {
    name: "triple",
    dimensions: 0,
    default: () => ({ x: 0, y: 0, z: 0 }),
    typecheck: 0 as any, // TODO
    debugPrint: 0 as any // TODO
  } as AsyType<Vector3>,
  "transform": {
    name: "transform",
    dimensions: 0,
    default: () => [1,0,0,1,0,0],
    typecheck: 0 as any, // TODO
    debugPrint: 0 as any, // TODO
  } as AsyType<AffineTransform>
} as const;

//const internedTypes: Map<string, AsyReifiedType<any>> = {
//
//};

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

type BuiltinTypeKey = keyof typeof BakedType;
type TSType<T extends string> = T extends BuiltinTypeKey ? (typeof BakedType)[T] extends AsyType<infer JSTy> ? JSTy : never : never;
type TSArrayType<T extends string> = T extends `${infer Base}[]` ? TSArrayType<Base>[] : TSType<T>;
type TSArgsType<T extends string> = T extends `${infer Arg}, ${infer Rest}` ? [TSArrayType<Arg>, ...TSArgsType<Rest>] : T extends "" ? [] : [TSArrayType<T>];
type TSFunctionType<T extends string> = T extends `${infer R}(${infer Args})` ? (...args: TSArgsType<Args>) => TSArrayType<R> : never;

// i miss haskell
type Forecast<T extends Functionlike<any>> = { [Property in keyof Parameters<T>]: unknown };

export function bake<N extends string, S extends string>(name: N, _: S, spell: TSFunctionType<S>) {
  return [name, spell];
//  return [name, (xs: Forecast<typeof spell>) =>
//    spell(xs.map((v: unknown, k: keyof typeof xs) => cast<Parameters<typeof spell>[typeof k]>(v)))];
  }

//function cast<T>(thing: unknown): T {
//  return cakeboard.get(`${T}`)
//}
//
//function cake<S extends string>(_: S, cast: TSCastType<S>) {
//  return (x: Parameters<typeof cast>): ReturnType<typeof cast> => cast(x);
//}

//const cakeboard: TSCastType<any>[] = [
//  cake("real(int)", i => Number(i)),
//  cake("pair(int)", i => ({ x: Number(i), y: 0 })),
//  cake("pair(real)", r => ({ x: r, y: 0 })),
//  cake("string(real)", r => r.toString()),
//  cake("string(int)", i => i.toString()),
//];

const bakeboard: Map<string, Functionlike<any>> = new Map([
  ["+", AsyMath.plus],
  ["-", AsyMath.minus],
  ["*", AsyMath.times],
  ["/", AsyMath.divide],
  [">", AsyMath.gt],
  ["<", AsyMath.lt],
  ["==", AsyMath.eq],
  ["--", (x,y) => x instanceof Path ? x.add(y) : new Path([x, y])],
] as [string, Functionlike<any>][]);

//const bakeboard: Map<string, TSFunctionType<any>> = new Map([
//  /** BASIC STRING BUILTINS */
//  bake("+", "string(string, string)", (x, y) => x + y),
//  bake("string", "string(int)", (x) => x.toString()),
//  // TODO fix
//  bake("string", "string(real, int)", (x, digits) => x.toFixed(Number(digits))),
//
//  /** BASIC REAL/INT BUILTINS **/
//  bake("+", "real(real, real)", (x, y) => x + y),
//  bake("+", "real(real)", (x) => x),
//  bake("*", "real(real, real)", (x, y) => x * y),
//  bake("-", "real(real, real)", (x, y) => x - y),
//  bake("-", "real(real)", (x) => -x),
//  bake("/", "real(real, real)", (x, y) => x / divideByZero(y)),
//  bake("abs", "real(real)", Math.abs),
//
//  // some makeshift `pair` stuff
//  bake("+", "pair(pair, pair)", (z, w) => ({ x: z.x+w.x, y: z.y+w.y })),
//  bake("-", "pair(pair, pair)", (z, w) => ({ x: z.x-w.x, y: z.y-w.y })),
//  bake("-", "pair(pair)", (z) => ({ x: -z.x, y: -z.y })),
//  bake("*", "pair(real, pair)", (n, z) => ({ x: n*z.x, y: n*z.y })),
//
//] as [string, TSFunctionType<any>][]);




bake("*", "int(int, int)", (x, y) => checkOverflow(x * y));
bake("-", "int(int, int)", (x, y) => checkOverflow(x - y));
bake("-", "int(int)", (x) => checkOverflow(-x));
bake("/", "real(int, int)", (x, y) => Number(x) / divideByZero(Number(y)));
// check overflow because INT_MIN / -1 :)
bake("#", "int(int, int)", (x, y) => checkOverflow(x / divideByZeroInt(y)));
bake("+", "int(int)", (x) => x);
bake("abs", "int(int)", (x) => x < 0n ? checkOverflow(-x) : x);
bake("%", "int(int, int)", (x, y) => x % divideByZeroInt(y));

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
bake("+", "int(int, int)", (x, y) => checkOverflow(x + y));

/** SPECIAL FUNCTIONS */

bake("atanh", "real(real)", Math.atanh);
bake("acos", "real(real)", Math.acos);
bake("acosh", "real(real)", Math.acosh);
bake("atan", "real(real)", Math.atan);
bake("atan2", "real(real, real)", Math.atan2);
bake("asin", "real(real)", Math.asin);
bake("tanh", "real(real)", Math.tanh);
bake("cbrt", "real(real)", Math.cbrt);
bake("cos", "real(real)", Math.cos);
bake("erf", "real(real)", erf);
bake("erfc", "real(real)", erfc);
bake("exp", "real(real)", Math.exp);
bake("expm1", "real(real)", Math.expm1);
bake("gamma", "real(real)", gammaReal);
// TODO mark explicit
bake("gamma", "pair(pair)", gammaComplex);
bake("hypot", "real(real, real)", Math.hypot);
bake("isnan", "bool(real)", Number.isNaN);
bake("factorial", "int(int)", factorial);
bake("ldexp", "real(real, int)", ldexp);
bake("log", "real(real)", Math.log);
bake("log", "pair(pair)", logComplex);
bake("log10", "real(real)", Math.log10);
bake("log1p", "real(real)", Math.log1p);
bake("quadraticroots", "real[](real, real, real)", quadraticrootsReal);
bake("round", "int(real)", (x) => {
  return checkOverflow(BigInt(Math.round(x)));
});
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
bake("sin", "real(real)", Math.sin);
bake("sqrt", "real(real)", Math.sqrt);
bake("tan", "real(real)", Math.tan);
bake("tan", "real[](real[])", (x) => x.map(Math.tan));
bake("xpart", "real(triple)", (t) => t.x);
bake("ypart", "real(triple)", (t) => t.y);
bake("zpart", "real(triple)", (t) => t.z);
// TODO: consider if we should make this optionally deterministic
bake("unitrand", "real(real)", Math.random);
bake("unit", "pair(pair)", (v) => {
  const d = Math.hypot(v.x, v.y);
  return { x: v.x / d, y: v.y / d };
});
bake("unit", "triple(triple)", (v) => {
  const d = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / d, y: v.y / d, z: v.z / d };
});

// defineConstant intMin, intMax

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
bake("angle", "real(transform)", (v) => {
  return 0; // TODO
});
//defineBuiltin("bezier", "pair(pair, pair, pair, pair, int)", (a, b, c, d, t) => {
//  return 0; // TODO
//});
//defineBuiltin("bezier", "triple(triple, triple, triple, triple, int)", (a, b, c, d, t) => {
//  return 0; // TODO
//});
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
bake("+", "pair(pair, pair)", (a, b) => {
  return { x: a.x + b.x, y: a.y + b.y };
});
bake("-", "pair(pair, pair)", (a, b) => {
  return { x: a.x - b.x, y: a.y - b.y };
});
bake("-", "pair(pair)", (a) => {
  return { x: -a.x, y: -a.y };
});
bake("+", "pair(pair)", (a) => a);
bake("conj", "pair(pair)", (a) => ({ x: a.x, y: -a.y }));
bake("expi", "pair(real)", (x) => ({ x: Math.cos(x), y: Math.sin(x) }));

export { bakeboard };