import { asyAssert, asyUnreachable, same } from "./helper";

import type { Binor, Unor, Assignor, Modifactor, Literal } from "./tokens";
import { Keyword, Operator, Separator, Other, DEFSPAN } from "./tokens";

import type { Span } from "./tokens";
import { span } from "./tokens";

import type { Token } from "./tokens";
import { tokenTypeToString } from "./tokens";

import { aside, Maybe, maybeArray, weep, Knowledge, unspell, loudly, isBoolean } from "./helper";
import { lookup, remember } from "./render";
import { Pair } from "./number";
import merx from "./merx";

export class Phrase {

  constructor (
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
    asyAssert(-1 < this.span.start && this.span.start < this.span.end,
      [`[${this.span.start}, ${this.span.end}]`, "is a good span."]);
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

export abstract class DeclarationP extends Phrase {}
export abstract class StatementP extends Phrase {}
export abstract class OperatorP extends Phrase {}
export abstract class ExpressionP extends Phrase {}

export class ImportDeclarationP extends DeclarationP {
  constructor (
    readonly modifiers: Token<Modifactor>[],
    readonly importToken: Token<Keyword.import>,
    readonly importTarget: Maybe<Token<Other.StringLiteral> | IdentifierP>,
    readonly asToken: Maybe<Token<Other.Identifier>>,
    readonly alias: Maybe<IdentifierP>,
    readonly semicolon: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }
}

// todo
export class StructDeclarationP extends DeclarationP {
  constructor (
    readonly modifiers: Token<Modifactor>[],
    readonly structToken: Token<Keyword.struct>,
    readonly name: Maybe<IdentifierP>,
    readonly openBrace: Maybe<Token<Separator.LCurly>>,
    readonly body: Maybe<Phrase[]>,
    readonly closeBrace: Maybe<Token<Separator.RCurly>>,
  ) { super(); }
}

// todo
export class FunctionDeclarationP extends DeclarationP {
  constructor (
    readonly modifiers: Token<Modifactor>[],
    readonly returnType: Maybe<Phrase>,
    readonly isOperator: Maybe<Token<Keyword.operator>>,
    readonly name: Maybe<Token<Operator | Other.Identifier>>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly params: ManyVariablesDeclarationP[],  // each will only have one parameter, generally
    readonly lastParamIsRest: Maybe<Token<Separator.DotDotDot>>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly body: Maybe<BlockStatementP | Phrase | Token<Separator.Semicolon>>,
  ) { super(); }
}

export class OneVariableDeclarationP extends DeclarationP {
  constructor (
    readonly name: IdentifierP,
    readonly brackets: Maybe<DimensionsP>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly args: Maybe<ManyVariablesDeclarationP[]>,
    readonly lastParamIsRest: Maybe<Token<Separator.DotDotDot>>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly equalsToken: Maybe<Token<Operator.Eq>>,
    readonly initializer: Maybe<Phrase>,
  ) { super(); }

  // todo: beautification
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

export class ManyVariablesDeclarationP extends DeclarationP {
  constructor (
    readonly modifiers: Token<Modifactor>[],
    readonly type: Maybe<TypeP>,
    readonly decls: OneVariableDeclarationP[],
    public semicolonToken: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }

  toString() {
    return [...this.modifiers,
            ...maybeArray(this.type?.toString()),
            ...maybeArray(this.decls.map(a => a.toString()).join(", "))
           ].join(' ');
  }
}

// todo
export class TypedefDeclarationP extends DeclarationP {
  constructor (
    readonly typedefToken: Token<Keyword.typedef>,
    readonly asDecl: Maybe<ManyVariablesDeclarationP | FunctionDeclarationP>,
  ) { super(); }
}

export class SemicolonStatementP extends StatementP {
  constructor (
    readonly semicolon: Token<Separator.Semicolon>
  ) { super(); }
}

export class BlockStatementP extends StatementP {
  constructor (
    readonly openBrace: Maybe<Token<Separator.LCurly>>,
    readonly statements: Phrase[],
    readonly closeBrace: Maybe<Token<Separator.RCurly>>,
  ) { super(); }
}

export class IfStatementP extends StatementP {
  constructor (
    readonly ifToken: Token<Keyword.if>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly condition: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly thenStatement: Maybe<Phrase>,
    readonly elseToken: Maybe<Token<Keyword.else>>,
    readonly elseStatement: Maybe<Phrase>,
  ) { super(); }
}

// todo
export class ForeachP extends StatementP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly elemType: Maybe<TypeP>,
    readonly varName: IdentifierP,
    readonly colon: Maybe<Token<Operator.Colon>>,
    readonly iterated: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly statement: Phrase | null
  ) { super(); }
}

// todo
export class ForStatementP extends StatementP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly forInit: Phrase[] | ManyVariablesDeclarationP | null,
    readonly sep1: Token<Separator.Semicolon> | null,
    readonly forCond: Phrase | null,
    readonly sep2: Token<Separator.Semicolon> | null,
    readonly forUpdate: Phrase[] | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

// todo
export class WhileP extends StatementP {
  constructor (
    readonly whileToken: Token<Keyword.while>,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly statement: Phrase | null
  ) { super(); }
}

// todo: redundancy
export class DowhileP extends StatementP {
  constructor (
    readonly doToken: Token<Keyword.do>,
    readonly statement: Phrase | null,
    readonly whileToken: Token<Keyword.while> | null,
    readonly openParen: Token<Separator.LRound> | null,
    readonly condition: Phrase | null,
    readonly closeParen: Token<Separator.RRound> | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

// todo
export class BreakP extends StatementP {
  constructor (
    readonly breakToken: Token<Keyword.break>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

// todo
export class ContinueP extends StatementP {
  constructor (
    readonly continueToken: Token<Keyword.continue>,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

// todo
export class ReturnP extends StatementP {
  constructor (
    readonly returnToken: Token<Keyword.return>,
    readonly returnExpr: Phrase | null,
    readonly semicolon: Token<Separator.Semicolon> | null
  ) { super(); }
}

// todo
export class DimensionsP extends ExpressionP {
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

export class IdentifierP extends ExpressionP {
  constructor (
    readonly name: Token<Other.Identifier>
  ) { super(); }

  getName(): string {
    return this.name.value!;
  }

  toString(): string {
    return this.getName();
  }
}

export class ExpressionStatementP extends StatementP {
  constructor (
    readonly expression: Maybe<Phrase>,
    readonly semicolonToken: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }
}

export class BinorP extends OperatorP {
  constructor (
    readonly left: Maybe<Phrase>,
    readonly operator: Maybe<Token<Binor>>,
    readonly right: Maybe<Phrase>,
    readonly isImplicitMultiplication = false
  ) { super(); }

  toString() {
    return "(" + (this.left?.toString() ?? "") + tokenTypeToString(this.operator?.kind || Operator.Star) + (this.right?.toString() ?? "") + ")";
  }
}

export class UnorP extends OperatorP {
  constructor (
    readonly operator: Token<Unor>,
    readonly operand: Maybe<Phrase>,
    readonly isPrefixal: boolean
  ) { super(); }

  toString() {
    return "(" + ((lf) => lf([this.operand?.toString() ?? "", tokenTypeToString(this.operator.kind)]).join(''))((x: any[]) => this.isPrefixal ? x.reverse(): x) + ")";
  }
}

// e.g. "operator --"
// todo
export class OperatorizerP extends Phrase {
  constructor (
    readonly operatorToken: Token<Keyword.operator>,
    readonly op: Maybe<Token<Operator> | Token<Other.Identifier>>,
  ) { super(); }
}

export class AssignmentExpressionP extends ExpressionP {
  constructor (
    readonly left: Maybe<Phrase>,
    readonly equalsToken: Token<Assignor>,
    readonly right: Maybe<Phrase>,
  ) { super(); }

  toString() {
    return (this.left?.toString() ?? "") + " " + tokenTypeToString(this.equalsToken.kind) + " " + (this.right?.toString() ?? "");
  }
}

export class CallArgsP extends ExpressionP {
  constructor (
    readonly argIsSpread: Maybe<Token<Separator.DotDotDot>>,
    readonly namedParameter: Maybe<IdentifierP>,
    readonly equalsToken: Maybe<Token<Operator.Eq>>,
    readonly expr: Maybe<Phrase>,
  ) { super(); }
}

export class CallP extends ExpressionP {
  constructor (
    readonly caller: Phrase,
    readonly openParen: Token<Separator.LRound>,
    readonly args: CallArgsP[],
    readonly closeParen: Maybe<Token<Separator.RRound>>,
  ) { super(); }
}

// todo
export class AccessP extends DeclarationP {
  constructor(readonly modifiers: Token<Modifactor>[],
        readonly accessToken: Token<Keyword.access>,
        readonly module: IdentifierP | null,
        readonly semi: Token<Separator.Semicolon> | null) {
    super();
  }
}

// e.g. (0,0){down} or {up}(0,0)
// todo
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

// todo
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

// todo
export class TypeP extends Phrase {
  constructor (
    readonly ident: IdentifierP,
    public brackets: DimensionsP | null
  ) { super(); }

  toString() {
    return this.ident.toString() + (this.brackets?.toString() ?? "");
  }
}

// todo
export class CastP extends ExpressionP {
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

// todo
export class LambdaP extends ExpressionP {
  constructor(readonly newToken: Token<Keyword.new>,
        readonly returnType: TypeP | null,
        readonly openParen: Token<Separator.LRound>,
        readonly decls: ManyVariablesDeclarationP[],
        readonly lastParamIsRest: Token<Separator.DotDotDot> | null,
        readonly closeParen: Token<Separator.RRound> | null,
        readonly body: BlockStatementP | null) {
    super();
  }
}

// todo
export class ArrayInitializerList extends Phrase {
  constructor(readonly openBrace: Token<Separator.LCurly>,
    readonly elements: Phrase[],
    readonly closeBrace: Token<Separator.RCurly> | null) {
    super();
  }
}

// todo
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

// todo
export class TernorP extends ExpressionP {
  constructor (
    readonly condition: Phrase | null,
    readonly questionToken: Token<Operator.Question> | null,
    readonly whenTrue: Phrase | null,
    readonly colonToken: Token<Operator.Colon> | null,
    readonly whenFalse: Phrase | null
  ) { super(); }
}

// todo
export class TupleP extends ExpressionP {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly exprs: (Phrase | null)[],
    readonly closeParen: Token<Separator.RRound> | null
  ) { super(); }

  toString() {
    return "(" + this.exprs.map(a => a?.toString() ?? "<BAD>").join(", ") + ")";
  }
}

// todo
export class SpreadP extends ExpressionP {
  constructor (
    readonly ellipsis: Token<Separator.DotDotDot>,
    readonly spreadedExpr: CallArgsP | null
  ) { super(); }
}

export class LiteralP extends ExpressionP {
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

// todo
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

// todo
export class RoundP extends ExpressionP {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly expr: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
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

  async understandAll(): Promise<Knowledge[]> {
    return await Promise.all(this.decls.map(async _ => await this.understandNext()));
  }

  async understandNext(): Promise<Knowledge> {
    return (this.step < this.decls.length)
    ? await this.understand(this.decls[this.step++]) as Knowledge
    : unspell;
  }

  understand(t: Maybe<Phrase>): unknown {
    aside(["It's time to understand", t]);
    if (t === null) {
      return;


    } else if (t instanceof DeclarationP) {
      if (t instanceof ManyVariablesDeclarationP) {
        return t.decls.map(x => this.understand(x));
      } else if (t instanceof ImportDeclarationP) {
        if (t.importTarget instanceof IdentifierP) {
          aside(["Time to import stuff", t]);
          return merx(t.importTarget.getName());
        } else {
          return merx(t.importTarget?.value ?? "");
        }
      } else if (t instanceof OneVariableDeclarationP) {
        return ((lname, lvalue) => {
          aside(`Initializing ${lname} as ${lvalue}.`);
          return remember(lname, lvalue);
        }) (t.name.getName(), this.understand(t.initializer));
      } else {
        console.log(`wah im a declare ${t.constructor.name}`, t);
      }


    } else if (t instanceof StatementP) {
      if (t instanceof ExpressionStatementP) {
        return this.understand(t.expression);
      } else if (t instanceof BlockStatementP) {
        return t.statements.map(x => this.understand(x));
      } else if (t instanceof SemicolonStatementP) {
        return;
      } else if (t instanceof IfStatementP) {
        return ((lif, lthen, lelse) => {
          asyAssert(isBoolean(lif)); // todo: think about how to make this kind of castblocking more robust?
          return lif ? lthen : lelse;
      }) (this.understand(t.condition), this.understand(t.thenStatement), this.understand(t.elseStatement));
      } else {
        console.log(`wah im a statement ${t.constructor.name}`, t);
      }


    } else if (t instanceof OperatorP) {
      if (t instanceof UnorP) {
        return (lookup(t.operator)) (this.understand(t.operand));
      } else if (t instanceof BinorP) {
        return (lookup(t.operator)) (this.understand(t.left), this.understand(t.right));
      } else {
        console.log(`wah im an operator ${t.constructor.name}`, t);
      }


    } else if (t instanceof ExpressionP) {
      if (t instanceof AssignmentExpressionP) {
        return ((lname, lvalue) => {
          asyAssert(lname instanceof IdentifierP);
          aside(`Assigning ${lvalue} to ${lname}.`);
          return remember(lname.getName(), lvalue);
        }) (t.left, this.understand(t.right));
      } else if (t instanceof CallP) {
        return ((lcall, largs) => {
          aside([`Calling ${t.caller} on`, largs, "."]);
          return (lcall as Function) (largs);
        }) (this.understand(t.caller), t.args.map(x => this.understand(x)));
      } else if (t instanceof RoundP) {
        return this.understand(t.expr);
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
          case Other.IntegerLiteral: return t.token.value as number;
          case Other.StringLiteral: return t.token.value as string;
          case Other.BooleanLiteral: return t.token.value as boolean;
          default: weep();
        }
      } else {
        console.log(`wah im an expression ${t.constructor.name}`, t);
      }
    } else {
      console.log(`wah im a nothing ${t.constructor.name}`, t);
    }
    return;
  }
}