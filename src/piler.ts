import { assert, hurriedly, LOUDNESS, shed, Twain, } from "./helper";

import type { Binor, Unor, Assignor, Modifactor, Literal } from "./tokens";
import { Keyword, Operator, Separator, Other, DEFSPAN } from "./tokens";

import type { Span } from "./tokens";
import { span } from "./tokens";

import type { Token } from "./tokens";
import { tokenTypeToString } from "./tokens";

import { Maybe, maybeArray, Knowledge, unknowledge, loudly } from "./helper";
import { lookup } from "./render";
import merx from "./merx";
import { Yoke } from "./bake";
import { bless, unload } from "./yeast";
import { Bakework } from "./yeast";
import { pair } from "./rime";
import { setCake, wendCake } from "./corned";

export class Phrase {

  constructor (
    public span: Span = DEFSPAN,
    public flags: number = 0,
//    public scope: ScopeChainNode | null = null,
    public docComment: Maybe<Comment> = null,
  ) {}

  // Mark this tree as having the following doc comment
  attachDocComment(docComment: Maybe<Comment>): Phrase {
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
    assert(-1 < this.span.start && this.span.start < this.span.end,
      `[${this.span.start}, ${this.span.end}] is a good span.`, LOUDNESS.Spanner);
  }

  /**
   * Given a cursor position, find the path of trees and tokens taking us to that cursor position.
   */
  findChainAtPosition(pos: number): Maybe<(Phrase | Token<any>)[]> {
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
export class AccessP extends DeclarationP {
  constructor (
    readonly modifiers: Token<Modifactor>[],
    readonly accessToken: Token<Keyword.access>,
    readonly module: Maybe<IdentifierP>,
    readonly semi: Maybe<Token<Separator.Semicolon>>,
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

export class OneVariableDeclarationP extends ExpressionP {
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
export class ForeachStatementP extends StatementP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly elemType: Maybe<TypeP>,
    readonly varName: IdentifierP,
    readonly colon: Maybe<Token<Operator.Colon>>,
    readonly iterated: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly statement: Maybe<Phrase>,
  ) { super(); }
}

export class ForStatementP extends StatementP {
  constructor (
    readonly forToken: Token<Keyword.for>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly forInit: Maybe<Phrase[] | ManyVariablesDeclarationP>,
    readonly sep1: Maybe<Token<Separator.Semicolon>>,
    readonly forCond: Maybe<Phrase>,
    readonly sep2: Maybe<Token<Separator.Semicolon>>,
    readonly forUpdate: Maybe<Phrase[]>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly statement: Maybe<Phrase>,
  ) { super(); }
}

export class WhileStatementP extends StatementP {
  constructor (
    readonly whileToken: Token<Keyword.while>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly condition: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly statement: Maybe<Phrase>,
  ) { super(); }
}

export class DowhileStatementP extends StatementP {
  constructor (
    readonly doToken: Token<Keyword.do>,
    readonly statement: Maybe<Phrase>,
    readonly whileToken: Maybe<Token<Keyword.while>>,
    readonly openParen: Maybe<Token<Separator.LRound>>,
    readonly condition: Maybe<Phrase>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly semicolon: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }
}

// todo
export class BreakP extends StatementP {
  constructor (
    readonly breakToken: Token<Keyword.break>,
    readonly semicolon: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }
}

// todo
export class ContinueP extends StatementP {
  constructor (
    readonly continueToken: Token<Keyword.continue>,
    readonly semicolon: Maybe<Token<Separator.Semicolon>>,
  ) { super(); }
}

// todo
export class ReturnP extends StatementP {
  constructor (
    readonly returnToken: Token<Keyword.return>,
    readonly returnExpr: Maybe<Phrase>,
    readonly semicolon: Maybe<Token<Separator.Semicolon>>,
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

// e.g. (0,0){down} or {up}(0,0)
// todo
export class BraceAffixedExpressionPhrase extends Phrase {
  constructor (
    readonly modified: Phrase,
    readonly openBrace: Token<Separator.LCurly>,
    readonly affix: Maybe<Phrase>,
    readonly closeBrace: Maybe<Token<Separator.RCurly>>,
    readonly isSuffix: boolean,
  ) { super(); }

  toString() {
    const a = this.affix?.toString() ?? "<BAD>";
    const m = this.modified?.toString() ?? "<BAD>";
    return this.isSuffix ? `${m}{${a}}` : `{${a}}${m}`;
  }
}

// todo
export class IndexExpressionPhrase extends Phrase {
  constructor (
    readonly indexee: Phrase,
    readonly openBracket: Maybe<Token<Separator.LSquare>>,
    readonly index: Maybe<Phrase>,
    readonly colonToken: Maybe<Token<Operator.Colon>>,
    readonly indexEnd: Maybe<Phrase>,  // for slices
    readonly closeBracket: Maybe<Token<Separator.RSquare>>,
  ) { super(); }

  toString() {
    return this.indexee.toString() + "[" + (this.index?.toString() ?? "") + "]";
  }
}

// todo
export class TypeP extends ExpressionP {
  constructor (
    readonly ident: IdentifierP,
    public brackets: Maybe<DimensionsP>,
  ) { super(); }

  toString() {
    return this.ident.toString() + (this.brackets?.toString() ?? "");
  }
}

// todo
export class CastP extends ExpressionP {
  constructor (
    readonly lparen: Token<Separator.LRound>,
    readonly type: TypeP,
    readonly rparen: Maybe<Token<Separator.RRound>>,
    readonly expr: Maybe<Phrase>,
  ) { super(); }

  toString() {
    return "(" + this.type.toString() + ") (" + (this.expr?.toString() + "") + ")"
  }
}

// todo
export class LambdaP extends ExpressionP {
  constructor (
    readonly newToken: Token<Keyword.new>,
    readonly returnType: Maybe<TypeP>,
    readonly openParen: Token<Separator.LRound>,
    readonly decls: ManyVariablesDeclarationP[],
    readonly lastParamIsRest: Maybe<Token<Separator.DotDotDot>>,
    readonly closeParen: Maybe<Token<Separator.RRound>>,
    readonly body: Maybe<BlockStatementP>
  ) { super(); }
}

// todo
export class ArrayInitializerList extends Phrase {
  constructor (readonly openBrace: Token<Separator.LCurly>,
    readonly elements: Phrase[],
    readonly closeBrace: Maybe<Token<Separator.RCurly>>
  ) { super(); }
}

// todo
export class ArrayCreationPhrase extends Phrase {
  constructor (
    readonly newToken: Token<Keyword.new>,
    readonly elementType: TypeP,
    readonly args: Phrase[],
    readonly initializer: Maybe<ArrayInitializerList>,
  ) { super(); }

  toString() {
    return `new ${this.elementType.toString()}`
         + this.args.map(arg => arg ? "[" + arg.toString() + "]" : "[]").join("")
         + (this.initializer?.toString() ?? "");
  }
}

export class TernorP extends ExpressionP {
  constructor (
    readonly condition: Maybe<Phrase>,
    readonly questionToken: Maybe<Token<Operator.Question>>,
    readonly whenTrue: Maybe<Phrase>,
    readonly colonToken: Maybe<Token<Operator.Colon>>,
    readonly whenFalse: Maybe<Phrase>,
  ) { super(); }
}

export class TupleP extends ExpressionP {
  constructor (
    readonly openParen: Token<Separator.LRound>,
    readonly exprs: Maybe<Phrase>[],
    readonly closeParen: Maybe<Token<Separator.RRound>>,
  ) { super(); }

  toString() {
    return "(" + this.exprs.map(a => a?.toString() ?? "<BAD>").join(", ") + ")";
  }
}

// todo
export class SpreadP extends ExpressionP {
  constructor (
    readonly ellipsis: Token<Separator.DotDotDot>,
    readonly spreadedExpr: Maybe<CallArgsP>,
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
      case Other.NullLiteral:
      default: return "null";
    }
  }
}

// todo
export class MemberAccessPhrase extends Phrase {
  constructor (
    readonly lhs: Phrase,
    readonly dotToken: Token<Separator.Dot>,
    readonly rhs: Maybe<IdentifierP>,
  ) { super(); }

  toString(): string {
    return this.lhs.toString() + "." + (this.rhs?.toString() ?? "");
  }
}

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

  understandAll(): Knowledge[] {
    return this.decls.map(_ => this.understandNext());
  }

  understandNext(): Knowledge {
    return (this.step < this.decls.length)
    ? this.understand(this.decls[this.step++]) as Knowledge
    : unknowledge;
  }

  understand(xp: Maybe<Phrase>): unknown {
//    loudly(["It's time to understand", t]);
    if (xp === null) {
      return;


    } else if (xp instanceof DeclarationP) {
      if (xp instanceof ManyVariablesDeclarationP) {
        //todo: this
//        return t.decls.map(x => (this.understand(t.type) as Functionlike<unknown>)(this.understand(x)));
        return xp.decls.map(x => this.understand(x));
      } else if (xp instanceof ImportDeclarationP) {
        if (xp.importTarget instanceof IdentifierP) {
          loudly(["Time to import stuff", xp]);
          // todo: async this
          return merx(xp.importTarget.getName());
        } else {
          return merx(xp.importTarget?.value ?? "");
        }
      } else {
        throw new Error(`wah im a bad declaration ${xp.constructor.name}`);
      }


    } else if (xp instanceof StatementP) {
      if (xp instanceof ExpressionStatementP) {
        return this.understand(xp.expression);
      } else if (xp instanceof BlockStatementP) {
        return xp.statements.map(x => this.understand(x));
      } else if (xp instanceof SemicolonStatementP) {
        return;
      } else if (xp instanceof IfStatementP) {
        return this.understand(this.understand(xp.condition)
          ? xp.thenStatement
          : xp.elseStatement);
      } else if (xp instanceof DowhileStatementP) {
        return ((ks: Knowledge[]) => {
          ks.push(this.understand(xp.statement) as Knowledge);
          hurriedly (100) (() => this.understand(xp.condition) as boolean, () => {
            ks.push(this.understand(xp.statement) as Knowledge);
          });
          return ks;
        }) ([]);
      } else if (xp instanceof WhileStatementP) {
        return ((ks: Knowledge[]) => {
          hurriedly (100) (() => this.understand(xp.condition) as boolean, () => {
            ks.push(this.understand(xp.statement) as Knowledge);
          });
          return ks;
        }) ([]);
      } else if (xp instanceof ForStatementP) {

        if (xp.forInit instanceof ManyVariablesDeclarationP) {
          this.understand(xp.forInit);
        } else if (Array.isArray(xp.forInit)) {
          xp.forInit.map(x => this.understand(x));
        } else {
          throw new Error("bad for init :(");
        }

        return ((ks: Knowledge[]) => {
          hurriedly (100) (() => this.understand(xp.forCond) as boolean, () => {
            ks.push(this.understand(xp.statement) as Knowledge);
            (xp.forUpdate ?? []).map(x => this.understand(x));
          });
          return ks;
        }) ([]);
      } else {
        throw new Error(`wah im a bad statement ${xp.constructor.name}`);
      }


    } else if (xp instanceof OperatorP) {
      if (xp instanceof UnorP) {
        assert(xp.operand !== null);
        switch (xp.operator.kind) {
          case Operator.PlusPlus:
            assert(xp.operand instanceof IdentifierP);
            return wendCake(xp.operand.getName(), x => x+1);
          case Operator.MinusMinus:
            assert(xp.operand instanceof IdentifierP);
            return wendCake(xp.operand.getName(), x => x-1);
          default:
            return unload(lookup(xp.operator) as Bakework[], [this.understand(xp.operand)]);
        }
      } else if (xp instanceof BinorP) {
        return unload(lookup(xp.operator!) as Bakework[], [this.understand(xp.left), this.understand(xp.right)]);
      } else {
        throw new Error(`wah im a bad operator ${xp.constructor.name}`);
      }


    } else if (xp instanceof ExpressionP) {
      if (xp instanceof AssignmentExpressionP) {
        return ((lname, lvalue) => {
          assert(lname instanceof IdentifierP);
          loudly(`Assigning ${lvalue} to ${lname} with ${Operator[xp.equalsToken.kind]}.`);
          switch (xp.equalsToken.kind) {
            // todo: strings are also somewhat rimelike
            case Operator.Eq: return setCake(lname.getName(), lvalue);
            case Operator.PlusEq: return wendCake(lname.getName(), x => x + lvalue);
            case Operator.MinusEq: return wendCake(lname.getName(), x => x - lvalue);
            case Operator.StarEq: return wendCake(lname.getName(), x => x * lvalue);
            case Operator.SlashEq: return wendCake(lname.getName(), x => x / lvalue);
//            case Operator.HashEq: "#=",
//            case Operator.PercentEq: "%=",
//            case Operator.CaretEq: "^=",
            default: throw new Error(`wah idk what this is: ${xp.equalsToken.kind}`);
          }
        }) (xp.left, this.understand(xp.right) as number);
      } else if (xp instanceof OneVariableDeclarationP) {
        return ((lname, lvalue) => {
          loudly(`Initializing ${lname} as ${lvalue}.`);
          return setCake(lname, lvalue);
        }) (xp.name.getName(), this.understand(xp.initializer));
      } else if (xp instanceof CallP) {
        return ((lcalls, largs) => {
          loudly([`Calling ${xp.caller} on`, largs, "."]);
          return unload(lcalls as Bakework[], largs);
        }) (this.understand(xp.caller), xp.args.map(x => this.understand(x)));
      } else if (xp instanceof TernorP) {
        return this.understand(this.understand(xp.condition) ? xp.whenTrue : xp.whenFalse);
      } else if (xp instanceof TypeP) {
        return (thing: unknown) => bless(thing, xp.ident.getName() as Yoke);
      } else if (xp instanceof RoundP) {
        return this.understand(xp.expr);
      } else if (xp instanceof CallArgsP) {
        return this.understand(xp.expr);
      } else if (xp instanceof TupleP) {
        assert(xp.exprs.length === 2);
        return (([x, y]) => pair(x, y))(xp.exprs.map(x => this.understand(x)) as Twain<number>);
      } else if (xp instanceof IdentifierP) {
        return lookup(xp.name);
      } else if (xp instanceof LiteralP) {
        switch (xp.token.kind) {
          case Other.FloatLiteral:
          case Other.IntegerLiteral: return xp.token.value as number;
          case Other.StringLiteral: return xp.token.value as string;
          case Other.BooleanLiteral: return xp.token.value as boolean;
          default: throw new Error(`wah idk what this is: ${xp.token.kind}`);
        }
      } else {
        throw new Error(`wah im a bad expression ${xp.constructor.name}`);
      }
    } else {
      throw new Error(`wah im a bad nothing ${xp.constructor.name}`);
    }
  }
}