import type { Scaling } from "./randy";
import { Seen } from "./seen";

import type { Pair } from "./number";
import { origin } from "./number";

import { Pens } from "./pen";
import { defaultpen } from "./pen";
import _ from "lodash/fp";

export default class Label implements Seen {
  text: string;
  position: Pair;

  constructor(text: string, position?: Pair) {
    this.text = _.trimChars ('"') (text);
    this.position = position ?? origin;
  }

  ink({fill}: Pens): ($s: string) => string {
    return ((lw: string) => `\\(\\textcolor[RGB]{` + ((lc) => `${lc.r},${lc.g},${lc.b}`)((fill ?? defaultpen).color) + `}`
    + `{${`${_.replace (/\\text{}|\\\(|\\\)/gm)
                          ('')
                          (`\\text{${_.replace (/\\\(/gm)
                                               ('}\\(')
                                               (_.replace (/\\\)/gm)
                                                          ('\\)\\text{')
                                                          (lw)
    )}}}`)}\\)`}`);
  }

  show(pens: Pens): ($scaling: Scaling) => string {
    return (scaling: Scaling) =>
      `<foreignObject x="${scaling.x*this.position.x}" y="${scaling.y*this.position.y}"`
    // todo: compute from bbox instead
      + `width="1000" height="1" style="overflow: visible;">`
      + this.ink(pens)(this.text) + `</foreignObject>`;
  }
}