/**
 * Midnight ウォレット（DApp Connector API v4：1AM / Lace）への接続と midnight-js 5.0.0（ledger 9）のプロバイダ構築
 *
 *  - 手数料の支払い・送信: ウォレットに委譲（dappConnectorWalletProviders）
 *  - 証明の生成: ウォレットに委譲（dappConnectorProofProvider）。非対応なら Proof Server を直接使う
 *  - チェーンの状態の読み取り: 公式の Preview インデクサに固定（ウォレットの接続先に左右されないように。ISSUES.md #36）
 *  - ZK 鍵・ZKIR: HTML と同じ場所の keys/ zkir/ compiler/ から取得（ledger 9 の鍵は大きく HTML に埋め込めない。ISSUES.md #38）
 */
import type { ConnectedAPI, InitialAPI } from '@midnightntwrk/dapp-connector-api';
import '@midnightntwrk/dapp-connector-api';
import {
  dappConnectorProofProvider,
  dappConnectorWalletProviders,
} from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/v9';
import type { MidnightProviders, ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import semver from 'semver';
import type { TDepositCircuitKeys, TDepositPrivateState } from '../contract';
import { inMemoryPrivateStateProvider } from './privateState';

export const PRIVATE_STATE_ID = 'tdepositPrivateState';
export type PrivateStateId = typeof PRIVATE_STATE_ID;
export type TDepositProviders = MidnightProviders<TDepositCircuitKeys, PrivateStateId, TDepositPrivateState>;

export const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID as string) || 'preview';
const COMPATIBLE_API = '4.x';

/** 公式の Preview インデクサ（2026-11-07 の再起動後のチェーン。トークン不要） */
export const INDEXER_URI = (import.meta.env.VITE_INDEXER_URI as string) || 'https://indexer.preview.midnight.network/api/v4/graphql';
export const INDEXER_WS_URI = (import.meta.env.VITE_INDEXER_WS_URI as string) || 'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

/** ウォレットの優先順（window.midnight のキー or name）。Lace の Preview の接続先が古いチェーンのままのため、1AM を優先する */
const WALLET_PREFERENCE = ['1am', 'lace'];

export type WalletInfo = {
  name: string;
  apiVersion: string;
  networkId: string;
  unshieldedAddress: string;
  shieldedAddress: string;
  dustBalance?: bigint;
  dustCap?: bigint;
  dustAddress?: string;
  unshieldedBalances?: Record<string, bigint>;
  indexerUri: string;
  proofMode: string;
};

export type Session = {
  api: ConnectedAPI;
  providers: TDepositProviders;
  info: WalletInfo;
};

/** window.midnight に注入されたウォレットから v4 互換のもの（WALLET_PREFERENCE の順）を探す */
export const findWallets = (): InitialAPI[] => {
  const m = window.midnight;
  if (!m) return [];
  return Object.values(m).filter(
    (w): w is InitialAPI =>
      !!w &&
      typeof w === 'object' &&
      'apiVersion' in w &&
      semver.satisfies(String(w.apiVersion), COMPATIBLE_API, { includePrerelease: true }),
  );
};

/**
 * エラーを人が読める文字列にする。
 * DApp Connector のエラー（APIError）は Error を継承しておらず message が空のことがあるため、
 * code / reason / cause の連鎖まで展開する。
 */
