import { proudly } from "./helper";

import type { scaling, Seen } from "./render";

import type { Pair } from "./number";
import { origin } from "./number";

import type { Pens } from "./pen";
import { defaultpen } from "./pen";
import _ from "lodash/fp";

export default class Label implements Seen {
  text: string;
  position: Pair;

  constructor(text: string, position?: Pair) {
    this.text = _.trimChars ('"') (text);
    this.position = position ?? origin;
  }

  show(): ($pens: Pens) => ($scaling: scaling) => string {
    return ({fill, stroke}) => (scaling) =>
      `<text x="${scaling.x*this.position.x}" y="${scaling.y*this.position.y}" fill="${(fill ?? defaultpen).color}"`
     +`text-anchor="middle" dominant-baseline="middle">${this.text}</text>`;
  }
}