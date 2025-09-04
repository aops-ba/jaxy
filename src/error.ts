import type { Span } from "./tokens";

type Badness = "warning" | "error";

class CompileError {
  constructor(
    public readonly message: string,
    public readonly span: Span,
    public readonly errorType: Badness = "error"
  ) {}
}

class AsyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsyError";
  }
}

function asyAssert(condition: boolean, message?: string): asserts condition {
  if (!condition) throw new Error(`I can't assert ${message ? `that ${message}` : "this"}…`);
}

function asyUnreachable(message: string = ""): never {
  throw new Error(`Unreachable: ${message}`);
}

export type { Badness };
export { CompileError, AsyError };
export { asyAssert, asyUnreachable };