import { pair } from "./bake";
import { Functionlike } from "./helper";
import { Parser } from "./parser";
import { underload, bake } from "./yeast";
export default function fandtest() {
  console.log(underload(["string"], ["string"]));
  console.log(underload(["string"], ["string", "int"]));
  console.log(underload(["string"], ["int", "string"]));
  console.log(underload(["string"], ["int", "string", "int"]));
  console.log(underload(["int"], ["int"]));
  console.log(underload(["int"], ["real"]));
  console.log(underload(["int"], ["string", "path", "pair", "pen"]));
  console.log(underload(["path"], ["string", "path", "pair", "pen"]));
  console.log(underload(["path", "pen"], ["string", "path", "pair", "pen"]));
  console.log(underload(["pair", "pen"], ["string", "path", "pair", "pen"]));
  console.log(underload(["pair", "string"], ["string", "path", "pair", "pen"]));
//  happy(["real"], ["int"]);
  return;
  console.log(new Parser("5+6").parse().understandNext());
  console.log(new Parser("(1,2)+(3,4)").parse().understandNext());
  console.log(new Parser("5+(3,4)").parse().understandNext());
  console.log(new Parser("(4,5)+3").parse().understandNext());
  console.log(new Parser("5-6").parse().understandNext());
  console.log(new Parser("(1,2)-(3,4)").parse().understandNext());
  console.log(new Parser("5-(3,4)").parse().understandNext());
  console.log(new Parser("(4,5)*3").parse().understandNext());
  console.log(new Parser("-5").parse().understandNext());
  console.log(new Parser("-(5,5)").parse().understandNext());
}

// dass ja das nichtige ist so verfluchtige, etc
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

