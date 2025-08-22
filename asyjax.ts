import type { pair } from "./types";
import type { label } from "./types";
import type { arc, path } from "./types";
import type { pen } from "./types";

// todo: how the heck do i import this too
enum Infix {
  Plus = '+',
  Minus = '-',
  Times = '*',
  Divide = '/',
  Quotient = '#',
  Mod = '%',
  Caret = '^',
  Timestimes = '**',
}

enum Kind {
  Text,
  Value,
  Apply,
  Tuple,
  Comment,
}

// todo: move this to a separate file and figure out how the heck to import it
declare global {
  interface String {
    first(): string;
    last(): string;
    reverse(): string;
    from(char: string): string;
    until(char: string): string;
    forkAt(index: number): [string, string];
    indicesOf(char: string): Array<number>;
    treem(...edges: string[]): string;
    ltreem(...edges: string[]): string;
    rtreem(...edges: string[]): string;
    spleet(separator: string, limit?: number): Array<string>;
    rspleet(separator: string, limit?: number): Array<string>;
  }
}

String.prototype.first = function() {
  return this.substring(0,1);
}

String.prototype.last = function() {
  return this.substring(this.length-1);
}

String.prototype.reverse = function() {
  return [...this].reverse().join('');
}

String.prototype.until = function(char) {
  return this.slice(0,this.indexOf(char));
}

String.prototype.from = function(char) {
  return this.slice(this.lastIndexOf(char)+1);
}

String.prototype.forkAt = function(index) {
  return [this.slice(0,index), this.slice(index+1)];
}

String.prototype.indicesOf = function(char) {
  return [...this].map((c: string, i: number) => c === char ? i : -1).filter((n: number) => n>=0);
}

// trim multiple characters at once
String.prototype.treem = function(...edges) {
  return this.ltreem(...edges).rtreem(...edges);
}

String.prototype.ltreem = function(...edges) {
  return edges.includes(this.first()) ? this.slice(1).ltreem(...edges) : this.toString();
}

String.prototype.rtreem = function(...edges) {
  return edges.includes(this.last()) ? this.slice(0,-1).rtreem(...edges) : this.toString();
}

// split but keep unsplits
String.prototype.spleet = function(separator, limit=1) {
  return (!limit || limit < 1)
    ? [this.toString()]
    : [this.slice(0,this.indexOf(separator))]
      .concat(this.slice(this.indexOf(separator)+1)
      .spleet(separator, limit-1));
}

String.prototype.rspleet = function(separator, limit=1) {
  return (!limit || limit < 1)
    ? [this.toString()]
    : this.slice(0,this.lastIndexOf(separator))
      .rspleet(separator, limit-1)
      .concat([this.slice(this.lastIndexOf(separator)+1)]);
}

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

let functions: Map<string, Function> = new Map([
  ['draw', draw],
  ['fill', fill],
  ['filldraw', filldraw],
  ['', _pairOrId],
  ['circle', _circle],
])

window.onload = function() {
  work();
}

function work(): void {
  Array.from(document.getElementsByTagName('script'))
    .filter((e) => e.getAttribute("type") === 'text/asy')
    .forEach((s) => asyToSvg(s));
}

function asyToSvg(script: HTMLScriptElement): void {
  script.outerHTML = `
  <svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${linearise(script.innerHTML).map((line: string): string => transpile(pretranspile(line))).join('')}
  </svg>
  `;
}