export const describeError = (e: unknown, depth = 0): string => {
  if (e === undefined || e === null) return String(e);
  if (typeof e !== 'object') return String(e);
  const o = e as { type?: unknown; code?: unknown; reason?: unknown; message?: unknown; name?: unknown; cause?: unknown };
  const parts: string[] = [];
  if (o.type === 'DAppConnectorAPIError' || o.code !== undefined) parts.push(`[${String(o.code ?? '?')}] ${String(o.reason ?? '')}`.trim());
  if (typeof o.message === 'string' && o.message && !parts.some((p) => p.includes(o.message as string))) parts.push(o.message);
  if (parts.length === 0) {
    try {
      const j = JSON.stringify(e, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
      parts.push(j && j !== '{}' ? j : `${String(o.name ?? 'Error')}（詳細なし: ${Object.prototype.toString.call(e)}）`);
    } catch {
      parts.push(String(e));
    }
  }
  if (o.cause !== undefined && depth < 4) parts.push(`← 原因: ${describeError(o.cause, depth + 1)}`);
  return parts.join(' ');
};

/** 見つからなかったときの原因を切り分けるための診断メッセージ */
const walletDiagnosis = (): string => {
  const m = window.midnight as Record<string, unknown> | undefined;
  const where = `開いている URL: ${window.location.protocol}//${window.location.host || '(ファイル)'}`;
  if (!m || Object.keys(m).length === 0) {
    const hint =
      window.location.protocol === 'file:'
        ? 'file:// で開いています。ウォレットのバージョンによっては、「ファイルの URL へのアクセスを許可する」を ON にしても file:// のページには組み込まれません。start-pactora.cmd（http://localhost:8081）/ start-single.cmd（http://localhost:8080）で開いてください。'
        : 'Midnight のウォレット（1AM / Lace）がこのページに組み込まれていません（window.midnight がありません）。拡張機能の管理 → ウォレットの「詳細」→「サイトへのアクセス」が「すべてのサイト」になっているか（特定のサイトだけを許可している場合は、この URL を追加）確認し、ページを再読み込みしてください。ウォレットを入れた・有効にした直後も再読み込みが必要です。';
    return `Midnight 対応のウォレット（1AM / Lace）が見つかりません。${hint}（${where}）`;
  }
  const found = Object.entries(m)
    .map(([k, w]) => {
      const x = (w ?? {}) as { name?: unknown; apiVersion?: unknown };
      return `${k}（name=${String(x.name ?? '?')}, apiVersion=${String(x.apiVersion ?? '?')}）`;
    })
    .join(' / ');
  return `Midnight のウォレットは見つかりましたが、このデモが対応する DApp Connector API ${COMPATIBLE_API} ではありません。見つかったウォレット: ${found}。ウォレットのバージョンを確認してください（${where}）`;
};

const waitForWallet = async (timeoutMs = 10000): Promise<InitialAPI> => {
  const started = Date.now();
  for (;;) {
    const wallets = findWallets();
    const pick =
      WALLET_PREFERENCE.map((p) => wallets.find((w) => w.name.toLowerCase().includes(p) || String(w.rdns).toLowerCase().includes(p))).find(
        Boolean,
      ) ?? wallets[0];
    if (pick) return pick;
    if (Date.now() - started > timeoutMs) throw new Error(walletDiagnosis());
    await new Promise((r) => setTimeout(r, 100));
  }
};

export const connectWallet = async (log: (msg: string) => void): Promise<Session> => {
  const initial = await waitForWallet();
  log(`ウォレット検出: ${initial.name} (API ${initial.apiVersion})`);
  const api = await initial.connect(NETWORK_ID);
  const status = await api.getConnectionStatus();
  if (status.status !== 'connected') throw new Error('ウォレットとの接続が確立できませんでした');
  if (status.networkId !== NETWORK_ID) {
    throw new Error(`ウォレットのネットワーク (${status.networkId}) が ${NETWORK_ID} ではありません。ウォレットの設定で Preview を選択してください。`);
  }
  const config = await api.getConfiguration();
  log(
    `${initial.name} の設定: node=${config.substrateNodeUri} / indexer=${config.indexerUri} / 証明サーバー=${config.proverServerUri ?? '（ウォレットは公開していません）'}`,
  );
  log(`チェーンの状態の読み取り: ${INDEXER_URI}（公式の Preview インデクサに固定）`);
  const shielded = await api.getShieldedAddresses();
  const { unshieldedAddress } = await api.getUnshieldedAddress();

  // ZK 鍵・ZKIR・マニフェスト: このページと同じ場所の keys/ zkir/ compiler/ から取得（マニフェストで改ざんを検証）
  const zkBase = new URL('.', window.location.href).href;
  const zkConfigProvider = new FetchZkConfigProvider<TDepositCircuitKeys>(zkBase, { fetchFunc: fetch.bind(window) });

  // 証明生成: 既定はウォレットに委譲。VITE_PROOF_SERVER を指定した場合、またはウォレットが非対応の場合は Proof Server を直接使用
  let proofProvider: ProofProvider;
  let proofMode: string;
  const forced = import.meta.env.VITE_PROOF_SERVER as string | undefined;
  if (forced) {
    proofProvider = httpClientProofProvider({ url: forced, zkConfigProvider });
    proofMode = `Proof Server 直接 (${forced})`;
  } else {
    try {
      proofProvider = await dappConnectorProofProvider(api, zkConfigProvider, CostModel.initialCostModel());
      proofMode = `${initial.name} に委譲`;
    } catch (e) {
      const uri = config.proverServerUri ?? 'http://localhost:6300';
      log(`ウォレットの証明生成が使えないため Proof Server を直接使用します: ${uri} (${describeError(e)})`);
      proofProvider = httpClientProofProvider({ url: uri, zkConfigProvider });
      proofMode = `Proof Server 直接 (${uri})`;
    }
  }

  // 手数料の支払い・送信はウォレットに委譲。進み具合のログと、エラーの中身を出すために API を包む
  const walletName = initial.name;
  const { walletProvider, midnightProvider } = await dappConnectorWalletProviders({
    getShieldedAddresses: () => api.getShieldedAddresses(),
    balanceUnsealedTransaction: async (tx, options) => {
      log(`${walletName} でトランザクションを承認してください（手数料 DUST の支払い）…`);
      try {
        const r = await api.balanceUnsealedTransaction(tx, options);
        log(`${walletName} の承認が完了しました`);
        return r;
      } catch (e) {
        console.error('balanceUnsealedTransaction failed', e);
        throw new Error(`${walletName} での手数料の支払い（balanceUnsealedTransaction）に失敗しました: ${describeError(e)}`, { cause: e });
      }
    },
    submitTransaction: async (tx) => {
      log('トランザクションを送信中…');
      try {
        await api.submitTransaction(tx);
      } catch (e) {
        console.error('submitTransaction failed', e);
        throw new Error(`トランザクションの送信（submitTransaction）に失敗しました: ${describeError(e)}`, { cause: e });
      }
    },
  });

  const providers: TDepositProviders = {
    privateStateProvider: inMemoryPrivateStateProvider<PrivateStateId, TDepositPrivateState>(),
    zkConfigProvider,
    proofProvider,
    publicDataProvider: indexerPublicDataProvider({ queryURL: INDEXER_URI, subscriptionURL: INDEXER_WS_URI, webSocket: window.WebSocket }),
    walletProvider,
    midnightProvider,
    config: { networkId: NETWORK_ID, ttlSeconds: 3600 },
  };

  const info: WalletInfo = {
    name: initial.name,
    apiVersion: initial.apiVersion,
    networkId: status.networkId,
    unshieldedAddress,
    shieldedAddress: shielded.shieldedAddress,
    indexerUri: INDEXER_URI,
    proofMode,
  };
  Object.assign(info, await readWalletStatus(api, log));
  return { api, providers, info };
};

/** DUST 残高・DUST アドレス・NIGHT 残高を取得（ウォレットの画面に DUST が表示されない場合の診断用） */
export const readWalletStatus = async (
  api: ConnectedAPI,
  log: (msg: string) => void,
): Promise<Pick<WalletInfo, 'dustBalance' | 'dustCap' | 'dustAddress' | 'unshieldedBalances'>> => {
  const r: Pick<WalletInfo, 'dustBalance' | 'dustCap' | 'dustAddress' | 'unshieldedBalances'> = {};
  try {
    const dust = await api.getDustBalance();
    r.dustBalance = dust.balance;
    r.dustCap = dust.cap;
  } catch (e) {
    log(`getDustBalance 失敗: ${String(e)}`);
  }
  try {
    r.dustAddress = (await api.getDustAddress()).dustAddress;
  } catch (e) {
    log(`getDustAddress 失敗: ${String(e)}`);
  }
  try {
    r.unshieldedBalances = await api.getUnshieldedBalances();
  } catch (e) {
    log(`getUnshieldedBalances 失敗: ${String(e)}`);
  }
  log(
    `DUST 残高=${r.dustBalance ?? '?'} / 上限=${r.dustCap ?? '?'} / NIGHT(unshielded)=${JSON.stringify(
      r.unshieldedBalances ?? {},
      (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
    )}`,
  );
  return r;
};
