import { loudly, type Scaling, type Knowledge } from "./helper";
import { Seen } from "./seen";

import { Pair, Align, W } from "./number";
import { origin } from "./number";

import { Pens } from "./pen";
import { defaultpen } from "./pen";
import _ from "lodash/fp";
import Render, { descale } from "./render";

export default class Label extends Seen {
  static SF: number = 9; // temporary, 1 align pt is about 9 non-align pts

  text: string;
  position: Pair;
  align: Align;

  constructor(text: string, position: Pair, align: Align) {
    super();
    this.text = _.trimChars ('"') (text);
    this.position = position;
    this.align = align;
  }

  ink({fill}: Pens, text: string =""): Knowledge {
    return () => `\\(\\textcolor[RGB]{` + ((lc) => `${lc.r},${lc.g},${lc.b}`)((fill ?? defaultpen).color) + `}`
    + `{${`${_.replace (/\\text{}|\\\(|\\\)/gm) ('') (`\\text{${
             _.replace (/\\\(/gm) ('}\\(') (
             _.replace (/\\\)/gm) ('\\)\\text{') (text))}}}`)}\\)`}`;
  }

  show(pens: Pens): Knowledge {
    return Object.assign((scaling: Scaling) =>
      `<foreignObject x="${scaling.x*(this.position.x+Label.SF*this.align.x)}" y="${scaling.y*(this.position.y+Label.SF*this.align.y)}"`
      + `style="overflow: visible;">`
      + this.ink(pens, this.text)(scaling) + `</foreignObject>`,
      { kind: "show label!" });
  }

//  bbox(): BBox {
//    //todo
//  }
}