declare global {
    interface String {
        reverse(): string;
        treem(...edges: string[]): string;
        ltreem(...edges: string[]): string;
        rtreem(...edges: string[]): string;
        spleet(separator: string, limit?: number): Array<string>;
        rspleet(separator: string, limit?: number): Array<string>;
    }
}
export type pair = {
    x: number;
    y: number;
};
export type path = {
    points: Array<pair>;
    cyclic: boolean;
};
export type arc = {
    center: pair;
    radius: number;
    from: number;
    to: number;
};
//# sourceMappingURL=asytypes.d.ts.map