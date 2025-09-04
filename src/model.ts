import { asyUnreachable } from "./error";

import type { Binor, Unor, Assignor, Modifior, Literal } from "./tokens";
import { Keyword, Operator, Separator, Other } from "./tokens";

import type { Span } from "./tokens";
import { span, allspan, rightAfter } from "./tokens";

import type { Erroneous, Token, TokenType } from "./tokens";
import { Tokenboard, isGood, isKeyword, isOperator, isSeparator, isStringKeywordOrLiteral } from "./tokens";
import { tokenTypeToLength, tokenTypeToString } from "./tokens";

//import type {ScopeChainNode} from "./scope.ts";
import { loudly, maybeArray, meet, weep } from "./helper";
import { lookup, nameboard } from "./render";

const DEFAULT_SPAN = span(-1, -1);
/**
 * Base class for all trees in the CST.
 */
export class Phrase {

  constructor(
    public span: Span = DEFAULT_SPAN,
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

export class ImportDeclarationPhrase extends Phrase {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly importToken: Token<Keyword.import>,
    readonly importTarget: Token<Other.StringLiteral> | IdentifierPhrase | null,
    readonly asToken: Token<Other.Identifier> | null,
    readonly alias: IdentifierPhrase | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class StructDeclarationPhrase extends Phrase {
  constructor(readonly modifiers: Token<Modifior>[],
        readonly structToken: Token<Keyword.struct>,
        readonly name: IdentifierPhrase | null,
        readonly openBrace: Token<Separator.LCurly> | null,
        readonly body: Phrase[] | null,
        readonly closeBrace: Token<Separator.RCurly> | null) {
    super();
  }
}

export class VariableDeclarationPhrase extends Phrase {
  constructor(readonly name: IdentifierPhrase,
        readonly brackets: BracketsPhrase | null,
        readonly openParen: Token<Separator.LRound> | null,
        readonly args: VariableDeclarationListPhrase[] | null,
        readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
        readonly closeParen: Token<Separator.RRound> | null,
        readonly equalsToken: Token<Operator.Eq> | null,
        readonly initializer: Phrase | null) {
    super();
  }

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

export class TypedefPhrase extends Phrase {
  constructor(
    readonly typedefToken: Token<Keyword.typedef>,
    readonly asDecl: VariableDeclarationListPhrase | FunctionDeclarationPhrase | null
  ) {
    super();
  }
}

export class FunctionDeclarationPhrase extends Phrase {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly returnType: Phrase | null,
    readonly isOperator: Token<Keyword.operator> | null,
    readonly name: Token<Operator | Other.Identifier> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly params: VariableDeclarationListPhrase[],  // each will only have one parameter, generally
    readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly body: BlockPhrase | Phrase | Token<Separator.Semicolon> | null
  ) { super(); }
}

export class VariableDeclarationListPhrase extends Phrase {
  constructor (
    readonly modifiers: Token<Modifior>[],
    readonly type: TypePhrase | null,
    readonly decls: VariableDeclarationPhrase[],
    public semicolonToken: Token<Separator.Semicolon> | null
  ) { super(); }

  toString() {
    return [...this.modifiers,
            ...maybeArray(this.type?.toString()),
            ...maybeArray(this.decls.map(a => a.toString()).join(", "))
           ].join(' ');
  }
}


export class IfStatementPhrase extends Phrase {
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

export class EnhancedForLoopPhrase extends Phrase {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly elemType: TypePhrase | null,
    readonly varName: IdentifierPhrase,
    readonly colon: Token<Operator.Colon> | null,
    readonly iterated: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

export class ForLoopPhrase extends Phrase {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly forInit: Phrase[] | VariableDeclarationListPhrase | null,
    readonly sep1: Token<Separator.Semicolon> | null,
    readonly forCond: Phrase | null,
    readonly sep2: Token<Separator.Semicolon> | null,
    readonly forUpdate: Phrase[] | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

abstract class WhilePhraseLike extends Phrase {
  constructor (
    readonly whileToken: Token<Keyword.while> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

export class WhilePhrase extends WhilePhraseLike {
  declare whileToken: Token<Keyword.while>;
}

// todo: redundancy
export class DowhilePhrase extends WhilePhraseLike {
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

export class BreakStatementPhrase extends Phrase {
  constructor (
    readonly breakToken: Token<Keyword.break>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class ContinueStatementPhrase extends Phrase {
  constructor (
    readonly continueToken: Token<Keyword.continue>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class ReturnStatementPhrase extends Phrase {
  constructor (
    readonly returnToken: Token<Keyword.return>,
    readonly returnExpr: Phrase | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class BracketsPhrase extends Phrase {
  constructor(readonly brackets: Token<Separator.LSquare | Separator.RSquare>[]) {
    super();
  }

  dims() {
    let c = 0;
    for (const b of this.brackets) {
      c += +(b.kind === Separator.LSquare)
    }
    return c;
  }

  toString() {
    return "[]".repeat(this.dims());
  }
}

export class IdentifierPhrase extends Phrase {
  constructor(readonly name: Token<Other.Identifier>) {
    super();
  }

  getName() {
    return this.name.value;
  }

  toString() {
    return this.name.value;
  }
}

export class ExpressionStatementPhrase extends Phrase {
  constructor (
    readonly expr: Phrase | null,
    readonly semicolonToken: Token<Separator.Semicolon> | null
  ) { super(); }
}

export class BinorPhrase extends Phrase {
  constructor(readonly left: Phrase | null,
        readonly operator: Token<Binor> | null,
        readonly right: Phrase | null,
        readonly isImplicitMultiplication = false) {
    super();
  }

  toString() {
    return "(" + (this.left?.toString() ?? "") + tokenTypeToString(this.operator?.kind || Operator.Star) + (this.right?.toString() ?? "") + ")";
  }
}

export class UnaryOperatorPhrase extends Phrase {
  constructor(readonly operator: Token<Unor>,
        readonly operand: Phrase | null,
        readonly prefix: boolean) {
    super();
  }

  toString() {
    const s = this.operand?.toString() ?? "";
    const prefix = this.prefix;
    return "(" + (prefix ? "" : s) + tokenTypeToString(this.operator.kind) + (prefix ? s : "") + ")";
  }
}

// e.g. "operator --"
export class OperatorReferencePhrase extends Phrase {
  constructor(readonly operatorToken: Token<Keyword.operator>,
        readonly op: Token<Operator> | Token<Other.Identifier> | null) {
    super();
  }
}

export class AssignmentExpressionPhrase extends Phrase {
  constructor(readonly left: Phrase | null,
        readonly equalsToken: Token<Assignor>,
        readonly right: Phrase | null) {
    super();
  }

  toString() {
    return (this.left?.toString() ?? "") + " " + tokenTypeToString(this.equalsToken.kind) + " " + (this.right?.toString() ?? "");
  }
}

export class CallArgsPhrase extends Phrase {
  constructor(readonly argIsSpread: Token<Separator.DotDotDot> | null,
        readonly namedParameter: IdentifierPhrase | null,
        readonly equalsToken: Token<Operator.Eq> | null,
        readonly expr: Phrase | null) {
    super();
  }
}

export class CallPhrase extends Phrase {
  constructor(readonly caller: Phrase,
        readonly openParen: Token<Separator.LRound>,
        readonly args: CallArgsPhrase[],
        readonly closeParen: Token<Separator.RRound> | null) {
    super();
  }
}

export class AccessPhrase extends Phrase {
  constructor(readonly modifiers: Token<Modifior>[],
        readonly accessToken: Token<Keyword.access>,
        readonly module: IdentifierPhrase | null,
        readonly semi: Token<Separator.Semicolon> | null) {
    super();
  }
}

export class NakedSemicolonPhrase extends Phrase {
  constructor(readonly semi: Token<Separator.Semicolon>) {
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

export class TypePhrase extends Phrase {
  constructor(readonly ident: IdentifierPhrase, public brackets: BracketsPhrase | null) {
    super();
  }

  toString() {
    return this.ident.toString() + (this.brackets?.toString() ?? "");
  }
}

export class CastExpressionPhrase extends Phrase {
  constructor(readonly lparen: Token<Separator.LRound>,
        readonly type: TypePhrase,
        readonly rparen: Token<Separator.RRound> | null,
        readonly expr: Phrase | null) {
    super();
  }

  toString() {
    return "(" + this.type.toString() + ") (" + (this.expr?.toString() + "") + ")"
  }
}

export class AnonymousFunctionExpressionPhrase extends Phrase {
  constructor(readonly newToken: Token<Keyword.new>,
        readonly returnType: TypePhrase | null,
        readonly openParen: Token<Separator.LRound>,
        readonly decls: VariableDeclarationListPhrase[],
        readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
        readonly closeParen: Token<Separator.RRound> | null,
        readonly body: BlockPhrase | null) {
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
    readonly elementType: TypePhrase,
    readonly args: Phrase[],
    readonly initializer: ArrayInitializerList | null
  ) { super(); }

  toString() {
    return `new ${this.elementType.toString()}`
         + this.args.map(arg => arg ? "[" + arg.toString() + "]" : "[]").join("")
         + (this.initializer?.toString() ?? "");
  }
}

export class BlockPhrase extends Phrase {
  constructor (
    readonly openBrace: Token<Separator.LCurly> | null,
    readonly statements: Phrase[],
    readonly closeBrace: Token<Separator.RCurly> | null
  ) { super(); }
}

export class TernorPhrase extends Phrase {
  constructor (
    readonly condition: Phrase | null,
    readonly questionToken: Token<Operator.Question> | null,
    readonly whenTrue: Phrase | null,
    readonly colonToken: Token<Operator.Colon> | null,
    readonly whenFalse: Phrase | null
  ) { super(); }
}

export class TupleExpressionPhrase extends Phrase {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly exprs: (Phrase | null)[],
    readonly closeParen: Token<Separator.RRound> | null
  ) { super(); }

  toString() {
    return "(" + this.exprs.map(a => a?.toString() ?? "<BAD>").join(", ") + ")";
  }
}

export class SpreadExpressionPhrase extends Phrase {
  constructor (
    readonly ellipsis: Token<Separator.DotDotDot>,
    readonly spreadedExpr: CallArgsPhrase | null
  ) { super(); }
}

export class LiteralPhrase extends Phrase {
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
    readonly rhs: IdentifierPhrase | null
  ) { super(); }

  toString(): string {
    return this.lhs.toString() + "." + (this.rhs?.toString() ?? "");
  }
}

export class ParenthesizedExpressionPhrase extends Phrase {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly expr: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
  ) { super(); }

  toString(): string {
    return "(" + (this.expr?.toString() ?? "<BAD>") + ")";
  }
}

export class CompilationUnitPhrase extends Phrase {
  constructor (
    readonly decls: Phrase[],
    private step: number = 0,
  ) { super(); }

  understandNext() {
    if (this.step >= this.decls.length) return;
    return this.understand(this.decls[this.step++]);
  }

  understand(t: Phrase | null): unknown {
    if (t === null) return;
    if (t instanceof ExpressionStatementPhrase) {
      return this.understand(t.expr);
    } else if (t instanceof CallPhrase) {
      return (this.understand(t.caller) as Function) (t.args.map(x => this.understand(x)));
    } else if (t instanceof BinorPhrase) {
      return (lookup(t.operator)) (this.understand(t.left), this.understand(t.right));
    } else if (t instanceof CallArgsPhrase) {
      return this.understand(t.expr);
    } else if (t instanceof IdentifierPhrase) {
      return lookup(t.name);
    } else if (t instanceof LiteralPhrase) {
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