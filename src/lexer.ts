export type TokenType = {
  name: TokenEnum,
  value?: string | number,
  span: [number, number],
}

export enum TokenEnum {
  Start = 'start', End = 'end',
  Identifier = 'id',
  If = 'if', Else = 'else',
  String = '$', Number = '#',
  RoundL = '(', RoundR = ')', CurlyL = '{', CurlyR = '}', SquareL = '[', SquareR = ']',
  Comma = ',', Colon = ':', Semicolon = ';',
  Comment = '//',
  Plus = '+', Minus = '-', Times = '*', Divide = '/',
}

export default function lex(asy: string, index: number=0): TokenType[] {
  console.log(`Lexing ${asy}…`);
  return _lex(asy.replaceAll(/\s*/gm, ''), index);
}

// todo: implement this non-recursively so it doesnt overflow at 4901 characters lol
function _lex(asy: string, index: number=0): TokenType[] {
  return asy === ''
    ? []
    : ((lnext) => [betoken(lnext, index)].concat(_lex(asy.slice(lnext.length), index+lnext.length)))
        (next(asy));
}

function next(asy: string): string {
  return asy[0] + (asy.at(1) && alphabetic(asy[0], asy[1]) ? next(asy.slice(1)) : '');
}

function betoken(chars: string, index: number): TokenType {
  return (([lname,lvalue]) => (lvalue
                               ? { name: lname, value: lvalue, span: [index, index+chars.length] }
                               : { name: lname, span: [index, index+chars.length] }) as TokenType)
    ( /^['|"].*['|"]$/.test(chars) ? [TokenEnum.String, chars]
    : numeric(chars) ? [TokenEnum.Number, +chars]
    : (chars === 'if') ? [TokenEnum.If]
    : (chars === 'else') ? [TokenEnum.Else]
    : (chars === '(') ? [TokenEnum.RoundL]
    : (chars === ')') ? [TokenEnum.RoundR]
    : (chars === '+') ? [TokenEnum.Plus]
    : (chars === '-') ? [TokenEnum.Minus]
    : (chars === ',') ? [TokenEnum.Comma]
    : (chars === ';') ? [TokenEnum.Semicolon]
    : [TokenEnum.Identifier, chars]);
}

function alphabetic(...ss: string[]): boolean {
  return ss.every((s) => /^[a-zA-Z]+$/.test(s));
}

function numeric(...ss: string[]): boolean {
  return ss.every((s) => /^\d+$/.test(s));
}

function alphanumeric(...ss: string[]): boolean {
  return ss.every((s) => alphabetic(s) && numeric(s));
}