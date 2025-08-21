declare global {
  interface String {
    first(): string;
    last(): string;
    reverse(): string;
    forkAt(index: number): [string, string]
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

type pair = {
  x: number;
  y: number;
}

type path = {
  points: Array<pair>;
  cyclic: boolean;
}

type arc = {
  center: pair;
  radius: number;
  from: number;
  to: number;
}

type pen = {
  fill?: string | undefined;
  stroke?: string | undefined;
}

const PT = 72; // 72 pt = 1 in
const SF = 0.5*PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg

const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;

enum Infices {
  Plus = '+',
  Minus = '-',
  Times = '*',
  Divide = '/',
  Quotient = '#',
  Mod = '%',
  Caret = '^',
  Timestimes = '**',
}

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
    ${parseLines(script.innerHTML).map((line: string): string => read(line)).join('')}
  </svg>
  `;
}

function parseLines(asyBlock: string): string[] {
  return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
  
function read(asyLine: string): string {
  if (asyLine.length <= 0) {
    return '';
  }

  return transpile(pretranspile(asyLine));
}

function pretranspile(asy: string): string {
  return asy.replaceAll('unitcircle', 'circle((0,0), 1)')
    .replaceAll('unitsquare', 'box(origin, N+E)')
    .replaceAll('origin', '(0,0)')
    .replaceAll('N', '(0,1)')
    .replaceAll('E', '(1,0)')
    .replaceAll('S', '(0,-1)')
    .replaceAll('W', '(-1,0)')
    ;
}

function transpile(asy: string): any {
  log(0, 'transpile', asy);

  if (isCommentShaped(asy)) {
    return '';
  } else if (isRoutineShaped(asy, 'draw')) {
    return draw(getRoutineInterior(asy, 'draw'));
  } else if (isRoutineShaped(asy, 'fill')) {
    return fill(getRoutineInterior(asy, 'fill'));
  } else if (isRoutineShaped(asy, 'filldraw')) {
    return filldraw(getRoutineInterior(asy, 'filldraw'));
//  } else if (asy.slice(0,5) === 'label(' && asy.slice(-1) === ')') {
//    return label(asy.slice(5,-1));
  } else {
    throw Error;
  }
}

function _parse(asy: string | undefined, depth: number): any {
  log(depth, '_parse', asy);
  if (!asy) throw Error;

  if (isPairShaped(asy) >= 0) {
    return _pair(asy, depth);
  } else if (isExpressionShaped(asy) >= 0) {
    return _evaluate(asy, depth);
  } else if (asy.first() === '(' && asy.last() === ')') {
    return _brackets(asy.slice(1,-1), depth);
  } else { // assume to be numerical
    return __number(asy);
  }
}

function _brackets(asy: string | undefined, depth: number): any {
  log(depth, '_brackets', asy);
  if (!asy) throw Error;

  return _parse(asy, depth+1);
}

function draw(asy: string): string {
  log(0, 'draw', asy);
  return (([pa,pe]: Array<string>): string => CSS.supports('color', pe ?? ''.trim())
    ? _dhregh(pa, { stroke: pe }, 0)
    : _dhregh([pa, pe].join(','), { stroke: 'black' }, 0))(asy.rspleet(',', 1));
}

function fill(asy: string): string {
  log(0, 'fill', asy);
  return (([pa,pe]: Array<string>): string => _dhregh(pa, { fill: pe }, 0))
    (asy.rspleet(',', 1));
}

function filldraw(asy: string): string {
  log(0, 'filldraw', asy);
  return (([pa,fi,st]: Array<string>): string => _dhregh(pa, { fill: fi, stroke: st }, 0))
    (asy.rspleet(',', 2));
}

function _dhregh(asy: string | undefined, pen: pen, depth: number): string {
  log(depth, '_dhregh', asy, pen);
  if (!asy) throw Error;

  if (asy.slice(0,7) === 'circle(' && asy.slice(-1) === ')') {
    return _circle(asy.slice(7,-1), pen, depth);
  } else { // assume it to be a path lol
    return _path(asy, pen, depth);
  }
}

function _path(asy: string, pen: { fill?: string | undefined, stroke?: string | undefined}, depth: number): string {
  log(depth, '_path', asy, pen);
  return ((pp: path): string => `<path d="${pp.points.map((p: pair, i: number): string => `${i==0 ? 'M' : 'L'} ${SF*p.x} ${SF*ORIENTATION*p.y} `).join('')}${pp.cyclic ? 'Z' : ''}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`)
    ({ points: asy.replace('--cyclic', '').split('--').map((s: string): pair => _parse(s, depth)), cyclic: asy.endsWith('--cyclic') });
}

function _circle(asy: string, pen: { fill?: string | undefined, stroke?: string | undefined}, depth: number): string {
  log(depth, '_circle', asy, pen);
  return ((a: arc): string => (`<ellipse rx="${SF*a.radius}" ry="${SF*a.radius}" cx="${SF*a.center.x}" cy="${SF*ORIENTATION*a.center.y}" fill="${pen.fill ?? 'none'}" stroke="${pen.stroke ?? 'none'}" />`))
    ((([c,r]: Array<string>): arc => ({ center: _parse(c, depth), radius: _parse(r, depth), from: 0, to: 360 }))
    (asy.rspleet(',', 1)));
}

//deepest layer is depthless
function __number(asy: string | undefined): number {
  log(Infinity, '__number', asy);
  if (!asy) throw Error;
  return Number(asy);
}

function _pair(asy: string | undefined, depth: number): pair {
  log(depth, '_pair', asy);
  if (!asy) throw Error;
  return (([le,ri]: Array<string>): pair => ({ x: _parse(le, depth), y: _parse(ri, depth) }))
    (asy.treem('(', ')').split(','));
}

function _evaluate(asy: string | undefined, depth: number): any {
  log(depth, '_evaluate', asy);
  if (!asy) throw Error;

  return (([x,y]: Array<string>): any => _sum(x, y, depth))(asy.forkAt(isInfixShaped(asy, '+')));
}

function _sum(asy1: string | undefined, asy2: string | undefined, depth: number): any {
  log(depth, '_sum', asy1, asy2);
  return ((le,ri): any => {
    switch (type(le)) {
      case "pair":
        return { x: le.x+ri.x, y: le.y+ri.y };
      case "number":
        return le+ri;
      default:
        return Error;
    }
  })(_parse(asy1, depth), _parse(asy2, depth));
}

function isBracketsMatched(asy: string | undefined): boolean {
  if (!asy) throw Error;
  return [...asy].filter((c) => c === '(').length === [...asy].filter((c) => c === ')').length;
}

function isExpressionShaped(asy: string | undefined): number {
  if (!asy) throw Error;
//  console.log(Object.keys(Infices).map((k,v) => [k,v]));
//  return Object.keys(Infices).map((e) => isInfixShaped(asy, e)).sort()[0] || -1;
  return isInfixShaped(asy, '+');
}

function isPairShaped(asy: string | undefined): number {
  if (!asy) throw Error;
  return isInfixShaped(asy, ',');
}

function isInfixShaped(asy: string | undefined, delimiter: string): number {
  if (!asy) throw Error;
  return asy.indicesOf(delimiter).filter((n) => asy.forkAt(n).every(isBracketsMatched))[0] ?? -1;
}

function isRoutineShaped(asy: string | undefined, routine: string): boolean {
  if (!asy) throw Error;
  return asy.startsWith(`${routine}(`) && asy.endsWith(')');
}

function getRoutineInterior(asy: string | undefined, routine: string): string {
  if (!asy) throw Error;
  return asy.slice(routine.length+1,-1);
}

function isCommentShaped(asy: string | undefined): boolean {
  if (!asy) throw Error;
  return asy.startsWith('//');
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

function log(depth: number, name: string, ...args: any[]): void {
  console.log(`${' '.repeat(Math.min(12, 2*(depth+1)))} at depth ${depth}, calling ${name} on ${args.join(',')}`);
}