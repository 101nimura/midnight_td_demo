import { Buffer } from 'buffer';

// @ts-expect-error - 一部ライブラリが process.env.NODE_ENV を参照するため
globalThis.process = { env: { NODE_ENV: import.meta.env.MODE } };
globalThis.Buffer = Buffer;
