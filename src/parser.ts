import type { Token } from "./lexer";
import { TokenEnum, GodToken } from "./lexer";
import { assert, loudly, unempty } from "./helper";

type Phrase = {
  operator?: Operator,
  left?: Phrase,
  right?: Phrase,
  token?: Token,
}

// todo: should these be interfaces
type UnP = Phrase & Required<Pick<Phrase, 'token'>>;
type PrefixP = Phrase & Required<Pick<Phrase, 'operator' | 'right'>>;
type InfixP = Phrase & Required<Pick<Phrase, 'left' | 'operator' | 'right'>>;
type ApplyP = Phrase & Required<Pick<Phrase, 'left' | 'right'>>;

type Operator = {
  token: Token,
  lassoc?: boolean,
}

const God: Operator = { token: GodToken };

function utter(ph: Phrase | undefined): string {
  if (!ph) return '';
  else return `${((lu) => lu ? `(${lu.trim()}` : '')(utter(ph.left))} ${ph.operator?.token.value ?? ph.operator?.token.kind ?? ph.token?.value ?? ph.token?.kind} ${((lu) => lu ? `${lu.trim()})` : '')(utter(ph.right))}`;
}

function utteringly(ph: Phrase): Phrase {
  console.log(utter(ph));
  return ph;
}

export default function parse(tokens: Token[]): Phrase {
  return utteringly(bparse(tokens));
}

function bparse(tokens: Token[], mother: Operator=God): Phrase {
  const left: Phrase = hparse(tokens);
  return tparse(tokens, mother, left);
}

function hparse(tokens: Token[]): Phrase {
  const meal: Token = eat(tokens);
  switch (meal.kind) {
    case TokenEnum.RoundL:
      const right = bparse(tokens, God);
      assert(eat(tokens).kind === TokenEnum.RoundR);
      return right;
    case TokenEnum.Number:
      return { token: meal } as UnP;
    case TokenEnum.Identifier:
      if (taste(tokens).kind === TokenEnum.RoundL) {
        eat(tokens);
        const right = bparse(tokens, God);
        assert(eat(tokens).kind === TokenEnum.RoundR);
        return { operator: { token: meal }, right: right } as PrefixP;
      } else {
        return { token: meal } as UnP;
      }
    default:
      return ((lo) => ((lr) => ({ operator: lo, right: lr} as PrefixP))(bparse(tokens, lo)))({ token: meal });
  }
}

function tparse(tokens: Token[], mother: Operator, left: Phrase): Phrase {
  while (edible(tokens)) {
    const appetite: Token = taste(tokens);
    if (appetite.kind === TokenEnum.RoundR) break;

    const operator: Operator = { token: appetite, lassoc: isLassoc(appetite) } as Operator;
    if (strength(operator) < strength(mother)) break;
    if (strength(operator) === strength(mother) && operator.lassoc) break;

    eat(tokens);
    if (operator.token.kind === TokenEnum.RoundL) {
      const right = bparse(tokens, God);
      eat(tokens);
      left = { left: left, right: right } as ApplyP;
    } else {
      left = { left: left, operator: operator, right: bparse(tokens, operator) } as InfixP;
    }
  }

  return left;
}

function eat(tokens: Token[]): Token {
  const meal: Token = tokens[0];
  console.log(`Eating ${meal.kind}${((lv) => lv ? ': '+lv : '')(meal.value)}…`);
  tokens.shift();
  return meal;
}

function taste(tokens: Token[]): Token {
  return ((lt: Token) => {
    console.log(`Tasting ${lt.kind}${((lv) => lv ? ': '+lv : '')(lt.value)}…`);
    return tokens[0];
  })(tokens[0]);
}

function edible(tokens: Token[]): boolean {
  return tokens.length > 0;
}

function isLassoc(token: Token): boolean {
  return [TokenEnum.Plus, TokenEnum.Minus, TokenEnum.Times, TokenEnum.Divide, TokenEnum.Comma, TokenEnum.Semicolon].includes(token.kind);
}

function strength(operator: Operator): number {
  switch (operator.token.kind) {
    case TokenEnum.GodEnum: 
      return -Infinity;
    case TokenEnum.Identifier: 
      return Infinity;
    case TokenEnum.Times: 
    case TokenEnum.Divide: 
      return 4;
    case TokenEnum.Plus: 
    case TokenEnum.Minus: 
      return 3;
    case TokenEnum.SquareL:
    case TokenEnum.SquareR:
    case TokenEnum.RoundL:
    case TokenEnum.RoundR:
      return 2;
    case TokenEnum.Comma:
      return 1;
    case TokenEnum.Semicolon:
      return 0;
    default:
      throw new Error(operator.token.kind);
  }
}