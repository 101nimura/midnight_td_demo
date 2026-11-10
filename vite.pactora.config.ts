/**
 * Pactora UI 版のビルド設定（npm run build:pactora → dist-pactora/）
 *   - dist-pactora/pactora-tdeposit-demo.html … 画面
 *   - dist-pactora/assets/                   … JS / CSS / WASM
 *   - dist-pactora/keys, zkir, compiler       … ZK 証明鍵・ZKIR・マニフェスト（copy-keys で public/ にコピーしたもの）
 *
 * ledger 9（midnight-js 5.0.0 / compactc 0.36）への移行で、単一 HTML（vite-plugin-singlefile）はやめた（ISSUES.md #38）。
 *   - 証明鍵が約 108MB になり、HTML に埋め込むと GitHub の 1 ファイルの上限（100MB）を超える
 *   - JS と WASM を 1 ファイルに埋め込むと、モジュールの読み込みが終わらず画面が真っ白のままになった
 * フォルダごと配信する（start-pactora.cmd / GitHub Pages）。base を './' にして、サブパスでも動くようにしている。
 */
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config';

export default mergeConfig(
  base,
  defineConfig({
    base: './',
    publicDir: 'public',
    build: {
      outDir: 'dist-pactora',
      emptyOutDir: true,
      chunkSizeWarningLimit: 100_000,
      reportCompressedSize: false,
      rolldownOptions: { input: 'pactora.html' },
    },
  }),
);
