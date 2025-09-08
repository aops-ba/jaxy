import { CompileError } from "./helper.ts";
import { asyAssert } from "./helper.ts";

import { Keyword, Operator, Separator, Other } from "./tokens.ts";

import { allspan, rightAfter } from "./tokens.ts";

import type { Token, TokenType } from "./tokens.ts";
import { isOperator } from "./tokens.ts";
import type { Assignor, Modifactor } from "./tokens.ts";
import { tokenTypeToString } from "./tokens.ts";

import type { LexyOptions } from "./lexer.ts";
import { Lexy } from "./lexer.ts";

import {
  LambdaP,
  ArrayCreationPhrase,
  ArrayInitializerList,
  AssignmentExpressionP,
  BinorP,
  BlockStatementP,
  BraceAffixedExpressionPhrase,
  BreakP,
  CastP,
  AllP,
  ContinueP,
  DowhileP,
  ForeachP,
  ForStatementP,
  FunctionDeclarationP,
  IdentifierP,
  IfStatementP,
  IndexExpressionPhrase,
  CallArgsP,
  CallP,
  LiteralP,
  MemberAccessPhrase,
  SemicolonStatementP,
  OperatorizerP,
  StatementP,
  RoundP,
  TupleP,
  TypedefDeclarationP,
  TypeP,
  UnorP,
  ManyVariablesDeclarationP,
  OneVariableDeclarationP,
  WhileP,
  ImportDeclarationP,
  StructDeclarationP,
  ReturnP,
  AccessP,
  DimensionsP,
  TernorP,
  ExpressionStatementP
} from "./piler.ts";
import { aside } from "./helper.ts";

export type PercyOptions = {
  // Future options go here
  lexer?: LexyOptions;
};

const SyntaxFacts = {
  UnaryExpressionStart: new Set<TokenType>([
    Keyword.new,
    Keyword.operator,
    Operator.Plus,
    Operator.Minus,
    Operator.Bang,
    Other.Identifier,
    Other.IntegerLiteral,
    Other.StringLiteral,
    Other.FloatLiteral,
    Separator.LRound,
  ]),
  StmtExpressionStart: new Set<TokenType>([
    Keyword.new,
    Keyword.operator,
    Operator.Plus,
    Operator.PlusPlus,
    Operator.Minus,
    Operator.MinusMinus,
    Operator.Bang,
    Other.Identifier,
    Other.IntegerLiteral,
    Other.StringLiteral,
    Other.FloatLiteral,
    Separator.LRound,
  ]),
  ImplicitMultiplicationRhsStart: new Set<TokenType>([
    Keyword.new,
    Keyword.operator,
    Other.Identifier,
    Other.IntegerLiteral,
    Other.StringLiteral,
    Other.FloatLiteral,
    Separator.LRound,
  ])
};

function isAssignmentOrCompoundAssignment(kind: TokenType): kind is Assignor {
  switch (kind) {
    case Operator.Eq:
    case Operator.PlusEq:
    case Operator.MinusEq:
    case Operator.StarEq:
    case Operator.SlashEq:
    case Operator.PercentEq:
    case Operator.CaretEq:
    case Operator.HashEq:
      return true;
  }
  return false;
}

function isRightAssociative(kind: TokenType) {
  return kind === Operator.Caret;
}

export default class Percy {
  readonly lexy: Lexy;

  tokens: Token<any>[];
  currentIndex: number; // current token index

  errors: CompileError[] = [];

  // Fuzzy bracket matching -- may need refinement
  matchingBrackets: Map<
    Token<any>,
    { match: Token<any> | null; tokenIndex: number; erroneous: boolean }
  > = new Map();

  /**
   * Create a new Java parser of some text.
   * @param text Text to parse.
   * @param options Parser options (e.g. disallow some expressions)
   */
  constructor(text: string, options: PercyOptions = {}) {
    const lexer = (this.lexy = new Lexy(text, options.lexer ?? {}));
    const tokens: Token<any>[] = [];
    let t: Token<any>;

    // Collect all tokens including EOF
    do {
      t = lexer.next();
      tokens.push(t);
    } while (t.kind !== Other.Eof);

    this.errors.push(...lexer.errors);

    this.tokens = tokens;
    this.currentIndex = 0;

    this._fuzzyMatchBrackets();
  }

  /**
   * Attempt to match brackets.
   *
   * The algorithm is imprecise and subject to improvements, in particular factoring in match information from
   * previous parses. We just pop the most recent bracket which matches, and if this isn't the bracket at the top
   * of the stack, we mark the match as erroneous.
   */
  private _fuzzyMatchBrackets() {
    const bracketStack: (Token<any> & {
      type: Separator.LSquare | Separator.LCurly | Separator.LRound;
    })[] = [];
    const indexStack: number[] = [];
    const {tokens, matchingBrackets} = this;

    // Pop an opening bracket off the stack and pair it with right.
    function pop(
      right: Separator.LRound | Separator.LSquare | Separator.LCurly,
      tok: Token<any>,
      tokenIndex: number
    ) {
      const startIndex = bracketStack.length - 1;
      for (let j = startIndex; j >= 0; --j) {
        const match = bracketStack[j]!;
        if (match!.type === right) {
          const erroneous = j !== startIndex;
          matchingBrackets.set(match, {match: tok, erroneous, tokenIndex});
          matchingBrackets.set(tok, {
            match: match,
            erroneous,
            tokenIndex: indexStack[j]!,
          });
          bracketStack.splice(j, 1);
          return;
        }
      }
      matchingBrackets.set(tok, {match: null, erroneous: true, tokenIndex: -1});
    }

    for (let i = 0; i < tokens.length; ++i) {
      const tok = tokens[i]!;
      switch (tok.kind) {
        case Separator.RRound:
          pop(Separator.LRound, tok, i);
          break;
        case Separator.RSquare:
          pop(Separator.LSquare, tok, i);
          break;
        case Separator.RCurly:
          pop(Separator.LCurly, tok, i);
          break;
        case Separator.LCurly:
        case Separator.LRound:
        case Separator.LSquare:
          bracketStack.push(tok as any);
          indexStack.push(i);
          break;
      }
    }

    // Mark all unmatched brackets as problematic
    bracketStack.forEach((tok) => {
      matchingBrackets.set(tok, {match: null, erroneous: true, tokenIndex: -1});
    });
  }

