/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Minimal BERT WordPiece tokenizer in TypeScript.
 * - BasicTokenizer: cleans text, splits on whitespace/punctuation, optional lowercasing & accent stripping
 * - WordPieceTokenizer: greedy longest-match-first with "##" continuation
 * - BertTokenizer: combines both and maps to ids using a provided vocab { token: id }
 *
 * Usage:
 *   const vocab = await loadVocab('vocab.json'); // { "[PAD]":0, "[UNK]":100, ... }
 *   const tokenizer = new BertTokenizer(vocab, { doLowerCase: true });
 *   const out = tokenizer.encode("Playing football in Bengaluru!");
 *   console.log(out.inputIds, out.tokens, out.attentionMask);
 */

export type Vocab = Record<string, number>;

export interface TokenizerOptions {
    doLowerCase?: boolean;          // BERT Base uncased: true; cased models: false
    stripAccents?: boolean;         // Typically true when doLowerCase = true
    unkToken?: string;              // "[UNK]"
    clsToken?: string;              // "[CLS]"
    sepToken?: string;              // "[SEP]"
    padToken?: string;              // "[PAD]"
    maxInputCharsPerWord?: number;  // Guard against very long runs (default 100)
}

const DEFAULTS: Required<TokenizerOptions> = {
    doLowerCase: true,
    stripAccents: true,
    unkToken: "[UNK]",
    clsToken: "[CLS]",
    sepToken: "[SEP]",
    padToken: "[PAD]",
    maxInputCharsPerWord: 100,
};

