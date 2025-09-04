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
import {AsyError} from "./error.ts";
import { loudly, weep } from "./helper.ts";

export type AsyReifiedType<JSTy> = {
  // Readable name for this type (e.g. "real" or "real[]")
  name: string;
  // Number of array dimensions
  arrayDims: number;
  // Create a default instance of this type (e.g. 0)
  default: () => JSTy;
  // Check whether this value is of this type
  typeck: (v: any) => v is JSTy;
  // Debug print
  debugPrint: (v: JSTy) => string;
}

export type AsyReifiedArrayType<T> = AsyReifiedType<T[]>;

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

export const BuiltinType = {
  "real": {
    name: "real",
    arrayDims: 0,
    default: () => 0.0,
    typeck: (v: any): v is number => typeof v === "number",
    debugPrint: (v: number) => v.toString(),
  } as AsyReifiedType<number>,
  "void": {
    name: "void",
    arrayDims: 0,
    default: () => undefined,
    typeck: (v: any): v is undefined => v === undefined,
    debugPrint: (_v: undefined) => "void",
  } as AsyReifiedType<undefined>,
  "pair": {
    name: "pair",
    arrayDims: 0,
    default: () => ({ x: 0, y: 0 }),
    typeck: (v: any): v is Vector2 => typeof v === "object" && v !== null && typeof v.x === "number" && typeof v.y === "number",
    debugPrint: (v: Vector2) => `(${v.x}, ${v.y})`,
  } as AsyReifiedType<Vector2>,
  "int": {
    name: "int",
    arrayDims: 0,
    default: () => 0n,
    typeck: (v: any): v is bigint => typeof v === "bigint" && (BigInt.asIntN(64, v) === v),
    debugPrint: (v: bigint) => v.toString(),
  } as AsyReifiedType<bigint>,
  "string": {
    name: "string",
    arrayDims: 0,
    default: () => "",
    typeck: (v: any): v is string => typeof v === "string",
    debugPrint: escapeString,
  } as AsyReifiedType<string>,
  "bool": {
    name: "bool",
    arrayDims: 0,
    default: () => false,
    typeck: (v: any): v is boolean => typeof v === "boolean",
    debugPrint: (x: boolean) => x.toString(),
  } as AsyReifiedType<boolean>,
  "triple": {
    name: "triple",
    arrayDims: 0,
    default: () => ({ x: 0, y: 0, z: 0 }),
    typeck: 0 as any, // TODO
    debugPrint: 0 as any // TODO
  } as AsyReifiedType<Vector3>,
  "transform": {
    name: "transform",
    arrayDims: 0,
    default: () => [1,0,0,1,0,0],
    typeck: 0 as any, // TODO
    debugPrint: 0 as any, // TODO
  } as AsyReifiedType<AffineTransform>
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

type BuiltinTypeKey = keyof typeof BuiltinType;
type ToTSType0<T extends string> = T extends BuiltinTypeKey ? (typeof BuiltinType)[T] extends AsyReifiedType<infer JSTy> ? JSTy : never : never;
type ToTSType1<T extends string> = T extends `${infer Base}[]` ? ToTSType1<Base>[] : ToTSType0<T>;
type MapFnArgs<T extends string> = T extends `${infer Arg}, ${infer Rest}` ? [ToTSType1<Arg>, ...MapFnArgs<Rest>] : T extends "" ? [] : [ToTSType1<T>];
type SignatureToTSType<T extends string> = T extends `${infer R}(${infer Args})` ? (...args: MapFnArgs<Args>) => ToTSType1<R> : never;

export function defineBuiltin<Name extends string, Signature extends string>(name: Name, _: Signature, impl: SignatureToTSType<Signature>) {
  return [name, impl];
}

// Casts between arrays are implicitly defined
function defineBuiltinCast<Src extends string, Tgt extends string>(tgt: Tgt, src: Src, impl: (a: ToTSType1<Src>) => ToTSType1<Tgt>) {
  void src;
  void tgt;
  void impl;
}

defineBuiltinCast("real", "int", (i) => {
  return Number(i);
});
defineBuiltinCast("pair", "int", (i) => ({ x: Number(i), y: 0 }));
defineBuiltinCast("pair", "real", (v) => ({ x: v, y: 0 }));
defineBuiltinCast("string", "real", (v) => v.toString());
defineBuiltinCast("string", "int", (v) => v.toString());

/** BASIC STRING BUILTINS */
defineBuiltin("+", "string(string, string)", (x, y) => x + y);
defineBuiltin("string", "string(int)", (x) => x.toString());
// TODO fix
defineBuiltin("string", "string(real, int)", (x, digits) => x.toFixed(Number(digits)));

/** BASIC REAL/INT BUILTINS **/

defineBuiltin("+", "real(real, real)", (x, y) => x + y);
defineBuiltin("*", "real(real, real)", (x, y) => x * y);
defineBuiltin("-", "real(real, real)", (x, y) => x - y);
defineBuiltin("-", "real(real)", (x) => -x);
defineBuiltin("/", "real(real, real)", (x, y) => x / divideByZero(y));
defineBuiltin("+", "real(real)", (x) => x);
defineBuiltin("abs", "real(real)", Math.abs);

defineBuiltin("*", "int(int, int)", (x, y) => checkOverflow(x * y));
defineBuiltin("-", "int(int, int)", (x, y) => checkOverflow(x - y));
defineBuiltin("-", "int(int)", (x) => checkOverflow(-x));
defineBuiltin("/", "real(int, int)", (x, y) => Number(x) / divideByZero(Number(y)));
// check overflow because INT_MIN / -1 :)
defineBuiltin("#", "int(int, int)", (x, y) => checkOverflow(x / divideByZeroInt(y)));
defineBuiltin("+", "int(int)", (x) => x);
defineBuiltin("abs", "int(int)", (x) => x < 0n ? checkOverflow(-x) : x);
defineBuiltin("%", "int(int, int)", (x, y) => x % divideByZeroInt(y));

defineBuiltin("+", "int[](int, int[])", (x, y) => y.map((v) => checkOverflow(x + v)));
defineBuiltin("+", "int[](int[], int)", (x, y) => x.map((v) => checkOverflow(v + y)));
defineBuiltin("+", "real[](real[], real[])", (x, y) => {
  if (x.length !== y.length) {
    throw new AsyError("Array size mismatch");
  }
  return x.map((v, i) => v + y[i]);
});
defineBuiltin("+", "real[](real, real[])", (x, y) => y.map((v) => x + v));
defineBuiltin("+", "real[](real[], real)", (x, y) => x.map((v) => v + y));
defineBuiltin("+", "int(int, int)", (x, y) => checkOverflow(x + y));

/** SPECIAL FUNCTIONS */

defineBuiltin("atanh", "real(real)", Math.atanh);
defineBuiltin("acos", "real(real)", Math.acos);
defineBuiltin("acosh", "real(real)", Math.acosh);
defineBuiltin("atan", "real(real)", Math.atan);
defineBuiltin("atan2", "real(real, real)", Math.atan2);
defineBuiltin("asin", "real(real)", Math.asin);
defineBuiltin("tanh", "real(real)", Math.tanh);
defineBuiltin("cbrt", "real(real)", Math.cbrt);
defineBuiltin("cos", "real(real)", Math.cos);
defineBuiltin("erf", "real(real)", erf);
defineBuiltin("erfc", "real(real)", erfc);
defineBuiltin("exp", "real(real)", Math.exp);
defineBuiltin("expm1", "real(real)", Math.expm1);
defineBuiltin("gamma", "real(real)", gammaReal);
// TODO mark explicit
defineBuiltin("gamma", "pair(pair)", gammaComplex);
defineBuiltin("hypot", "real(real, real)", Math.hypot);
defineBuiltin("isnan", "bool(real)", Number.isNaN);
defineBuiltin("factorial", "int(int)", factorial);
defineBuiltin("ldexp", "real(real, int)", ldexp);
defineBuiltin("log", "real(real)", Math.log);
defineBuiltin("log", "pair(pair)", logComplex);
defineBuiltin("log10", "real(real)", Math.log10);
defineBuiltin("log1p", "real(real)", Math.log1p);
defineBuiltin("quadraticroots", "real[](real, real, real)", quadraticrootsReal);
defineBuiltin("round", "int(real)", (x) => {
  return checkOverflow(BigInt(Math.round(x)));
});
defineBuiltin("uniform", "real[](real, real, int)", (lo, hi, n) => {
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
defineBuiltin("pow10", "real(real)", x => Math.pow(10, x));
defineBuiltin("sin", "real(real)", Math.sin);
defineBuiltin("sqrt", "real(real)", Math.sqrt);
defineBuiltin("tan", "real(real)", Math.tan);
defineBuiltin("tan", "real[](real[])", (x) => x.map(Math.tan));
defineBuiltin("xpart", "real(triple)", (t) => t.x);
defineBuiltin("ypart", "real(triple)", (t) => t.y);
defineBuiltin("zpart", "real(triple)", (t) => t.z);
// TODO: consider if we should make this optionally deterministic
defineBuiltin("unitrand", "real(real)", Math.random);
defineBuiltin("unit", "pair(pair)", (v) => {
  const d = Math.hypot(v.x, v.y);
  return { x: v.x / d, y: v.y / d };
});
defineBuiltin("unit", "triple(triple)", (v) => {
  const d = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / d, y: v.y / d, z: v.z / d };
});

// defineConstant intMin, intMax

/** COMPLEX BUILTINS **/

defineBuiltin("sin", "pair(pair)", (v) => {
  const re = v.x, im = v.y;
  return { x: Math.sin(re) * Math.cosh(im), y: Math.cos(re) * Math.sinh(im) };
});
defineBuiltin("cos", "pair(pair)", (v) => {
  const re = v.x, im = v.y;
  return { x: Math.cos(re) * Math.cosh(im), y: -Math.sin(re) * Math.sinh(im) };
});
defineBuiltin("*", "pair(pair, pair)", (a, b) => {
  return { x: a.x * b.x - a.y * b.y, y: a.x * b.y + a.y * b.x };
});
defineBuiltin("/", "pair(pair, pair)", (a, b) => {
  const denom = divideByZero(b.x * b.x + b.y * b.y);
  return { x: (a.x * b.x + a.y * b.y) / denom, y: (a.y * b.x - a.x * b.y) / denom };
});
defineBuiltin("abs", "real(pair)", (v) => Math.hypot(v.x, v.y));
defineBuiltin("abs", "real(triple)", (v) => Math.hypot(v.x, v.y, v.z));
defineBuiltin("abs2", "real(pair)", (v) => v.x * v.x + v.y * v.y);
defineBuiltin("abs2", "real(triple)", (v) => v.x * v.x + v.y * v.y + v.z * v.z);
defineBuiltin("angle", "real(pair, bool)", (v, warn = true) => {
   if (warn && v.x === 0 && v.y === 0) {
     throw new AsyError("Taking angle of (0,0)")
   }
   return Math.atan2(v.y, v.x);
});
defineBuiltin("angle", "real(transform)", (v) => {
  return 0; // TODO
});
//defineBuiltin("bezier", "pair(pair, pair, pair, pair, int)", (a, b, c, d, t) => {
//  return 0; // TODO
//});
//defineBuiltin("bezier", "triple(triple, triple, triple, triple, int)", (a, b, c, d, t) => {
//  return 0; // TODO
//});
defineBuiltin("azimuth", "real(triple)", (t) => {
  if (t.x === 0 && t.y === 0) {
    throw new AsyError("Taking angle of (0,0)")
  }
  return Math.atan2(t.y, t.x);
});
defineBuiltin("assert", "void(bool, string)", (cond, string) => {
  if (!cond) {
    throw new AsyError(string);
  }
});
defineBuiltin("+", "pair(pair, pair)", (a, b) => {
  return { x: a.x + b.x, y: a.y + b.y };
});
defineBuiltin("-", "pair(pair, pair)", (a, b) => {
  return { x: a.x - b.x, y: a.y - b.y };
});
defineBuiltin("-", "pair(pair)", (a) => {
  return { x: -a.x, y: -a.y };
});
defineBuiltin("+", "pair(pair)", (a) => a);
defineBuiltin("conj", "pair(pair)", (a) => ({ x: a.x, y: -a.y }));
defineBuiltin("expi", "pair(real)", (x) => ({ x: Math.cos(x), y: Math.sin(x) }));