  /**
   * Get the bracket matching the opening or closing bracket given.
   * @param token The bracket.
   */
  matchBracket(
    token: Token<any> & {
      type:
        | Separator.LRound
        | Separator.LSquare
        | Separator.LCurly
        | Separator.RRound
        | Separator.RSquare
        | Separator.RCurly;
    }
  ): { match: Token<any> | null; tokenIndex: number; erroneous: boolean } {
    return this.matchingBrackets.get(token)!;
  }

  // Used to prevent infinite loops from crashing the parser
  fuel = 0;

  /**
   * Get the current token.
   */
  peek() {
    if (this.fuel++ > 1e6) {
      aside(["Stuck tok:", this.tokens[this.currentIndex]], 0);
      asyAssert(false, "infinite loop");
    }
    return this.tokens[this.currentIndex]!;
  }

  /**
   * Look ahead `count` tokens. For example, if we're currently on the token 'a' in 'a' '(' 2, then ahead(1) is '('
   * and ahead(2) is 2.
   * @param count The lookahead count.
   */
  ahead(count: number): Token<any> {
    const i = this.currentIndex + count;
    if (i >= this.tokens.length) return this.tokens.at(-1)!;
    return this.tokens[i]!;
  }

  /**
   * Step to the next token, saturating at the end of the file.
   */
  next() {
    if (this.currentIndex < this.tokens.length - 1) this.currentIndex++;
  }

  /**
   * Whether we have reached the end of the file.
   */
  eof(): boolean {
    return this.currentIndex >= this.tokens.length - 1;
  }

  /**
   * Roll back the token stream.
   * @param index Token index to move to. Usually used in conjunction with a previous value of `this.currentIndex`.
   */
  rollback(index: number) {
    asyAssert(
      index >= 0 && index < this.tokens.length,
      "Invalid rollback index"
    );
    this.currentIndex = index;
  }

  /**
   * Emit a compilation error.
   * @param message The compile error message.
   * @param span The associated span of the error.
   * @param errorType
   */
  emitError(message: string, span: { start: number; end: number }, errorType: "error" | "warning" = "error") {
    //console.log(this.lexer.originalText.slice(span.start - 20, span.end + 20));

    const last = this.errors.at(-1);
    if (last?.span.start !== span.start)
      this.errors.push(new CompileError(message, span, errorType));
  }

  /**
   * Attempt to consume a token of a given type. Raise a syntax error if the token is not available. Unconditionally
   * advance the token stream.
   * @param type Type of the token to consume.
   * @param message Message to emit if the token is not available. The default message is "Expected <token type>".
   */
  expectTT<T extends TokenType>(
    type: T,
    advanceOnErr = true,
    message?: (() => string) | { message?: () => string; usePrevSpan: boolean }
  ): Token<T> | null {
    const tok = this.peek();
    if (tok.kind === type) {
      this.next();
      return tok as Token<T>;
    }
    if (advanceOnErr) this.next();
    const invoke = typeof message === "function" ? message : message?.message;
    const usePrevSpan = typeof message === "object" && message.usePrevSpan;
    let span = tok.span;
    if (usePrevSpan) {
      const prevToken = this.tokens[this.currentIndex - 1];
      if (prevToken) {
        span = {start: prevToken.span.end, end: prevToken.span.end + 1};
      }
    }
    this.emitError(invoke?.() ?? "Expected " + tokenTypeToString(type), span);
    return null;
  }

  /**
   * Attempt to consume a token of a given type. Return null if the token is not available, but do not advance
   * or raise an error.
   * @param type Type of the token to consume.
   */
  maybeTT<T extends TokenType>(type: T): Token<T> | null {
    const tok = this.peek();
    if (tok.kind === type) {
      this.next();
      return tok as Token<T>;
    }
    return null;
  }

  consumeType(noBrackets: boolean = false): TypeP | null {
    const ident = this.expectIdent();
    if (!ident) return null;
    const brackets = (!noBrackets && this.peek().kind === Separator.LSquare) ? this.consumeOptionalBrackets() : null;
    return new TypeP(ident, brackets);
  }

  maybeContextualKw(kw: string): Token<Other.Identifier> | null {
    const t = this.peek();
    if (t.kind === Other.Identifier && t.value === kw) {
      this.next();
      return t;
    }
    return null;
  }

  consumeImportDeclaration(modifiers: Token<Modifactor>[]): ImportDeclarationP | null {
    const importToken = this.expectTT(Keyword.import);
    if (!importToken) return null;

    const importName = this.maybeTT(Other.StringLiteral) ?? this.expectIdent();
    const asToken = this.maybeContextualKw("as");
    let alias = asToken ? this.expectIdent() : null;
    const semi = this.expectSemicolon();
    return new ImportDeclarationP(modifiers, importToken, importName, asToken, alias, semi);
  }

