import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

// Midnight の WASM モジュール（ledger / onchain-runtime）をブラウザで動かすための設定
// （公式 example-bboard の設定をベースに簡略化）
export default defineConfig({
  cacheDir: './.vite',
  build: {
    target: 'esnext',
    minify: false,
    commonjsOptions: { transformMixedEsModules: true, extensions: ['.js', '.cjs'], ignoreDynamicRequires: true },
  },
  plugins: [react(), wasm()],
  optimizeDeps: {
    rolldownOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
      platform: 'browser',
      format: 'esm',
      loader: { '.wasm': 'binary' },
    },
    include: ['@midnight-ntwrk/compact-runtime'],
    exclude: [
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm_bg.wasm',
      '@midnight-ntwrk/onchain-runtime-v3/midnight_onchain_runtime_wasm.js',
      '@midnightntwrk/onchain-runtime-v4',
      '@midnightntwrk/ledger-v9',
    ],
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
    // WASM を含むパッケージが二重に読み込まれると instanceof が失敗するため 1 つにまとめる（midnight-js docs/guides/vite-wasm-resolution.md）
    dedupe: ['@midnight-ntwrk/compact-runtime', '@midnightntwrk/onchain-runtime-v4', '@midnightntwrk/ledger-v9', '@midnight-ntwrk/onchain-runtime-v3'],
  },
  checks: { importIsUndefined: false },
  // /mnt/c 上のファイルは WSL から inotify で検知できないためポーリング監視にする
  server: { port: 5173, strictPort: true, watch: { usePolling: true, interval: 500 } },
});
