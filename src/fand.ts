import { pair } from "./bake";
import { Functionlike } from "./helper";
import { Parser } from "./parser";
import { sourdough, swell } from "./yeast";
export default function fandtest() {
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