  consumeStructDeclaration(modifiers: Token<Modifactor>[]): StructDeclarationP | null {
    const struct = this.expectTT(Keyword.struct);
    if (!struct) return null;

    const structName = this.expectIdent();
    const openBrace = this.expectTT(Separator.LCurly);
    const decls: StatementP[] = [];
    while (!this.eof() && this.peek().kind !== Separator.RCurly) {
      const decl = this.consumeDeclOrStmt();
      if (decl) {
        decls.push(decl);
      }
    }
    const closeBrace = this.expectTT(Separator.RCurly);
    this.maybeTT(Separator.Semicolon); // trailing semi is optional
    return new StructDeclarationP(modifiers, struct, structName, openBrace, decls, closeBrace);
  }

  // Either something of the form <name>=<expr> or just <expr>
  consumeInvocationArgument(): CallArgsP {
    const argIsSpread = this.maybeTT(Separator.DotDotDot);
    if (this.peek().kind === Other.Identifier && this.ahead(1).kind === Operator.Eq) {
      return new CallArgsP(argIsSpread, this.expectIdent()!, this.expectTT(Operator.Eq)!, this.consumeExpression());
    }
    return new CallArgsP(argIsSpread, null, null, this.consumeExpression());
  }

  _consumeInvocationExpressionRest(callee: StatementP): CallP | null {
    const lparen = this.expectTT(Separator.LRound);
    if (!lparen) return null;
    const args: CallArgsP[] = [];
    while (!this.eof() && this.peek().kind !== Separator.RRound) {
      const arg = this.consumeInvocationArgument();
      if (arg) args.push(arg);
      if (this.peek().kind === Separator.Comma) {
        this.next();
      } else if (this.peek().kind === Separator.DotDotDot) {
        // for example, cow(a, c ... b); is equivalent to calling cow with parameters a, c, followed by spreaded b.
        // This'll be handled by consumeInvocationArgument
      } else {
        break;
      }
    }
    const rparen = this.expectTT(Separator.RRound);
    return new CallP(callee, lparen, args, rparen);
  }

  consumeBlock(): BlockStatementP | null {
    const openBrace = this.expectTT(Separator.LCurly);
    if (!openBrace) return null;
    const statements: StatementP[] = [];
    while (!this.eof() && this.peek().kind !== Separator.RCurly) {
      const stmt = this.consumeDeclOrStmt();
      if (stmt) statements.push(stmt);
    }
    const closeBrace = this.expectTT(Separator.RCurly);
    return new BlockStatementP(openBrace, statements, closeBrace);
  }

  consumeBlockOrSemicolon(): BlockStatementP | Token<Separator.Semicolon> | null {
    return this.maybeTT(Separator.Semicolon) ?? this.consumeBlock();
  }

  _consumeFunctionDeclarationRest(): { list: ManyVariablesDeclarationP[], lastParamIsRest: Token<Separator.DotDotDot> | null } {
    const vars: ManyVariablesDeclarationP[] = [];
    let lastParamIsRest: Token<Separator.DotDotDot> | null = null;
    while (this.peek().kind !== Separator.RRound && !this.eof()) {
      const ellipsis = this.maybeTT(Separator.DotDotDot);
      if (ellipsis && lastParamIsRest) {
        this.emitError("Can only have one rest parameter", ellipsis.span);
      }
      lastParamIsRest = ellipsis;
      const modifiers = this._consumeModifiers();
      const type = this.consumeType();
      if (!type) break;
      const varDecl = new ManyVariablesDeclarationP(modifiers, type, [], null);
      if (this.peek().kind === Other.Identifier) {
        // Example taken: f(real a);
        // Example not taken: f(real);
        this._consumeVariableDeclListRest(varDecl, /*stopAtComma=*/true);
      }
      vars.push(varDecl);
      if (this.peek().kind === Separator.Comma) {
        this.next();
        if (lastParamIsRest) {
          this.emitError("Named parameter may not follow rest parameter", this.peek().span);
        }
      } else if (this.peek().kind === Separator.DotDotDot) {
        // handle on next iteration
      } else {
        break;
      }
    }
    return { list: vars, lastParamIsRest };
  }

  expectOperatorName(): Token<Operator> | Token<Other.Identifier> | null {
    const tok = this.peek();
    if (tok.kind === Other.Identifier || isOperator(tok.kind)) {
      this.next();
      return tok as Token<Operator> | Token<Other.Identifier>;
    }
    return null;
  }

  consumeFunctionOrVariableDeclaration(type: TypeP | null, modifiers: Token<Modifactor>[]): FunctionDeclarationP | ManyVariablesDeclarationP | null {
    const isOperator = this.maybeTT(Keyword.operator);
    const name = isOperator ? this.expectOperatorName() : this.expectTT(Other.Identifier);
    if (!name) return null;
    const tok = this.peek();
    switch (tok.kind) {
      case Separator.LRound:
      const lparen = this.expectTT(Separator.LRound)!;
      const { list, lastParamIsRest }  = this._consumeFunctionDeclarationRest()!;
      const rparen = this.expectTT(Separator.RRound);

      const eq = this.maybeTT(Operator.Eq);
      let body: StatementP | Token<Separator.Semicolon> | null = null;
      if (eq) {
        // Initializer for function type
        body = this.consumeExpression();
        this.expectSemicolon();
      } else {
        body = this.consumeBlockOrSemicolon();
      }

      return new FunctionDeclarationP(modifiers, type, isOperator, name, lparen, list, lastParamIsRest, rparen, body);
    case Separator.Semicolon:
    case Separator.LSquare:  // e.g., real a[];
    case Separator.Comma:  // e.g. pair A, B;
    case Operator.Eq:
      const tree = new ManyVariablesDeclarationP(modifiers, type, [], null);
      this.rollback(this.currentIndex - 1);  // step to before the name
      return this._consumeVariableDeclListRest(tree);
    default:
      this.emitError("Expected function or variable declaration", tok.span);
      return null;
    }
  }

