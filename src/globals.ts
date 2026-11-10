import { Buffer } from 'buffer';

// 一部ライブラリが process.env.NODE_ENV と Buffer をグローバルに参照するため、ブラウザで用意する
// （@types/node の有無で型が変わらないよう、グローバルは型を付けずに設定する）
const g = globalThis as unknown as Record<string, unknown>;
g.process = { env: { NODE_ENV: import.meta.env.MODE } };
g.Buffer = Buffer;
