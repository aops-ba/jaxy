"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// todo: how the heck do i import this too
var Infix;
(function (Infix) {
    Infix["Plus"] = "+";
    Infix["Minus"] = "-";
    Infix["Times"] = "*";
    Infix["Divide"] = "/";
    Infix["Quotient"] = "#";
    Infix["Mod"] = "%";
    Infix["Caret"] = "^";
    Infix["Timestimes"] = "**";
})(Infix || (Infix = {}));
var Kind;
(function (Kind) {
    Kind[Kind["Text"] = 0] = "Text";
    Kind[Kind["Value"] = 1] = "Value";
    Kind[Kind["Apply"] = 2] = "Apply";
    Kind[Kind["Tuple"] = 3] = "Tuple";
    Kind[Kind["Comment"] = 4] = "Comment";
})(Kind || (Kind = {}));
String.prototype.first = function () {
    return this.substring(0, 1);
};
String.prototype.last = function () {
    return this.substring(this.length - 1);
};
String.prototype.reverse = function () {
    return [...this].reverse().join('');
};
String.prototype.until = function (char) {
    return this.slice(0, this.indexOf(char));
};
String.prototype.from = function (char) {
    return this.slice(this.lastIndexOf(char) + 1);
};
String.prototype.forkAt = function (index) {
    return [this.slice(0, index), this.slice(index + 1)];
};
String.prototype.indicesOf = function (char) {
    return [...this].map((c, i) => c === char ? i : -1).filter((n) => n >= 0);
};
// trim multiple characters at once
String.prototype.treem = function (...edges) {
    return this.ltreem(...edges).rtreem(...edges);
};
String.prototype.ltreem = function (...edges) {
    return edges.includes(this.first()) ? this.slice(1).ltreem(...edges) : this.toString();
};
String.prototype.rtreem = function (...edges) {
    return edges.includes(this.last()) ? this.slice(0, -1).rtreem(...edges) : this.toString();
};
// split but keep unsplits
String.prototype.spleet = function (separator, limit = 1) {
    return (!limit || limit < 1)
        ? [this.toString()]
        : [this.slice(0, this.indexOf(separator))]
            .concat(this.slice(this.indexOf(separator) + 1)
            .spleet(separator, limit - 1));
};
String.prototype.rspleet = function (separator, limit = 1) {
    return (!limit || limit < 1)
        ? [this.toString()]
        : this.slice(0, this.lastIndexOf(separator))
            .rspleet(separator, limit - 1)
            .concat([this.slice(this.lastIndexOf(separator) + 1)]);
};
const PT = 72; // 72 pt = 1 in
const SF = 0.5 * PT; // linewidth() = 0.5
const ORIENTATION = -1; // (0,1) is up in asy, but down in svg
const ULX = -200;
const ULY = -200;
const W = 400;
const H = 400;
let functions = new Map([
    ['draw', draw],
    ['fill', fill],
    ['filldraw', filldraw],
    ['', _pairOrId],
    ['circle', _circle],
]);
window.onload = function () {
    work();
};
function work() {
    Array.from(document.getElementsByTagName('script'))
        .filter((e) => e.getAttribute("type") === 'text/asy')
        .forEach((s) => asyToSvg(s));
}
function asyToSvg(script) {
    script.outerHTML = `
  <svg width="${W}" height="${H}" viewbox="${ULX} ${ULY} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${linearise(script.innerHTML).map((line) => transpile(pretranspile(line))).join('')}
  </svg>
  `;
}
function linearise(asyBlock) {
    return asyBlock.trim().replace(/[\n\r\s]+/gm, '').split(';');
}
function pretranspile(asy) {
    return asy.replaceAll('unitcircle', 'circle((0,0), 1)')
        .replaceAll('unitsquare', 'box(origin, N+E)')
        .replaceAll('origin', '(0,0)')
        .replaceAll('N', '(0,1)')
        .replaceAll('E', '(1,0)')
        .replaceAll('S', '(0,-1)')
        .replaceAll('W', '(-1,0)')
        .replaceAll(' ', '');
}
function transpile(asy) {
    log('transpile', asy);
    if (asy.length <= 0)
        return '';
    switch (kind(asy)) {
        case Kind.Comment:
            return '';
        case Kind.Apply:
            return _apply(asy);
        default:
            throw new TypeError(`${asy} is high and misshapen`);
    }
}
function _pairOrId(thing) {
    if (_delimited(thing).length === 2) {
        return _pair(thing);
    }
    else {
        return thing;
    }
}
// tfw apply is applicative
function _apply(asy) {
    log('_apply', asy);
    return (_exterior(asy))(interior(asy));
}
function _exterior(asy) {
    log('_exterior', asy);
    assert(functions.has(asy.until('(')));
    return functions.get(asy.until('('));
}
function interior(asy) {
    return asy.slice(asy.indexOf('(') + 1, asy.lastIndexOf(')'));
}
function _parse(asy) {
    log('_parse', asy);
    if (!asy)
        throw Error;
    switch (kind(asy)) {
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
function draw(asy) {
    log('draw', asy);
    return (([path, stroke]) => (_dhregh(path))({ stroke: stroke }))(_parse(asy));
}
function fill(asy) {
    log('fill', asy);
    return (([path, fill]) => (_dhregh(path))({ fill: fill }))(_parse(asy));
}
function filldraw(asy) {
    log('fill', asy);
    return (([path, fill, stroke]) => (_dhregh(path))({ fill: fill, stroke: stroke }))(_parse(asy));
}
function _dhregh(asy) {
    log('_dhregh', asy);
    if (!asy)
        throw Error;
    switch (kind(asy)) {
        case Kind.Apply:
            return _apply(asy);
        default:
            throw Error;
    }
}
function _circle(asy) {
    log('_circle', asy);
    if (!asy)
        throw Error;
    return ((larc) => ((lpen) => `<ellipse rx="${SF * larc.radius}"
              ry="${SF * larc.radius}"
              cx="${SF * larc.center.x}"
              cy="${SF * ORIENTATION * larc.center.y}"
              fill="${lpen.fill ?? 'none'}"
              stroke="${lpen.stroke ?? 'none'}" />`))((([center, radius]) => ({ center: _parse(center), radius: _parse(radius), from: 0, to: 360 }))(_parse(asy)));
}
function _path(asy, pen) {
    log('_path', asy, pen);
    if (!asy)
        throw Error;
    return ((lpath) => `<path d="${lpath.points.map((p, i) => `${i == 0 ? 'M' : 'L'} ${SF * p.x} ${SF * ORIENTATION * p.y} `).join('')}${lpath.cyclic ? 'Z' : ''}" fill="${lpath.pen.fill ?? 'none'}" stroke="${lpath.pen.stroke ?? 'none'}" />`)({ points: asy.replace('--cyclic', '').split('--').map((s) => _parse(s)), cyclic: asy.endsWith('--cyclic'), pen: pen });
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
function __number(asy) {
    log('__number', asy);
    return Number(asy);
}
//deepest layer is depthless
function __text(asy) {
    log('__text', asy);
    return String(asy);
}
function _pair(asy) {
    log('_pair', asy);
    if (!asy)
        throw Error;
    return (([left, right]) => ({ x: _parse(left), y: _parse(right) }))(asy.treem('(', ')').split(','));
}
function _evaluate(asy) {
    log('_evaluate', asy);
    if (!asy)
        throw Error;
    return 5; //(([x,y]: Array<string>): any => _sum(x, y, depth))(asy.forkAt(isInfixShaped(asy, '+')));
}
function _sum(asy1, asy2) {
    log('_sum', asy1, asy2);
    if (!asy1 || !asy2)
        throw Error;
    return ((le, ri) => {
        switch (type(le)) {
            case "pair":
                return { x: le.x + ri.x, y: le.y + ri.y };
            case "number":
                return le + ri;
            default:
                return Error;
        }
    })(_parse(asy1), _parse(asy2));
}
function type(thing) {
    if (typeof thing !== "object") {
        return typeof thing;
    }
    else if ('x' in thing && 'y' in thing) {
        return "pair";
    }
    else {
        throw Error;
    }
}
function log(name, ...args) {
    console.log(`calling ${name} on ${args.join(',')}`);
}
function kind(asy) {
    if (!asy)
        throw Error;
    if (asy.startsWith('//')) {
        return Kind.Comment;
    }
    else if (asy.until('(').match(/([a-zA-Z0-9]|_)*/) && asy.last() === ')') {
        return Kind.Apply;
    }
    else if (asy.indicesOf(',').filter((n) => asy.forkAt(n).every(isBracketsMatched))[0] ?? -1) {
        return Kind.Tuple;
    }
    else {
        return Kind.Value;
    }
}
// helpers.ts
function loudly(speech) {
    console.log(speech);
    return speech;
}
function _delimited(s, delimiter = ',') {
    if (!s)
        throw Error;
    return chain([-1].concat(delimiters(s, delimiter))
        .concat([s.length]))
        .map(([left, right]) => s.slice(left + delimiter.length, right));
}
function isBracketsMatched(asy) {
    return [...asy].filter((c) => c === '(').length === [...asy].filter((c) => c === ')').length;
}
function delimiters(s, delimiter = ',') {
    return s.indicesOf(delimiter).filter((n) => s.forkAt(n).every(isBracketsMatched));
}
function chain(list) {
    return list.slice(0, -1).map((v, i) => [v, list[i + 1]]);
}
function assert(condition) {
    if (!condition) {
        throw Error;
    }
}
//# sourceMappingURL=asyjax.js.map