  expectIdent(): IdentifierP | null {
    const name = this.expectTT(Other.Identifier);
    if (!name) return null;
    return new IdentifierP(name);
  }

  /**
   * Consume the '(' Expression ')' in if-statements, while-statements, etc.
   *
   * @param partOf For error messages, e.g. "if-condition"
   */
  _consumeParenthesizedCondition(): {
    openParen: Token<Separator.LRound> | null;
    condition: StatementP | null;
    closeParen: Token<Separator.RRound> | null;
  } {
    const openParen = this.expectTT(
      Separator.LRound,
      false
    );
    const condition = this.consumeExpression();
    const closeParen = this.expectTT(
      Separator.RRound,
      false
    );

    return {openParen, condition, closeParen};
  }

  consumeIfStatement(): IfStatementP | null {
    const ifToken = this.expectTT(Keyword.if);
    if (ifToken === null) return null;

    const {openParen, condition, closeParen} = this._consumeParenthesizedCondition();
    const thenStatement = this.consumeStatement();

    const elseToken = this.maybeTT(Keyword.else);
    const elseStatement = elseToken ? this.consumeStatement() : null;

    return new IfStatementP(
      ifToken,
      openParen,
      condition,
      closeParen,
      thenStatement,
      elseToken,
      elseStatement
    );
  }

  consumeExpressionList(): StatementP[] {
    const exprs: StatementP[] = [];
    while (SyntaxFacts.StmtExpressionStart.has(this.peek().kind)) {
      const expr = this.consumeExpression();
      if (expr) {
        exprs.push(expr)
      } else {
        break;
      }
      if (!this.maybeTT(Separator.Comma)) {
        break;
      }
    }
    return exprs;
  }

  consumeForOrEnhancedForStatement(): StatementP | null {
    const forToken = this.expectTT(Keyword.for);
    if (forToken === null) return null;
    const openParen = this.expectTT(Separator.LRound, false);

    // Init: First try to consume a type and see what follows
    const start = this.currentIndex;
    const {result: ty, errs} = this.captureErrors(() => {
      return this.consumeType();
    });

    let init:
      | ManyVariablesDeclarationP
      | StatementP[]
      | null = null;
    if (ty !== null) {
      // for (int pox : b)
      //      ^^^
      // OR
      // for (int a = 0; a <
      //      ^
      // OR
      // for (pox = 2
      //      ^
      const tokenFollowingTy = this.peek();
      switch (tokenFollowingTy.kind) {
        case Other.Identifier: {
          if (this.ahead(1).kind === Operator.Colon) {
            errs.forEach((err) => this.errors.push(err));

            // Enhanced for loop (aka range for loop)
            const ident = this.expectIdent()!;
            const colon = this.expectTT(Operator.Colon)!;

            const iterated = this.consumeExpression();
            const closeParen = this.expectTT(Separator.RRound, false);

            const block = this.consumeStatement();

            return new ForeachP(
              forToken,
              openParen,
              ty,
              ident,
              colon,
              iterated,
              closeParen,
              block
            );
          }

          // Local variable declaration list
          init = this._consumeVariableDeclListRest(new ManyVariablesDeclarationP([], ty, [], null));
          // We ate a semi colon, step back one
          if (init.semicolonToken) {
            init.semicolonToken = null;
            this.rollback(this.currentIndex - 1);
          }
          break;
        }
        case Separator.Semicolon:
        case Separator.Comma:
        case Separator.RRound: {
          // for (int;
          //     ^
          // OR
          // for (a :
          //    ^
          // (i.e. Missing type or variable name)
          ty.resolveSpans();
          this.emitError("Expected variable name", this.peek().span);
          break;
        }
        default: {
          // Actually a statement expression
          break;
        }
      }
    }

    if (init === null) {
      this.rollback(start);
      init = this.consumeExpressionList();
    } else {
      this.errors.push(...errs);
    }

    const sep1 = this.expectSemicolon();
    const forCond =
      this.peek().kind === Separator.Semicolon
        ? null
        : this.consumeExpression();
    const sep2 = this.expectSemicolon();
    const update =
      this.peek().kind === Separator.RRound
        ? null
        : this.consumeExpressionList();
    const closeParen = this.expectTT(Separator.RRound, false);

    return new ForStatementP(
      forToken,
      openParen,
      init,
      sep1,
      forCond,
      sep2,
      update,
      closeParen,
      this.consumeStatement()
    );
  }

  consumeWhileStatement(): WhileP | null {
    const whileToken = this.expectTT(Keyword.while);
    if (!whileToken) return null;

    const {openParen, condition, closeParen} =
      this._consumeParenthesizedCondition();
    const statement = this.consumeStatement();

    return new WhileP(
      whileToken,
      openParen,
      condition,
      closeParen,
      statement
    );
  }

  consumeDoWhileStatement(): DowhileP | null {
    const doToken = this.expectTT(Keyword.do);
    if (doToken === null) return null;

    const stmt = this.consumeStatement();
    const whileToken = this.expectTT(Keyword.while);

    const {openParen, condition, closeParen} =
      this._consumeParenthesizedCondition();
    const semicolon = this.expectSemicolon();

    return new DowhileP(
      doToken,
      stmt,
      whileToken,
      openParen,
      condition,
      closeParen,
      semicolon
    );
  }

  consumeNakedSemicolon(): SemicolonStatementP | null {
    const semicolon = this.expectTT(Separator.Semicolon);
    return semicolon ? new SemicolonStatementP(semicolon) : null;
  }

