/**
 * Pactora UI 版 単一 HTML のビルド設定（npm run build:pactora → dist-pactora/pactora-tdeposit-demo.html）
 * 既存の単一 HTML 版（vite.single.config.ts）と同じく、JS / CSS / WASM / ZK 鍵をすべて 1 つの HTML に埋め込む。
 */
import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import base from './vite.config';

export default mergeConfig(
  base,
  defineConfig({
    mode: 'single',
    plugins: [viteSingleFile({ removeViteModuleLoader: true })],
    publicDir: false,
    assetsInclude: ['**/*.prover', '**/*.verifier', '**/*.bzkir'],
    build: {
      outDir: 'dist-pactora',
      emptyOutDir: true,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      chunkSizeWarningLimit: 100_000,
      reportCompressedSize: false,
      rolldownOptions: { input: 'pactora.html' },
    },
  }),
);
