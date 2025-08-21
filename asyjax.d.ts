declare global {
    interface String {
        first(): string;
        last(): string;
        reverse(): string;
        forkAt(index: number): [string, string];
        indicesOf(char: string): Array<number>;
        treem(...edges: string[]): string;
        ltreem(...edges: string[]): string;
        rtreem(...edges: string[]): string;
        spleet(separator: string, limit?: number): Array<string>;
        rspleet(separator: string, limit?: number): Array<string>;
    }
}
export {};
//# sourceMappingURL=asyjax.d.ts.map