  consumeStatement(modifiers: Token<Modifactor>[] = [], overrideError?: string): StatementP | null {
    const tok = this.peek();
    switch (tok.kind) {
      case Separator.LCurly: {
        // TODO: ban modifiers
        return this.consumeBlock();
      }
      case Separator.Semicolon: {
        return this.consumeNakedSemicolon();
      }
      case Keyword.if: {
        return this.consumeIfStatement();
      }
      case Keyword.while: {
        return this.consumeWhileStatement();
      }
      case Keyword.do: {
        return this.consumeDoWhileStatement();
      }
      case Keyword.break: {
        this.next();
        return new BreakP(tok as Token<Keyword.break>, this.expectSemicolon());
      }
      case Keyword.continue: {
        this.next();
        return new ContinueP(tok as Token<Keyword.continue>, this.expectSemicolon());
      }
      case Keyword.return: {
        this.next();
        const expr = this.peek().kind !== Separator.Semicolon ? this.consumeExpression() : null;
        return new ReturnP(tok as Token<Keyword.return>, expr, this.expectSemicolon());
      }
      case Keyword.for: {
        return this.consumeForOrEnhancedForStatement();
      }
      case Other.Identifier: {
        const next = this.ahead(1);
        switch (next.kind) {
          case Separator.Semicolon:
          case Separator.Comma:
          case Operator.Eq: {
            // x;  (expression)  or   private x;   (variable declaration, no type)
            if (modifiers.length > 0) {
              return this._consumeVariableDeclListRest(new ManyVariablesDeclarationP(modifiers, /*type=*/null, [], null));
            } else {
              return this.consumeExpressionStatement();
            }
          }
          case Separator.LSquare: {
            // x[3] ...;  (statement expression) or  real[] m; (variable or function declaration)
            if (this.ahead(2).kind === Separator.RSquare) {
              return this.consumeFunctionOrVariableDeclaration(this.consumeType()!, modifiers);
            } else {
              return this.consumeExpressionStatement();
            }
          }
          case Other.Identifier:
          case Keyword.operator: {
            // Variable declaration or function declaration
            return this.consumeFunctionOrVariableDeclaration(this.consumeType()!, modifiers);
          }
          default: {
            if (modifiers.length > 0) {
              this.emitError("Modifier not allowed here", modifiers[0]!.span);
            }
            return this.consumeExpressionStatement();
          }
        }
      }
      default: {
        if (SyntaxFacts.StmtExpressionStart.has(tok.kind)) {
          return this.consumeExpressionStatement();
        }
        this.emitError(overrideError ?? "Expected statement", tok.span);
        this.next();
        return null;
      }
    }
  }

  consumeTypedef(modifiers: Token<Modifactor>[]): TypedefDeclarationP | null {
    const typedefToken = this.expectTT(Keyword.typedef);
    if (!typedefToken) return null;

    const type = this.consumeType();
    const decl = this.consumeFunctionOrVariableDeclaration(type, modifiers);

    // TODO: Disallow various stuff in the decl
    return new TypedefDeclarationP(typedefToken, decl);
  }

  consumeAccessDeclaration(modifiers: Token<Modifactor>[]): AccessP | null {
    const access = this.expectTT(Keyword.access);
    if (!access) return null;

    const module = this.expectIdent();
    const semi = this.expectSemicolon();
    return new AccessP(modifiers, access, module, semi);
  }


  consumeDeclOrStmt(): StatementP | null {
    const modifiers = this._consumeModifiers();
    let tok = this.peek();

    // TODO: this._checkModifiers(modifiers);
    switch (tok.kind) {
    case Keyword.import:
      return this.consumeImportDeclaration(modifiers);
    case Keyword.struct:
      return this.consumeStructDeclaration(modifiers);
    case Keyword.access:
      return this.consumeAccessDeclaration(modifiers);
    case Keyword.typedef:
      return this.consumeTypedef(modifiers);
    default:
      return this.consumeStatement(modifiers, "Expected declaration, statement or import");
    }
  }

  parse() {
    const decls: StatementP[] = [];
    while (!this.eof()) {
      const decl = this.consumeDeclOrStmt();
      if (decl)
        decls.push(decl);
    }
    const tree = new AllP(decls);
    tree.resolveSpans();
    return tree;
  }

  // Consume the brackets as part of a type definition, e.g., the [][] in private real a[][]; or
  // private real[][] a; Note that expressions within the brackets are not allowed.
  consumeOptionalBrackets(): DimensionsP | null {
    let tok: Token<any> | null;
    const brackets: Token<Separator.LSquare | Separator.RSquare>[] = [];
    while ((tok = this.maybeTT(Separator.LSquare))) {
      const close = this.expectTT(Separator.RSquare);
      brackets.push(tok as Token<Separator.LSquare>);
      if (!close) break;
      brackets.push(close);
    }
    return brackets.length ? new DimensionsP(brackets) : null;
  }

