/**
 * 単一 HTML 版のビルド設定（npm run build:single → dist-single/tdeposit-demo.html）
 * JS / CSS / WASM / ZK 鍵をすべて 1 つの HTML に埋め込む。
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
    // ZK 鍵・ZKIR をアセットとして扱い、?inline で base64 埋め込みできるようにする
    assetsInclude: ['**/*.prover', '**/*.verifier', '**/*.bzkir'],
    build: {
      outDir: 'dist-single',
      emptyOutDir: true,
      assetsInlineLimit: Number.MAX_SAFE_INTEGER,
      chunkSizeWarningLimit: 100_000,
      reportCompressedSize: false,
    },
  }),
);