const PUNCT_REGEX =
    /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-./:;<=>?@\[\]^_`{|}~]/u;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/u;

/** Utility: is whitespace (per BERT’s basic tokenizer) */
function isWhitespace(ch: string): boolean {
    return /\s/.test(ch) || ch === "\u00A0";
}

/** Utility: is control char (except \t, \n, \r) */
function isControl(ch: string): boolean {
    if (ch === "\t" || ch === "\n" || ch === "\r") return false;
    return CONTROL_CHAR_REGEX.test(ch);
}

/** Utility: is punctuation */
function isPunctuation(ch: string): boolean {
    // Treat ASCII punctuation and general punctuation ranges as punctuation.
    return PUNCT_REGEX.test(ch);
}

/** Strip accents by NFD + remove combining marks */
function stripAccents(text: string): string {
    // Normalize to NFD and remove combining diacritical marks
    return text.normalize("NFD").replace(/\p{M}+/gu, "");
}

/** Basic tokenizer closely following BERT */
export class BasicTokenizer {
    private readonly doLowerCase: boolean;
    private readonly stripAccentsFlag: boolean;

    constructor(opts?: TokenizerOptions) {
        const o = { ...DEFAULTS, ...(opts || {}) };
        this.doLowerCase = o.doLowerCase;
        this.stripAccentsFlag = o.stripAccents;
    }

    cleanText(text: string): string {
        let out = "";
        for (const ch of text) {
            if (ch === "\u0000") continue; // nulls
            if (isControl(ch)) continue;
            if (ch === "\u00A0") {
                out += " ";
            } else {
                out += ch;
            }
        }
        return out;
    }

    tokenize(text: string): string[] {
        // 1) Clean
        let t = this.cleanText(text);
        // 2) Whitespace tokenize into chunks
        const origTokens = t.split(/\s+/).filter(Boolean);
        // 3) Process each chunk: lower/accents, then split on punctuation
        const splitTokens: string[] = [];
        for (let tok of origTokens) {
            if (this.doLowerCase) tok = tok.toLowerCase();
            if (this.stripAccentsFlag) tok = stripAccents(tok);
            splitTokens.push(...this.runSplitOnPunc(tok));
        }
        // 4) Final pass: split by whitespace again (some splits may introduce spaces)
        return splitTokens.join(" ").split(/\s+/).filter(Boolean);
    }

    private runSplitOnPunc(text: string): string[] {
        const tokens: string[] = [];
        let buff = "";
        for (const ch of text) {
            if (isPunctuation(ch)) {
                if (buff) tokens.push(buff);
                tokens.push(ch);
                buff = "";
            } else if (isWhitespace(ch)) {
                if (buff) tokens.push(buff);
                buff = "";
            } else {
                buff += ch;
            }
        }
        if (buff) tokens.push(buff);
        return tokens;
    }
}

/** WordPiece tokenizer (greedy longest-match-first) */
export class WordPieceTokenizer {
    private readonly vocab: Vocab;
    private readonly vocabSet: Set<string>;
    private readonly unkToken: string;
    private readonly maxInputCharsPerWord: number;

    constructor(vocab: Vocab, opts?: TokenizerOptions) {
        const o = { ...DEFAULTS, ...(opts || {}) };
        this.vocab = vocab;
        this.vocabSet = new Set(Object.keys(vocab));
        this.unkToken = o.unkToken;
        this.maxInputCharsPerWord = o.maxInputCharsPerWord;
        if (!this.vocabSet.has(this.unkToken)) {
            throw new Error(`UNK token "${this.unkToken}" missing from vocab`);
        }
    }

    tokenize(tokens: string[]): string[] {
        const output: string[] = [];
        for (const token of tokens) {
            if (token.length > this.maxInputCharsPerWord) {
                output.push(this.unkToken);
                continue;
            }
            const subTokens = this.wordpieceTokenize(token);
            output.push(...subTokens);
        }
        return output;
    }

    private wordpieceTokenize(token: string): string[] {
        const chars = [...token]; // handle unicode
        let start = 0;
        const subTokens: string[] = [];

        while (start < chars.length) {
            let end = chars.length;
            let curSubstr: string | null = null;

            while (start < end) {
                let substr = chars.slice(start, end).join("");
                if (start > 0) substr = "##" + substr;

                if (this.vocabSet.has(substr)) {
                    curSubstr = substr;
                    break;
                }
                end -= 1;
            }

            if (curSubstr == null) {
                return [this.unkToken];
            }
            subTokens.push(curSubstr);
            start = end;
        }
        return subTokens;
    }
}

/** Full BERT tokenizer */
export class BertTokenizer {
    private readonly basic: BasicTokenizer;
    private readonly wordpiece: WordPieceTokenizer;
    private readonly vocab: Vocab;
    private readonly invVocab: string[];
    private readonly clsToken: string;
    private readonly sepToken: string;
    private readonly padToken: string;

    constructor(vocab: Vocab, opts?: TokenizerOptions) {
        const o = { ...DEFAULTS, ...(opts || {}) };
        this.basic = new BasicTokenizer(o);
        this.wordpiece = new WordPieceTokenizer(vocab, o);
        this.vocab = vocab;
        this.invVocab = this.buildInvVocab(vocab);
        this.clsToken = o.clsToken;
        this.sepToken = o.sepToken;
        this.padToken = o.padToken;

        for (const t of [o.unkToken, o.clsToken, o.sepToken, o.padToken]) {
            if (this.vocab[t] === undefined) {
                throw new Error(`Required special token "${t}" missing from vocab`);
            }
        }
    }

    private buildInvVocab(vocab: Vocab): string[] {
        const maxId = Math.max(...Object.values(vocab));
        const inv = new Array<string>(maxId + 1);
        for (const [tok, id] of Object.entries(vocab)) inv[id] = tok;
        return inv;
    }

    tokenize(text: string): string[] {
        const basicTokens = this.basic.tokenize(text);
        return this.wordpiece.tokenize(basicTokens);
    }

    encode(
        text: string,
        addSpecialTokens = true
    ): { inputIds: number[]; attentionMask: number[]; tokens: string[] } {
        const pieceTokens = this.tokenize(text);
        const tokens = addSpecialTokens
            ? [this.clsToken, ...pieceTokens, this.sepToken]
            : pieceTokens;

        const inputIds = tokens.map((t) =>
            this.vocab[t] !== undefined ? this.vocab[t] : this.vocab["[UNK]"]
        );
        const attentionMask = new Array(inputIds.length).fill(1);

        return { inputIds, attentionMask, tokens };
    }

    decode(ids: number[], skipSpecial = true): string {
        const toks = ids
            .map((i) => this.invVocab[i] ?? "[UNK]")
            .filter((t) => (skipSpecial ? !this.isSpecial(t) : true));

        // Stitch WordPieces: "##" pieces get merged to previous token
        const words: string[] = [];
        for (const t of toks) {
            if (t.startsWith("##") && words.length) {
                words[words.length - 1] += t.slice(2);
            } else {
                words.push(t);
            }
        }
        // This is a naive detokenization; real BERT keeps punctuation spacing rules.
        return words.join(" ").replace(/\s+([?.!,;:])/g, "$1");
    }

    pad(
        inputIds: number[],
        attentionMask: number[],
        maxLen: number
    ): { inputIds: number[]; attentionMask: number[] } {
        if (inputIds.length > maxLen) {
            return {
                inputIds: inputIds.slice(0, maxLen),
                attentionMask: attentionMask.slice(0, maxLen),
            };
        }
        const padId = this.vocab[this.padToken];
        const diff = maxLen - inputIds.length;
        return {
            inputIds: inputIds.concat(new Array(diff).fill(padId)),
            attentionMask: attentionMask.concat(new Array(diff).fill(0)),
        };
    }

    private isSpecial(t: string): boolean {
        return (
            t === "[PAD]" ||
            t === "[CLS]" ||
            t === "[SEP]" ||
            t === "[UNK]" ||
            t === "[MASK]"
        );
    }
}

/** Helper to load a JSON vocab file in browser/Node */
export async function loadVocab(input: string | Vocab): Promise<Vocab> {
    if (typeof input !== "string") return input;
    // If running in Node or modern browsers with fetch available
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to load vocab from ${input}`);
    const data = (await res.json()) as Record<string, number>;
    return data;
}