  _consumeVariableDeclListRest(tree: ManyVariablesDeclarationP, parsingFnArgument: boolean = false): ManyVariablesDeclarationP {
    // Starting from the first name in a variable declaration, parse the rest of the declaration, including
    // initializers and the trailing semicolon.
    a: while (true) {
      if (this.peek().kind !== Other.Identifier) break;
      const name = this.expectIdent()!;

      const brackets = this.consumeOptionalBrackets();
      const follows = this.peek();
      let initializer: StatementP | null = null;
      let eq: Token<Operator.Eq> | null = null;
      let lparen: Token<Separator.LRound> | null = null;
      let rparen: Token<Separator.RRound> | null = null;
      let args: ManyVariablesDeclarationP[] | null = null;
      let lastParamIsRest: Token<Separator.DotDotDot> | null = null;

      switch (follows.kind) {
        case Other.Eof:
        case Separator.Semicolon:
        case Separator.RRound:
          break;

        // @ts-ignore fallthrough
        case Separator.LRound: {  // function type, e.g. real f(real)
          lparen = this.expectTT(Separator.LRound)!;
          const { list, lastParamIsRest: l } = this._consumeFunctionDeclarationRest();
          args = list;
          lastParamIsRest = l;
          rparen = this.expectTT(Separator.RRound);
          if (this.peek().kind !== Operator.Eq) {
            break;
          }
        }
        // @ts-ignore fallthrough
        case Operator.Eq: {
          eq = this.expectTT(Operator.Eq)!;
          initializer = this.consumeExpressionOrArrayInitializer();
          break;
        }
        case Separator.Comma: {
          break;
        }
        // @ts-ignore fallthrough
        case Separator.DotDotDot: {
          if (parsingFnArgument) break a;
        }
      }

      tree.decls.push(new OneVariableDeclarationP(name, brackets, lparen, args, lastParamIsRest, rparen, eq, initializer));

      const kind = this.peek().kind;
      if (kind === Separator.Comma) {
        if (parsingFnArgument) break;
        this.next();
      } else if (kind !== Separator.Semicolon && kind !== Separator.DotDotDot && kind !== Separator.RRound) {
        this.emitError("Expected ; or ,", rightAfter(this.ahead(-1).span));
        break;
      }
    }

    // maybeTT here because a missing semicolon would have been complained about above
    tree.semicolonToken = this.maybeTT(Separator.Semicolon);
    return tree;
  }

  consumeConditionalExpression(): StatementP | null {
    // Conditional expressions are at their own level; repeatedly parse a lower-precedence expression and then
    // look for a ? : sequence

    let lhs = this.consumePrimaryOrUnaryExpression();
    if (lhs === null) return null;

    lhs = this.consumeExpressionOperatorPrecedence(lhs, 0);

    while (this.peek().kind === Operator.Question) {
      const question = this.expectTT(Operator.Question)!;
      const thenBranch = this.consumeExpression();
      const colon = this.expectTT(Operator.Colon)!;
      const elseBranch = this.consumeConditionalExpression();

      lhs = new TernorP(
        lhs,
        question,
        thenBranch,
        colon,
        elseBranch
      );
    }

    return lhs;
  }

  consumeExpression(): StatementP | null {
    let lhs = this.consumeConditionalExpression();
    const curr = this.peek();
    if (lhs && isAssignmentOrCompoundAssignment(curr.kind)) {
      // TODO: Check valid LHS
      this.next();
      const rhs = this.consumeExpressionOrArrayInitializer();
      return new AssignmentExpressionP(lhs, curr as Token<Assignor>, rhs);
    }
    while (lhs && curr.kind == Separator.LRound) {
      lhs = this._consumeInvocationExpressionRest(lhs);
    }
    return lhs;
  }

  // Note that array initializers are only allowed on the right hand side of an assignment
  consumeExpressionOrArrayInitializer(): StatementP | null {
    if (this.peek().kind === Separator.LCurly) {
      // Array initializer
      const openBrace = this.expectTT(Separator.LCurly)!;
      const elements: StatementP[] = [];
      while (!this.eof() && this.peek().kind !== Separator.RCurly) {
        // Array initializers can nest
        const expr = this.consumeExpressionOrArrayInitializer();
        if (expr) elements.push(expr);
        if (!this.maybeTT(Separator.Comma)) {
          break;
        }
      }
      const closeBrace = this.expectTT(Separator.RCurly);
      return new ArrayInitializerList(openBrace, elements, closeBrace);
    }
    return this.consumeExpression();
  }

  consumeExpressionStatement() {
    const expr = this.consumeExpression();
    const semicolon = this.expectSemicolon();

    return new ExpressionStatementP(expr, semicolon);
  }

  captureErrors<T>(callback: () => T): {errs: CompileError[]; result: T} {
    const oldErrors = this.errors;
    const newErrors = (this.errors = []);
    const result = callback();
    this.errors = oldErrors;
    return {errs: newErrors, result};
  }

  consumePrimaryOrUnaryExpression(): StatementP | null {
    const tok = this.peek();

    switch (tok.kind) {
      case Operator.PlusPlus:
      case Operator.MinusMinus:
      case Operator.Plus:
      case Operator.Minus:
      case Operator.Bang:
      case Operator.Twiddle:
        this.next();
        return new UnorP(
          tok as any,
          this.consumePrimaryOrUnaryExpression(),
          /*prefix=*/true
        );
      // @ts-ignore fallthrough
      case Separator.LRound: {
        const pos = this.currentIndex;
        this.next();
        // Maybe it's a cast?
        const { errs, result } = this.captureErrors(() => {
          return this.consumeType();
        });
        let rparen;
        // No errors when parsing the parenthesized expression as a type -> treat as a cast
        if (errs.length === 0 && result && (rparen = this.maybeTT(Separator.RRound))) {
          return this._consumeCast(tok as Token<Separator.LRound>, result, rparen);
        }
        this.rollback(pos);
      } // fallthrough
      default:
        let expr = this.consumePrimaryExpression();
        if (expr === null) return null;

        if (this.peek().kind === Operator.MinusMinus) {
          // Distinguish between postfix decrement and binary operator  -- (e.g. A--B)
          if (SyntaxFacts.UnaryExpressionStart.has(this.ahead(1).kind)) {
            return expr;
          }
        }

        // Read postfix operators
        let next = this.peek();
        while (
          next.kind === Operator.PlusPlus ||
          next.kind === Operator.MinusMinus
          ) {
          this.next();
          expr = new UnorP(next as any, expr, /*prefix=*/false);
          next = this.peek();
        }

        return expr;
    }
  }

