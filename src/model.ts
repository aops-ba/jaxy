import { asyUnreachable } from "./error";

import type { Binor, Unor, Assignor, Modifior, Literal } from "./tokens";
import { Keyword, Operator, Separator, Other, DEFSPAN } from "./tokens";

import type { Span } from "./tokens";
import { span } from "./tokens";

import type { Token } from "./tokens";
import { tokenTypeToString } from "./tokens";

import { loudly, maybeArray, weep } from "./helper";
import { lookup, remember, UnscaledSpell, unspell } from "./randy";
import { Pair } from "./number";

export class Phrase {

  constructor(
    public span: Span = DEFSPAN,
    public flags: number = 0,
//    public scope: ScopeChainNode | null = null,
    public docComment: Comment | null = null,
  ) {}

  // Mark this tree as having the following doc comment
  attachDocComment(docComment: Comment | null): Phrase {
    if (docComment) this.docComment = docComment;
    return this;
  }

  visualNodeInfo(): any {
    // Iterate through properties and add whichever ones are part of base tree,
    // or are arrays of base tree
    const children: any[] = [];

    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        const value = this[key];
        if (value instanceof Phrase) {
          children.push(value.visualNodeInfo());
        } else if (Array.isArray(value)) {
          for (const v of value) {
            if (v instanceof Phrase) {
              children.push(v.visualNodeInfo());
            }
          }
        }
      }
    }

    return {
      text: {name: this.constructor.name, title: this.prettyPrint()},
      children,
    };
  }

  /**
   * Traverse all trees of this tree, calling the enter function before visiting children and the exit function after.
   * If the enter function returns false, the tree will not be visited.
   */
  visit(enter: (tree: Phrase) => boolean, exit: (tree: Phrase) => void) {
    if (!enter(this)) return;

    for (const key in this) {
      if (!this.hasOwnProperty(key)) continue;
      const o = this[key] as any;
      if (o instanceof Phrase) {
        o.visit(enter, exit);
      } else if (Array.isArray(o)) {
        for (const v of o) {
          if (!(v instanceof Phrase)) continue;
          v.visit(enter, exit);
        }
      }
    }

    exit(this);
  }

  *iterTokensAndPhrases(): Generator<Token<any> | Phrase> {
    function isToken(o: any): o is Token<any> {
      return typeof o === "object" && o && typeof o.kind === "number";   // close enough :P
    }

    for (const key in this) {
      if (this.hasOwnProperty(key)) {
        const o = this[key] as any;
        if (o instanceof Phrase || isToken(o)) {
          yield o;
        } else if (Array.isArray(o)) {
          for (const v of o) {
            if (v instanceof Phrase || isToken(v)) {
              yield v;
            }
          }
        }
      }
    }
  }

  /**
   * Compute the span of the tree using its tokens.
   */
  resolveSpans() {
    if (this.span.start !== -1) return; // already resolved

    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;

    for (const tokenOrPhrase of this.iterTokensAndPhrases()) {
      if (tokenOrPhrase instanceof Phrase) {
        tokenOrPhrase.resolveSpans();
      }

      min = Math.min(min, tokenOrPhrase.span.start);
      max = Math.max(max, tokenOrPhrase.span.end);
    }

    this.setSpan(span(min, max));
  }

  /**
   * Given a cursor position, find the path of trees and tokens taking us to that cursor position.
   */
  findChainAtPosition(pos: number): (Phrase | Token<any>)[] | null {
    if (this.span.start <= pos && this.span.end >= pos) {
      for (const tokenOrPhrase of this.iterTokensAndPhrases()) {
        if (tokenOrPhrase instanceof Phrase) {
          const result = tokenOrPhrase.findChainAtPosition(pos);
          if (result) return [this, ...result];
        } else if (
          tokenOrPhrase.span.start <= pos &&
          tokenOrPhrase.span.end >= pos
        ) {
          return [this, tokenOrPhrase];
        }
      }
      return [this];
    }
    return null;
  }

  /**
   * Directly set this tree's span.
   */
  setSpan(span: Span): Phrase {
    this.span = span;
    return this;
  }

  /**
   * Print the tree in a reasonably readable manner. It does not have to be isomorphic to the source.
   * todo
   */
  prettyPrint(): string {
    return "";
  }
}

export class DeclareP extends Phrase {}
export class StateP extends Phrase {}
export class OperateP extends Phrase {}
export class ExpressP extends Phrase {}

