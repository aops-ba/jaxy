import { Bakename, Typebakes, TypedFunction, isSeen, BakedString, BakedPair, BakedReal, BakedInt, BakedBool, BakedVoid, BakedPath, BakedPen, BakedTransform, pair } from "./bake";
import { assert, Functionlike, loudly, Maybe, only, product, sameArray } from "./helper";
import { Path } from "./path";

function bake(
  name: string,
  inkinds: Maybe<Bakename[]> | "not a function",
  outkind: Bakename | string,
  f: Functionlike<unknown>
): TypedFunction<any, typeof outkind> {
  return ((lf: any) => { lf.namey = name; lf.inkinds = inkinds; lf.outkind = outkind; return lf; })
    ((args: any) => f((args ?? [])
    .map((v: unknown, i: number) =>
      Array.isArray(inkinds) ? bless(v, inkinds[i]) : v)));
}

export function sourdough<T>(name: string, ins: Maybe<Bakename[]>, out: Bakename, f: Functionlike<T>): TypedFunction<any, T> {
//  if (ins !== null) return f();
  return ((lf: any) => { lf.namey = name; lf.inkinds = ins; lf.outkind = out; return lf; })
    (ins === null ? f() : (...args: any) => funderload(f, ins, args));//((args ?? [])
}

// todo: ints and reals behave the same
// todo: we shouldnt need this because we're never actually *check*ing, just casting and throwing elsewise
function bless<T>(thing: T, type: Bakename): T {
  assert(Typebakes[type].is(thing), ["Go,", thing, ", and be now of type", type, "."]);
  return thing;
}

// narrow overloads
function unload<T extends TypedFunction<any, any>>(fs: T | T[], args: unknown[]): T {
  console.log("unload", fs, args);
  if (!Array.isArray(fs)) return fs(...args);
//  else 
//    if (fs.length === 1) return only(fs)(args);
//  else {
//    console.log("wah", loudly(only(fs.filter(f => sameArray(f.inkinds, args.map(bakename))))(...args)));
    return loudly((lfs => lfs.length === 1 ? only(lfs)
    : only(fs.filter(f => canCanLift(f, args.map(bakename)))))
    (fs.filter(f => sameArray(f.inkinds, args.map(bakename)))))(...args);
//    
//    
//    a => bakenamecanCanLift(f, args))
//  )(args);
//  }
}

function canCanLift(f, args) {
//  console.log("cancan", f.inkinds, args);
  return loudly(args.every((v,i) => beraise(v).includes(f.inkinds[i])));
}

function funderload<T>(f: Functionlike<T>, ins: Bakename[], args: unknown[]): T {
  console.log("funderload", f, ins, args);
  return (args.length === 0)
  ? f([])
  : (([lleft, lright]: [Maybe<typeof args[0]>, unknown[]]) =>
      (funderload((llrest) => f([lleft, ...llrest]), ins.slice(1), lright))
    ) (canLift(ins[0], args[0]) ? [raise(ins[0], args[0]), args.slice(1)] : [null, args]);
}

function canLift(b: Bakename, thing: unknown): boolean {
  return Typebakes[b].is(raise(b, thing));
}

// pad with nulls
function underload<T>(f: Functionlike<T>, checks: Functionlike<boolean>[], args: unknown[]): T {
  return (args.length === 0)
  ? f([])
  : (([lleft, lright]: [Maybe<typeof args[0]>, unknown[]]) =>
      (underload((llrest) => f([lleft, ...llrest]), checks.slice(1), lright))
    ) ((checks[0](args[0]) ? [args[0], args.slice(1)]
    : checks[0](args[0]) ? [args[0], args.slice(1)]
    
    
    : [null, args]));
}

// swells the inkinds list of bakenames for `f`
// to include all possible lifts (raises)
// todo: make it work for bs.length === 1
function swell(bs: Bakename[]): Bakename[][] {
  return bs.length === 1 ? [bs] : product(...bs.map(beraise));
}

function beraise(b: Bakename): Bakename[] {
  return [b].concat(
    b === "int" ? ["real", "pair"]
    : b === "real" ? ["pair"]
    : b === "pair" ? ["path"]
    : []
  );
}

// lift to match signature
function raise(height: Bakename, thing: unknown): unknown {
  console.log("raise", height, thing);
  if (bakename(thing) === height) return thing;
  else if (BakedInt.is(thing)) {
    switch (height) {
      case "real": return thing as number;
      case "pair": return pair(thing, 0);
      default: throw new Error(`i cant raise ${thing} to ${height}`);
    }
  } else if (BakedReal.is(thing)) {
    switch (height) {
      case "pair": return pair(thing, 0);
      default: throw new Error(`i cant raise ${thing} to ${height}`);
    }
  } else if (BakedPair.is(thing)) {
    switch (height) {
      case "path": return new Path([thing]);
      default: throw new Error(`i cant raise ${thing} to ${height}`);
    }
  } else throw new Error(`i cant raise ${thing} to ${height}`);
}

function bakename(thing: unknown): Bakename {
  console.log("bakename", thing);
  if (isSeen(thing)) return "path";
  else if (BakedPen.is(thing)) return "pen";
  else if (BakedTransform.is(thing)) return "transform";
  else if (BakedString.is(thing)) return "string";
  else if (BakedPath.is(thing)) return "path";
  else if (BakedPair.is(thing)) return "pair";
  else if (BakedReal.is(thing)) return "real";
  else if (BakedInt.is(thing)) return "int";
  else if (BakedBool.is(thing)) return "bool";
  else if (BakedVoid.is(thing)) return "void";
  else throw new Error(`idk what type ${thing} is`);
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


export { bake, bless, unload, bakename, underload, swell };