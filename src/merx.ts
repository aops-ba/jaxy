import { Knowledge, loudly } from "./helper";
import { Parser } from "./parser";

const road = (s: string): string => `/modules/${s}.asy`;

export default async function merx(words: string): Promise<Knowledge[]> {
  loudly("Merxing…");
  return !words ? []
    : new Parser(await (await fetch(road(words))).text()).parse().understandAll();
}