export class DeclareImportP extends DeclareP {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly importToken: Token<Keyword.import>,
    readonly importTarget: Token<Other.StringLiteral> | IdentifierP | null,
    readonly asToken: Token<Other.Identifier> | null,
    readonly alias: IdentifierP | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class DeclareStructP extends DeclareP {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly structToken: Token<Keyword.struct>,
    readonly name: IdentifierP | null,
    readonly openBrace: Token<Separator.LCurly> | null,
    readonly body: Phrase[] | null,
    readonly closeBrace: Token<Separator.RCurly> | null
  ) { super(); }
}

export class DeclareFunctionP extends DeclareP {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly returnType: Phrase | null,
    readonly isOperator: Token<Keyword.operator> | null,
    readonly name: Token<Operator | Other.Identifier> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly params: DeclareManyVariablesP[],  // each will only have one parameter, generally
    readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly body: BlockP | Phrase | Token<Separator.Semicolon> | null
  ) { super(); }
}

export class DeclareOneVariableP extends DeclareP {
  constructor (
    readonly name: IdentifierP,
    readonly brackets: DimensionsP | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly args: DeclareManyVariablesP[] | null,
    readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly equalsToken: Token<Operator.Eq> | null,
    readonly initializer: Phrase | null
  ) { super(); }

  toString(): string {
    return this.name.toString() + (this.brackets?.toString() ?? "") + (this.args ? this._fmtArgs() : "") + (this.initializer ? this._fmtInitializer() : "");
  }

  private _fmtArgs() {
    return "(" + this.args!.map(a => a.toString()).join(", ") + ")";
  }

  private _fmtInitializer() {
    return " = " + this.initializer!.toString();
  }

  isFunctionType() {
    return this.args !== null;
  }
}

export class DeclareManyVariablesP extends DeclareP {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly type: TypeP | null,
    readonly decls: DeclareOneVariableP[],
    public semicolonToken: Token<Separator.Semicolon> | null
  ) { super(); }

  toString() {
    return [...this.modifiers,
            ...maybeArray(this.type?.toString()),
            ...maybeArray(this.decls.map(a => a.toString()).join(", "))
           ].join(' ');
  }
}

export class TypedefP extends DeclareP {
  constructor (
    readonly typedefToken: Token<Keyword.typedef>,
    readonly asDecl: DeclareManyVariablesP | DeclareFunctionP | null,
  ) { super(); }
}

export class IfP extends StateP {
  constructor (
    readonly ifToken: Token<Keyword.if>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly thenStatement: Phrase | null,
    readonly elseToken: Token<Keyword.else> | null,
    readonly elseStatement: Phrase | null
  ) { super(); }
}

export class ForeachP extends StateP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly elemType: TypeP | null,
    readonly varName: IdentifierP,
    readonly colon: Token<Operator.Colon> | null,
    readonly iterated: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

export class ForP extends StateP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly forInit: Phrase[] | DeclareManyVariablesP | null,
    readonly sep1: Token<Separator.Semicolon> | null,
    readonly forCond: Phrase | null,
    readonly sep2: Token<Separator.Semicolon> | null,
    readonly forUpdate: Phrase[] | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

