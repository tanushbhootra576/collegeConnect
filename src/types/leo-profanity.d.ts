declare module 'leo-profanity' {
    export function loadDictionary(lang?: string): void;
    export function getDictionary(lang?: string): string[];
    export function add(words: string[] | string): void;
    export function check(text: string): boolean;
    export function clean(text: string, replaceKey?: string): string;
    export function list(): string[];
    export function remove(words: string[] | string): void;
    export function reset(): void;
    export function clearList(): void;
}