function linearise(asyBlock: string): string[] {
  return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
  
function pretranspile(asy: string): string {
  return asy.replaceAll('unitcircle', 'circle((0,0), 1)')
    .replaceAll('unitsquare', 'box(origin, N+E)')
    .replaceAll('origin', '(0,0)')
    .replaceAll('N', '(0,1)')
    .replaceAll('E', '(1,0)')
    .replaceAll('S', '(0,-1)')
    .replaceAll('W', '(-1,0)')
    .replaceAll(' ', '')
    ;
}

function transpile(asy: string): string {
  log('transpile', asy);
  if (asy.length <= 0) return '';

  switch (kind(asy)) {
    case Kind.Comment:
      return '';
    case Kind.Apply:
      return _apply(asy);
    default:
      throw new TypeError(`${asy} is high and misshapen`);
  }
}

function _pairOrId(thing: string): pair | string {
  if (_delimited(thing).length === 2) {
    return _pair(thing);
  } else {
    return thing;
  }
}

// tfw apply is applicative
function _apply(asy: string): any {
  log('_apply', asy);
  return (_exterior(asy))(interior(asy));
}

function _exterior(asy: string): Function {
  log('_exterior', asy);
  assert(functions.has(asy.until('(')));
  return functions.get(asy.until('('))!;
}

function interior(asy: string): string {
  return asy.slice(asy.indexOf('(')+1,asy.lastIndexOf(')'));
}

function _parse(asy: string | undefined): any {
  log('_parse', asy);
  if (!asy) throw Error;

  switch(kind(asy)) {
    case Kind.Apply:
      return _apply(asy);
    case Kind.Tuple:
      return _delimited(asy);
    case Kind.Text:
      return __text(asy);
    case Kind.Value:
      return _evaluate(asy);
    default:
      throw new TypeError(`${asy} is low and misshapen`);
  }
}

function draw(asy: string): string {
  log('draw', asy);
  return (([path,stroke]) => (_dhregh(path))({ stroke: stroke }))
    (_parse(asy));
}

function fill(asy: string): string {
  log('fill', asy);
  return (([path,fill]) => (_dhregh(path))({ fill: fill }))
    (_parse(asy));
}

function filldraw(asy: string): string {
  log('fill', asy);
  return (([path,fill,stroke]) => (_dhregh(path))({ fill: fill, stroke: stroke }))
    (_parse(asy));
}

function _dhregh(asy: string | undefined): (pen: pen) => string {
  log('_dhregh', asy);
  if (!asy) throw Error;

  switch (kind(asy)) {
    case Kind.Apply:
      return _apply(asy);
    default:
      throw Error;
  }
}

function _circle(asy: string | undefined): (pen: pen) => string {
  log('_circle', asy);
  if (!asy) throw Error;

  return ((larc: arc): (($pen: pen) => string) => ((lpen: pen): string =>
    `<ellipse rx="${SF*larc.radius}"
              ry="${SF*larc.radius}"
              cx="${SF*larc.center.x}"
              cy="${SF*ORIENTATION*larc.center.y}"
              fill="${lpen.fill ?? 'none'}"
              stroke="${lpen.stroke ?? 'none'}" />`))
    ((([center,radius]: Array<string>): arc => ({ center: _parse(center), radius: _parse(radius), from: 0, to: 360 }))
    (_parse(asy)));
}

function _path(asy: string | undefined, pen: { fill?: string | undefined, stroke?: string | undefined}): string {
  log('_path', asy, pen);
  if (!asy) throw Error;

  return ((lpath: path): string => `<path d="${lpath.points.map((p: pair, i: number): string => `${i==0 ? 'M' : 'L'} ${SF*p.x} ${SF*ORIENTATION*p.y} `).join('')}${lpath.cyclic ? 'Z' : ''}" fill="${lpath.pen.fill ?? 'none'}" stroke="${lpath.pen.stroke ?? 'none'}" />`)
    ({ points: asy.replace('--cyclic', '').split('--').map((s: string): pair => _parse(s)), cyclic: asy.endsWith('--cyclic'), pen: pen });
}

//fix this
//function _label(asy: string | undefined, pen: { fill?: string | undefined, stroke?: string | undefined}): string {
//  log('_label', asy, pen);
//  if (!asy) throw Error;
//
//  return ((llabel: label): string => (`<text x="${SF*llabel.position.x}" y="${SF*llabel.position.y}" fill="${llabel.pen.fill ?? 'none'}" stroke="${llabel.pen.stroke ?? 'none'}" />`))
//    ((([text,pos]: Array<string>): label => ({ s: _parse(text), position: _parse(pos), pen: pen }))
//    (_delimited(asy)));
//}

//deepest layer is depthless
function __number(asy: string): number {
  log('__number', asy);
  return Number(asy);
}

//deepest layer is depthless
function __text(asy: string): string {
  log('__text', asy);
  return String(asy);
}

function _pair(asy: string | undefined): pair {
  log('_pair', asy);
  if (!asy) throw Error;

  return (([left,right]: Array<string>): pair => ({ x: _parse(left), y: _parse(right) }))
    (asy.treem('(', ')').split(','));
}

function _evaluate(asy: string | undefined): any {
  log('_evaluate', asy);
  if (!asy) throw Error;

  return 5;//(([x,y]: Array<string>): any => _sum(x, y, depth))(asy.forkAt(isInfixShaped(asy, '+')));
}

function _sum(asy1: string | undefined, asy2: string | undefined): any {
  log('_sum', asy1, asy2);
  if (!asy1 || !asy2) throw Error;

  return ((le,ri): any => {
    switch (type(le)) {
      case "pair":
        return { x: le.x+ri.x, y: le.y+ri.y };
      case "number":
        return le+ri;
      default:
        return Error;
    }
  })(_parse(asy1), _parse(asy2));
}

function type(thing: any): string {
  if (typeof thing !== "object") {
    return typeof thing;
  } else if ('x' in thing && 'y' in thing) {
    return "pair";
  } else {
    throw Error;
  }
}

function log(name: string, ...args: any[]): void {
  console.log(`calling ${name} on ${args.join(',')}`);
}

function kind(asy: string | undefined): Kind {
  if (!asy) throw Error;

  if (asy.startsWith('//')) {
    return Kind.Comment;
  } else if (asy.until('(').match(/([a-zA-Z0-9]|_)*/) && asy.last() === ')') {
    return Kind.Apply;
  } else if (asy.indicesOf(',').filter((n) => asy.forkAt(n).every(isBracketsMatched))[0] ?? -1) {
    return Kind.Tuple;
  } else {
    return Kind.Value;
  }
}

// helpers.ts

function loudly<T>(speech: T): T {
  console.log(speech);
  return speech;
}

function _delimited(s: string | undefined, delimiter=','): Array<string> {
  if (!s) throw Error;
  return chain([-1].concat(delimiters(s, delimiter))
                  .concat([s.length]))
         .map(([left,right]) => s.slice(left+delimiter.length,right));
}

function isBracketsMatched(asy: string): boolean {
  return [...asy].filter((c) => c === '(').length === [...asy].filter((c) => c === ')').length;
}

function delimiters(s: string, delimiter=','): Array<number> {
  return s.indicesOf(delimiter).filter((n) => s.forkAt(n).every(isBracketsMatched));
}

function chain<T>(list: Array<T>): Array<[T, T]> {
  return list.slice(0,-1).map((v,i) => [v, list[i+1] as T]);
}

function assert(condition: boolean): void {
  if (!condition) {
    throw Error;
  }
}