abstract class WhilePLike extends StateP {
  constructor (
    readonly whileToken: Token<Keyword.while> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

export class WhileP extends WhilePLike {
  declare whileToken: Token<Keyword.while>;
}

// todo: redundancy
export class DowhileP extends WhilePLike {
  constructor (
    readonly doToken: Token<Keyword.do>,
    readonly statement: Phrase | null,
    readonly whileToken: Token<Keyword.while> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(whileToken, openParen, condition, closeParen, statement); }
}

export class BreakP extends StateP {
  constructor (
    readonly breakToken: Token<Keyword.break>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class ContinueP extends StateP {
  constructor (
    readonly continueToken: Token<Keyword.continue>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class ReturnP extends StateP {
  constructor (
    readonly returnToken: Token<Keyword.return>,
    readonly returnExpr: Phrase | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class DimensionsP extends Phrase {
  constructor(readonly brackets: Token<Separator.LSquare | Separator.RSquare>[]) {
    super();
  }

  dims(): number {
    return this.brackets.filter((b) => b.kind === Separator.LSquare).length;
  }

  toString(): string {
    return "[]".repeat(this.dims());
  }
}

export class IdentifierP extends Phrase {
  constructor(readonly name: Token<Other.Identifier>) {
    super();
  }

  getName(): string {
    return this.name.value!;
  }

  toString(): string {
    return this.getName();
  }
}

export class StateExpressionP extends StateP {
  constructor (
    readonly expr: Phrase | null,
    readonly semicolonToken: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class BinorP extends OperateP {
  constructor (
    readonly left: Phrase | null,
    readonly operator: Token<Binor> | null,
    readonly right: Phrase | null,
    readonly isImplicitMultiplication = false
  ) { super(); }

  toString() {
    return "(" + (this.left?.toString() ?? "") + tokenTypeToString(this.operator?.kind || Operator.Star) + (this.right?.toString() ?? "") + ")";
  }
}

export class UnorP extends OperateP {
  constructor (
    readonly operator: Token<Unor>,
    readonly operand: Phrase | null,
    readonly isPrefix: boolean
  ) { super(); }

  toString() {
    const s = this.operand?.toString() ?? "";
    const prefix = this.isPrefix;
    return "(" + (prefix ? "" : s) + tokenTypeToString(this.operator.kind) + (prefix ? s : "") + ")";
  }
}

// e.g. "operator --"
export class OperatorizerP extends Phrase {
  constructor (
    readonly operatorToken: Token<Keyword.operator>,
    readonly op: Token<Operator> | Token<Other.Identifier> | null
  ) { super(); }
}

export class AssignorP extends Phrase {
  constructor(readonly left: Phrase | null,
        readonly equalsToken: Token<Assignor>,
        readonly right: Phrase | null) {
    super();
  }

  toString() {
    return (this.left?.toString() ?? "") + " " + tokenTypeToString(this.equalsToken.kind) + " " + (this.right?.toString() ?? "");
  }
}

export class CallArgsP extends Phrase {
  constructor(readonly argIsSpread: Token<Separator.DotDotDot> | null,
        readonly namedParameter: IdentifierP | null,
        readonly equalsToken: Token<Operator.Eq> | null,
        readonly expr: Phrase | null) {
    super();
  }
}

export class CallP extends Phrase {
  constructor(readonly caller: Phrase,
        readonly openParen: Token<Separator.LRound>,
        readonly args: CallArgsP[],
        readonly closeParen: Token<Separator.RRound> | null) {
    super();
  }
}

export class AccessP extends Phrase {
  constructor(readonly modifiers: Token<Modifior>[],
        readonly accessToken: Token<Keyword.access>,
        readonly module: IdentifierP | null,
        readonly semi: Token<Separator.Semicolon> | null) {
    super();
  }
}

export class SemicolonP extends Phrase {
  constructor(readonly semicolon: Token<Separator.Semicolon>) {
    super();
  }
}

// e.g. (0,0){down} or {up}(0,0)
export class BraceAffixedExpressionPhrase extends Phrase {
  constructor(readonly modified: Phrase,
        readonly openBrace: Token<Separator.LCurly>,
        readonly affix: Phrase | null,
        readonly closeBrace: Token<Separator.RCurly> | null,
        readonly isSuffix: boolean) {
    super();
  }

  toString() {
    const a = this.affix?.toString() ?? "<BAD>";
    const m = this.modified?.toString() ?? "<BAD>";
    return this.isSuffix ? `${m}{${a}}` : `{${a}}${m}`;
  }
}

export class IndexExpressionPhrase extends Phrase {
  constructor(readonly indexee: Phrase,
        readonly openBracket: Token<Separator.LSquare> | null,
        readonly index: Phrase | null,
        readonly colonToken: Token<Operator.Colon> | null,
        readonly indexEnd: Phrase | null,  // for slices
        readonly closeBracket: Token<Separator.RSquare> | null) {
    super();
  }

  toString() {
    return this.indexee.toString() + "[" + (this.index?.toString() ?? "") + "]";
  }
}

export class TypeP extends Phrase {
  constructor (
    readonly ident: IdentifierP,
    public brackets: DimensionsP | null
  ) { super(); }

  toString() {
    return this.ident.toString() + (this.brackets?.toString() ?? "");
  }
}

export class CastP extends ExpressP {
  constructor(readonly lparen: Token<Separator.LRound>,
        readonly type: TypeP,
        readonly rparen: Token<Separator.RRound> | null,
        readonly expr: Phrase | null) {
    super();
  }

  toString() {
    return "(" + this.type.toString() + ") (" + (this.expr?.toString() + "") + ")"
  }
}

export class LambdaP extends ExpressP {
  constructor(readonly newToken: Token<Keyword.new>,
        readonly returnType: TypeP | null,
        readonly openParen: Token<Separator.LRound>,
        readonly decls: DeclareManyVariablesP[],
        readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
        readonly closeParen: Token<Separator.RRound> | null,
        readonly body: BlockP | null) {
    super();
  }
}

export class ArrayInitializerList extends Phrase {
  constructor(readonly openBrace: Token<Separator.LCurly>,
    readonly elements: Phrase[],
    readonly closeBrace: Token<Separator.RCurly> | null) {
    super();
  }
}

export class ArrayCreationPhrase extends Phrase {
  constructor (
    readonly newToken: Token<Keyword.new>,
    readonly elementType: TypeP,
    readonly args: Phrase[],
    readonly initializer: ArrayInitializerList | null
  ) { super(); }

  toString() {
    return `new ${this.elementType.toString()}`
         + this.args.map(arg => arg ? "[" + arg.toString() + "]" : "[]").join("")
         + (this.initializer?.toString() ?? "");
  }
}

export class BlockP extends Phrase {
  constructor (
    readonly openBrace: Token<Separator.LCurly> | null,
    readonly statements: Phrase[],
    readonly closeBrace: Token<Separator.RCurly> | null
  ) { super(); }
}

export class TernorP extends ExpressP {
  constructor (
    readonly condition: Phrase | null,
    readonly questionToken: Token<Operator.Question> | null,
    readonly whenTrue: Phrase | null,
    readonly colonToken: Token<Operator.Colon> | null,
    readonly whenFalse: Phrase | null
  ) { super(); }
}

export class TupleP extends ExpressP {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly exprs: (Phrase | null)[],
    readonly closeParen: Token<Separator.RRound> | null
  ) { super(); }

  toString() {
    return "(" + this.exprs.map(a => a?.toString() ?? "<BAD>").join(", ") + ")";
  }
}

export class SpreadP extends ExpressP {
  constructor (
    readonly ellipsis: Token<Separator.DotDotDot>,
    readonly spreadedExpr: CallArgsP | null
  ) { super(); }
}

export class LiteralP extends ExpressP {
  constructor (
    readonly token: Token<Literal>
  ) { super(); }

  toString(): string {
    switch (this.token.kind) {
      case Other.FloatLiteral: return (this.token.value! as number).toExponential();
      case Other.IntegerLiteral: return this.token.value + "";
      case Other.BooleanLiteral: return this.token.value + "";
      case Other.StringLiteral: return `"${this.token.value}"`;
      case Other.NullLiteral: return "null";
    }
    asyUnreachable();
  }
}

export class MemberAccessPhrase extends Phrase {
  constructor (
    readonly lhs: Phrase,
    readonly dotToken: Token<Separator.Dot>,
    readonly rhs: IdentifierP | null
  ) { super(); }

  toString(): string {
    return this.lhs.toString() + "." + (this.rhs?.toString() ?? "");
  }
}

export class RoundP extends ExpressP {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly expr: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
  ) { super(); }

  toString(): string {
    return "(" + (this.expr?.toString() ?? "<BAD>") + ")";
  }
}

export class AllP extends Phrase {
  constructor (
    readonly decls: Phrase[],
    private step: number = 0,
  ) { super(); }

  understandNext(): UnscaledSpell {
    return (this.step < this.decls.length)
    ? this.understand(this.decls[this.step++]) as UnscaledSpell
    : unspell;
  }

  understand(t: Phrase | null): unknown {
    if (t === null) return;
    if (t instanceof DeclareManyVariablesP) {
      return t.decls.map(x => this.understand(x));
    } else if (t instanceof DeclareImportP) {
      return console.log(t.importTarget);
    } else if (t instanceof DeclareOneVariableP) {
      return remember(t.name.getName(), t.initializer!);
    } else if (t instanceof StateExpressionP) {
      return this.understand(t.expr);
    } else if (t instanceof CallP) {
      return (this.understand(t.caller) as Function) (t.args.map(x => this.understand(x)));
    } else if (t instanceof UnorP) {
      return (lookup(t.operator)) (this.understand(t.operand));
    } else if (t instanceof BinorP) {
      return (lookup(t.operator)) (this.understand(t.left), this.understand(t.right));
    } else if (t instanceof CallArgsP) {
      return this.understand(t.expr);
    } else if (t instanceof TupleP) {
      // todo: make this type-safe
      return Pair.fromArray(t.exprs.map(x => this.understand(x)) as [number, number]);
    } else if (t instanceof IdentifierP) {
      return lookup(t.name);
    } else if (t instanceof LiteralP) {
      switch (t.token.kind) {
        case Other.FloatLiteral:
        case Other.IntegerLiteral:
          return t.token.value as number;
        case Other.StringLiteral:
          return t.token.value as string;
        case Other.BooleanLiteral:
          return t.token.value as boolean;
        default:
          weep();
      }
    } else {
      console.log(`wah im a ${t.constructor.name}`, t);
    }
    return;
  }
}