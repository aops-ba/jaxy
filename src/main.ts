import "./global.d";

import { Pair, Path } from "./types";
type twain = [number, number];

import { Arc, Circle } from "./types";
import { unitcircle, origin } from "./types";

import type { Pen } from "./types";
import { red, blue, green, defaultpen } from "./types";
import { unfill, unstroke } from "./types";

import { Phrase } from "./parser";

import { Lexeme } from "./tokens";

import { loudly, timely, assert } from "./helper";

import lex from "./lexer";
import parse from "./parser";

const yelling: boolean = false;

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

// todo: compute these based on bounding box (which also needs computed)
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

window.onload = function() {
  Array.from(document.getElementsByTagName("script"))
    .filter((lscript) => lscript.getAttribute("type") === "text/asy")
    .forEach((lscript) => lscript.outerHTML = transpile(lscript.innerHTML.trim()));
}

function transpile(innards: string): string {
  return ((lmilled) => {
    return `<svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      ${lmilled}
    </svg>`;
  })(mill(loudly(parse(lex(innards)))));
}

// the mill that turns phrases into strings
// nb: this analogy no longer works since the phrases aren't called trees anymore
function mill(phrase: Phrase): any {
  yell(`Milling '${phrase.name()}'…`);
  switch (phrase.kind()) {
    case Lexeme.Name:
      // todo: change this to a lookup table
      switch (phrase.value()) {
        case 'filldraw': return filldraw(mill(phrase.right!));
        case 'draw': return draw(mill(phrase.right!));
        case 'circle': return circle(mill(phrase.right!));
        case 'unitcircle': return unitcircle;
        case 'origin': return origin;
        case 'blue': return blue;
        case 'green': return green;
        case 'red': return red;
        default: complain(phrase.name());
      }
      return;
    case Lexeme.Minus:
      return (phrase.left ? mill(phrase.left) : 0) + negate(mill(phrase.right!));
    case Lexeme.Comma:
      return [mill(phrase.left!), mill(phrase.right!)];
    case Lexeme.MinusMinus:
      return path(mill(phrase.left!), mill(phrase.right!));
    case Lexeme.Semicolon:
      return mill(phrase.left!)+(phrase.right ? mill(phrase.right) : '');
    case Lexeme.Number:
      return phrase.token.value;
    default:
      complain(phrase.name());
  }
}

function draw(...args: any[]): string {
  console.log(args);
  return gyenh1(args[0], unfill(args[1] ?? defaultpen));
}

function fill(...args: any[]): string {
  console.log(args);
  return gyenh1(args[0], unstroke(args[1] ?? defaultpen));
}

// todo: fix this cursed indexation
function filldraw(...args: [[Circle, Pen], Pen]): string {
  console.log(args);
  return fill([args[0][0], args[0][1]])+draw([args[0][0], args[1] ?? args[0][1]]);
}

// todo: make other shapes drawable
// todo: this old thing just gets worse and worse
function gyenh1(...args): string {
  console.log(args);
  let path, pen;
  if (Array.isArray(args[0])) {
    path = args[0][0];
    pen = args[0][1];
  } else {
    path = args[0];
    pen = args[1];
  }
  if (path instanceof Path) {
    return `<path d="${path.points.map((v: Pair,k: number): string => `${k==0 ? 'M' : 'L'} ${SF*v.x} ${SF*ORIENTATION*v.y} `).join('')}
                     ${path.cyclic ? 'Z' : ''}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`;
  } else { // tis a circle then lol
    return `<ellipse rx="${SF*path.radius}" ry="${SF*path.radius}"
                     cx="${SF*path.center.x}" cy="${SF*ORIENTATION*path.center.y}"
                     fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`;
  }
}

function circle(args: [twain, number]): Arc {
  return { center: new Pair(args[0][0], args[0][1]), radius: args[1], from: 0, to: 360 };
}

// todo: this code is so embarrassing wah
function path(rest: twain | Path, last: twain): Path {
  if (Array.isArray(rest)) {
    return new Path([new Pair(rest), new Pair(last)]);
  } else {
    return rest.add(new Pair(last));
  }
}

function negate(arg: number): number {
  return -arg;
}

function yell(s: string): void {
  if (yelling) console.log(s);
}

function complain(complaint: string) {
  throw new Error(`What the heck is this: ${complaint}`);
}