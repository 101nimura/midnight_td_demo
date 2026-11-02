/**
 * 単一 HTML 版用の ZK 設定プロバイダ。
 * 証明鍵・検証鍵・ZKIR をビルド時に HTML 内へ base64 で埋め込み、fetch なしで供給する。
 * （通常の開発サーバ版は FetchZkConfigProvider で public/keys, public/zkir から取得）
 */
import {
  createProverKey,
  createVerifierKey,
  createZKIR,
  ZKConfigProvider,
  type ProverKey,
  type VerifierKey,
  type ZKIR,
} from '@midnight-ntwrk/midnight-js-types';

// ビルド時に data URL（base64）として取り込む。遅延 import なので開発サーバ版では読み込まれない。
const loaders = import.meta.glob(
  ['/contract/managed/tdeposit/keys/*.prover', '/contract/managed/tdeposit/keys/*.verifier', '/contract/managed/tdeposit/zkir/*.bzkir'],
  { query: '?inline', import: 'default' },
) as Record<string, () => Promise<string>>;

const decode = (dataUrl: string): Uint8Array => {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const load = async (path: string): Promise<Uint8Array> => {
  const loader = loaders[path];
  if (!loader) throw new Error(`埋め込み ZK データが見つかりません: ${path}`);
  return decode(await loader());
};

export class EmbeddedZkConfigProvider<K extends string> extends ZKConfigProvider<K> {
  getProverKey(circuitId: K): Promise<ProverKey> {
    return load(`/contract/managed/tdeposit/keys/${circuitId}.prover`).then(createProverKey);
  }
  getVerifierKey(circuitId: K): Promise<VerifierKey> {
    return load(`/contract/managed/tdeposit/keys/${circuitId}.verifier`).then(createVerifierKey);
  }
  getZKIR(circuitId: K): Promise<ZKIR> {
    return load(`/contract/managed/tdeposit/zkir/${circuitId}.bzkir`).then(createZKIR);
  }
}
