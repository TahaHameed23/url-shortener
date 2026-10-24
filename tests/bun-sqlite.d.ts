declare module "bun:sqlite" {
    export class Database {
        constructor(filename: string);
        exec(query: string): void;
        query(query: string): {
            get(...parameters: unknown[]): unknown;
            all(...parameters: unknown[]): unknown[];
            run(...parameters: unknown[]): { changes: number };
        };
        close(): void;
    }
}