  consumeNewExpression(): StatementP | null {
    const newToken = this.expectTT(Keyword.new);
    if (!newToken) return null;

    const type = this.consumeType(/*noBrackets=*/true);
    if (!type) return null;

    const bracketArgs: StatementP[] = [];
    while (this.peek().kind === Separator.LSquare && this.ahead(1).kind !== Separator.RSquare) {
      this.expectTT(Separator.LSquare);
      const expr = this.consumeExpression();
      if (expr) {
        bracketArgs.push(expr);
      }
      this.expectTT(Separator.RSquare);
    }
    type.brackets = this.consumeOptionalBrackets();

    if (this.peek().kind === Separator.LRound) {
      if (bracketArgs.length > 0) {
        this.emitError("Can't have anonymous function declaration here", this.peek().span);
      }

      // New function, e.g. new void (int a) { }
      const lparen = this.expectTT(Separator.LRound)!;
      const { list: args, lastParamIsRest } = this._consumeFunctionDeclarationRest();
      const rparen = this.expectTT(Separator.RRound);
      const body = this.consumeBlock();

      return new LambdaP(newToken, type, lparen, args, lastParamIsRest, rparen, body);
    }

    let init: ArrayInitializerList | null = null;
    if (this.peek().kind === Separator.LCurly) {
      init = this.consumeExpressionOrArrayInitializer() as ArrayInitializerList;
      if (bracketArgs.length > 0) {
        init.resolveSpans();
        this.emitError("Array initializer not allowed here", init.span);
      }
    }
    return new ArrayCreationPhrase(newToken, type, bracketArgs, init);
  }

  consumeParenthesizedExpressionOrTuple(): StatementP | null {
    const lparen = this.expectTT(Separator.LRound);
    if (!lparen) return null;

    const exprs: (StatementP | null)[] = [];

    while (true) {
      exprs.push(this.consumeExpression());
      switch (this.peek().kind) {
      case Separator.Comma:
        this.next();
        break;
      case Separator.RRound:
        const rparen = this.expectTT(Separator.RRound);
        return exprs.length > 1 ? new TupleP(lparen, exprs, rparen) : new RoundP(lparen, exprs[0], rparen);
      default:
        this.emitError("Expected , or )", this.peek().span);
        break;
      }
    }
  }

  // Expect a semicolon, but put the error symbol (if there isn't a semicolon) just after the current token
  // because generally the semicolon is expected to be on the same line.
  expectSemicolon(): Token<Separator.Semicolon> | null {
    const tok = this.peek();
    if (tok.kind === Separator.Semicolon) {
      this.next();
      return tok as Token<Separator.Semicolon>;
    }
    const end = this.ahead(-1).span.end;
    this.emitError("Expected ;", { start: end, end: end + 1 });
    return null;
  }

  _consumeIndexExpression(tree: StatementP) {
    const lbracket = this.expectTT(Separator.LSquare)!;
    if (!lbracket) return null;

    const expr = this.peek().kind !== Operator.Colon ? this.consumeExpression() : null;
    const colon = this.maybeTT(Operator.Colon);
    const expr2 = this.peek().kind !== Separator.RSquare ? this.consumeExpression() : null;
    return new IndexExpressionPhrase(tree, lbracket, expr, colon, expr2, this.expectTT(Separator.RSquare));
  }

  consumeCurlExpression(): UnorP | null {
    const curl = this.expectTT(Keyword.curl);
    if (!curl) return null;

    const expr = this.consumeExpression();
    return new UnorP(curl, expr, /*prefix=*/true);
  }

  _consumeBraceSuffixedExpression(tree: StatementP): BraceAffixedExpressionPhrase {
    const lbrace = this.expectTT(Separator.LCurly);
    asyAssert(lbrace !== null, "_consumeBraceSuffixedExpression precondition");

    let suffix: StatementP | null = null;
    switch (this.peek().kind) {
      case Keyword.curl: {
        suffix = this.consumeCurlExpression();
        break;
      }
      default: {
        suffix = this.consumeExpression();
        break;
      }
      case Separator.RCurly: {
        this.emitError("Expected suffix expression", allspan(lbrace.span, this.peek().span))
        break;
      }
    }

    const rbrace = this.expectTT(Separator.RCurly);
    return new BraceAffixedExpressionPhrase(tree, lbrace, suffix, rbrace, /*isSuffix=*/true);
  }

  _consumePrimaryExpressionRest(tree: StatementP): StatementP {
    switch (this.peek().kind) {
    case Separator.Dot:
      tree = new MemberAccessPhrase(tree, this.expectTT(Separator.Dot)!, this.expectIdent());
      break;
    case Separator.LRound:
      tree = this._consumeInvocationExpressionRest(tree)!;
      break;
    case Separator.LSquare:
      tree = this._consumeIndexExpression(tree)!;
      break;
    case Separator.LCurly:
      tree = this._consumeBraceSuffixedExpression(tree);
      break;
    default:
      return tree;
    }

    return this._consumePrimaryExpressionRest(tree);
  }

  _consumeControlsOrTensionRest(tree: UnorP): UnorP {
    // Two forms:
    //   .. controls <expr> ..
    //   .. controls <expr> and <expr> ..
    let expr = this.consumePrimaryExpression();
    const nextK = this.peek().kind;
    if (expr && nextK !== Operator.and && nextK !== Operator.DotDot) {
      expr = this.consumeExpressionOperatorPrecedence(expr, (Percy.BinaryPrecedenceTable[Operator.DotDot]! + 1));
    }

    return tree;
  }

  public lineOf(offset: number): number {
    return this.lexy.lineOf(offset);
  }

