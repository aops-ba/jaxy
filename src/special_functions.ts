import {AsyError} from "./helper.ts";

type Vector2 = { x: number, y: number };

// Taken from fdlibm (public domain), compiled to WASM
const { exports } = new WebAssembly.Instance(
    new WebAssembly.Module(
    new Uint8Array(atob("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").split("").map(c => c.charCodeAt(0))).buffer),
    { env: { E: Math.exp } }
);

export const erf = exports.erf as (x: number) => number;
export const erfc = exports.erfc as (x: number) => number;

export function factorial(x: bigint): bigint {
    if (x < 0n) throw new AsyError("Invalid argument");
    if (x >= 21n) throw new AsyError("Integer overflow");  // 21! > 2^63
    let i = 1n;
    while (x) i *= x--;
    return i;
}

export function ldexp(x: number, e: bigint): number {
    return x * Math.pow(2, Number(e));
}

export function gammaReal(x: number): number {
    return x;  // TODO
}

export function gammaComplex(x: Vector2): Vector2 {
    return x;  // TODO
}

export function logComplex(x: Vector2): Vector2 {
    return x;  // TODO
}

export function quadraticrootsReal(a: number, b: number, c: number): number[] {
    // TODO: prevent underflow/overflow by scaling a, b, c into a nice range
    const D = Math.sqrt(b * b - a * c * 4);
    if (D !== D) {
        return [];
    } else if (D > 0) {
        return [(D - b) / (2 * a), (-b - D) / (2 * a)];
    } else {
        return [-b / (2 * a)];
    }
}