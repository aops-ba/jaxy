import type { TokenType } from "./lexer";
import { TokenEnum } from "./lexer";
import { unempty } from "./helper";

export type Tree = {
  token: TokenType,
  left?: Tree,
  right?: Tree,
}

export default function parse(tokens: TokenType[]): Tree {
  console.log(`Parsing ${tokens.map((lt) => lt.name).join('')}`);
  return _parse(tokens);
}

// todo: renovate or demolish
export function oldmill(tree: Tree | undefined): string  {
  if (!tree) return '';
  else if (!('left' in tree) && !('right' in tree)) return tree.token.value?.toString() || '';
  else return `(${tree.token.value ?? tree.token.name} ${((lm) => `${lm ?? ''}`)([tree.left, tree.right].map(oldmill).filter(unempty).join(' '))})`.replace('))', ') )');
}

// todo: test this lol
// todo: implement precedence
// todo: make sure this doesnt also overflow at an absurdly low depth
// todo: rewrite it less recursively if it does lol
function _parse(tokens: TokenType[], stuff: { holding?: Tree, collar?: TokenEnum } = {}): Tree {
  if (tokens.length === 0 || tokens[0].name === stuff.collar) {
    return stuff.holding!;
  }

  switch (tokens[0].name) {
    case TokenEnum.Number:
      return _parse(tokens.slice(1), { holding: leaf(tokens[0]), collar: stuff.collar });
    case TokenEnum.Plus:
    case TokenEnum.Comma:
    case TokenEnum.Semicolon:
      return ((lprune) => _parse(tokens.slice(2*size(lprune)+1), { holding: { token: tokens[0], left: stuff.holding, right: lprune }, collar: stuff.collar }))
        (_parse(tokens.slice(1), { holding: stuff.holding, collar: stuff.collar }));
    case TokenEnum.RoundL:
      return ((lprune) => _parse(tokens.slice(2*size(lprune)), { holding: lprune, collar: stuff.collar }))
        (_parse(tokens.slice(1), { holding: stuff.holding, collar: TokenEnum.RoundR }));
    case TokenEnum.Identifier:
      return (tokens.at(1)?.name === TokenEnum.RoundL
        ? { token: tokens[0], left: _parse(tokens.slice(1), { holding: stuff.holding, collar: TokenEnum.RoundR }) }
        : _parse(tokens.slice(1), { holding: leaf(tokens[0]), collar: stuff.collar }));
    default:
      throw new Error(`What the heck is this: ${tokens[0].name}`);
  }
}

function leaf(value: TokenType): Tree {
  return { token: value };
}

function size(tree: Tree | undefined): number {
  return !tree ? 0 : 1+size(tree.left)+size(tree.right);
}