  consumePrimaryExpression(): StatementP | null {
    const tok = this.peek();
    let lhs: StatementP | null = null;
    switch (tok.kind) {
    case Keyword.new:
      lhs = this.consumeNewExpression();
      break;
    case Separator.LRound:
      lhs = this.consumeParenthesizedExpressionOrTuple();
      break;
    case Other.Identifier:
      lhs = this.expectIdent();
      break;
    case Keyword.operator: {
      const operatorToken = this.expectTT(Keyword.operator)!;
      const op = this.expectOperatorName();
      lhs = new OperatorizerP(operatorToken, op);
      break;
    }
    case Other.FloatLiteral:
    case Other.BooleanLiteral:
    case Other.StringLiteral:
    case Other.NullLiteral:
    case Other.IntegerLiteral: {
      const lit = new LiteralP(tok);
      this.next();
      if (tok.kind === Other.IntegerLiteral || tok.kind === Other.FloatLiteral) {
        // Potentially an implicit multiplication like 3 x^2
        const curr = this.peek();
        if (SyntaxFacts.ImplicitMultiplicationRhsStart.has(curr.kind)) {
          if (this.lineOf(tok.span.end) !== this.lineOf(curr.span.start)) {
            // Implicit multiplication split across a newline -- probably unintentional
            this.emitError("Missing ; or operator", rightAfter(tok.span), "warning");
          }

          return new BinorP(lit, null, this.consumePrimaryExpression(), /*isImplicitMultiplication=*/true);
        }
      }

      return lit;
    }
    default:
      this.emitError("Expected start of primary expression", tok.span);
      this.next();
      return null;
    }

    if (!lhs) return null;
    return this._consumePrimaryExpressionRest(lhs);
  }

  static BinaryPrecedenceTable: {[key in Operator]?: number} =
    {
      // e.g. a || b && c always parses as a || (b && c)
      // TODO: Find the actual values, fill them out
      [Operator.BarBar]: 1,
      [Operator.and]: 2,
      [Operator.AmpAmp]: 2,
      [Operator.Bar]: 3,
      [Operator.Amp]: 4,
      [Operator.EqEq]: 5,
      [Operator.BangEq]: 5,
      [Operator.Lt]: 6,
      [Operator.Gt]: 6,
      [Operator.LtEq]: 6,
      [Operator.GtEq]: 6,
      [Operator.LtLt]: 7,
      [Operator.GtGt]: 7,
      [Operator.AtAt]: 7,
      [Operator.Dollar]: 7,
      [Operator.DollarDollar]: 7,
      [Operator.Bang]: 7,
      [Operator.Twiddle]: 7,
      [Operator.Caret]: 8,
      [Operator.StarStar]: 8,
      [Operator.DotDot]: 9,
      [Operator.MinusMinus]: 9,
      [Operator.CaretCaret]: 9,
      [Operator.MinusMinusMinus]: 9,
      [Operator.Plus]: 9,
      [Operator.Minus]: 9,
      [Operator.Star]: 10,
      [Operator.Slash]: 10,
      [Operator.Percent]: 10,
      [Operator.Hash]: 10,
    };

  consumeExpressionOperatorPrecedence(
    lhs: StatementP,
    minPrecedence: number
  ): StatementP | null {
    const exprStack: (StatementP | null)[] = [lhs];
    const os: Token<any>[] = []; // operator stack

    function binaryPrecedence(tok: TokenType): number {
      return (Percy.BinaryPrecedenceTable as any)[tok] ?? -1;
    }

    let tok: Token<any>;
    while (binaryPrecedence((tok = this.peek()).kind) >= minPrecedence) {
      os.push(tok);

      this.next();
      if (tok.kind === Operator.DotDot) {
        // Certain special things can follow .. because it's used for weird path expressions:
        //  (1,2)..{up}(3,4)
        //  (1,2)..controls (2,0) and (3,0)..(3,4)
      }

      const expr = this.consumePrimaryOrUnaryExpression();
      exprStack.push(expr);

      // Credit: Wikipedia article
      while (
        os.length > 0 &&
        binaryPrecedence(os.at(-1)!.kind) >= binaryPrecedence(this.peek().kind)
        ) {
        const opOnStack = os.at(-1)!;
        const nextOp = this.peek();

        const opOnStackPrecedence = binaryPrecedence(opOnStack.kind);
        const nextOpPrecedence = binaryPrecedence(nextOp.kind);

        const isLeftAssoc =
          !isRightAssociative(opOnStack.kind) && opOnStackPrecedence >= nextOpPrecedence;

        const isRightAssoc =
          isRightAssociative(opOnStack.kind) && opOnStackPrecedence > nextOpPrecedence;

        if (isLeftAssoc || isRightAssoc) {
          const exprRhs = exprStack.pop() ?? null;
          const op = os.pop()!;
          const exprLhs = exprStack.pop() ?? null;
          exprStack.push(
            new BinorP(
              exprLhs as StatementP,
              op as Token<Operator>,
              exprRhs as StatementP
            )
          );
        } else {
          // If we shouldn't pop, break the inner loop
          break;
        }
      }
    }

    return exprStack[0]! as StatementP;
  }

  private _consumeCast(openParen: Token<Separator.LRound>, type: TypeP, closeParen: Token<Separator.RRound> | null) {
    const expr = this.consumeExpression();
    return new CastP(openParen, type, closeParen, expr)
  }

  private _consumeModifiers(): Token<Modifactor>[] {
    let modifiers: Token<Modifactor>[] = [];
    let tok = this.peek();
    // TODO pull out into helper
    while (tok.kind === Keyword.private || tok.kind === Keyword.public || tok.kind === Keyword.static ||
    tok.kind === Keyword.explicit || tok.kind === Keyword.interactive || tok.kind === Keyword.restricted) {
      modifiers.push(tok as any);
      this.next();
      tok = this.peek();
    }
    return modifiers;
  }
}
