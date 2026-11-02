/**
 * Lace ウォレット（DApp Connector API v4）への接続と midnight-js プロバイダ構築
 */
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import '@midnight-ntwrk/dapp-connector-api';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { createProofProvider, type MidnightProviders, type UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import {
  type Binding,
  type FinalizedTransaction,
  type Proof,
  type SignatureEnabled,
  Transaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { fromHex, toHex } from '@midnight-ntwrk/compact-runtime';
import semver from 'semver';
import type { TDepositCircuitKeys, TDepositPrivateState } from '../contract';
import { inMemoryPrivateStateProvider } from './privateState';
import { EmbeddedZkConfigProvider } from './embeddedZk';

export const PRIVATE_STATE_ID = 'tdepositPrivateState';
export type PrivateStateId = typeof PRIVATE_STATE_ID;
export type TDepositProviders = MidnightProviders<TDepositCircuitKeys, PrivateStateId, TDepositPrivateState>;

export const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID as string) || 'preview';
const COMPATIBLE_API = '4.x';

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

/** window.midnight に注入されたウォレットから v4 互換のもの（Lace を優先）を探す */
export const findWallets = (): InitialAPI[] => {
  const m = window.midnight;
  if (!m) return [];
  return Object.values(m).filter(
    (w): w is InitialAPI =>
      !!w && typeof w === 'object' && 'apiVersion' in w && semver.satisfies(String(w.apiVersion), COMPATIBLE_API),
  );
};

const waitForWallet = async (timeoutMs = 3000): Promise<InitialAPI> => {
  const started = Date.now();
  for (;;) {
    const wallets = findWallets();
    const lace = wallets.find((w) => /lace/i.test(w.name) || /lace/i.test(w.rdns)) ?? wallets[0];
    if (lace) return lace;
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        'Midnight 対応の Lace ウォレットが見つかりません。Lace 拡張機能がインストール・有効化されているか確認してください。',
      );
    }
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
    throw new Error(`ウォレットのネットワーク (${status.networkId}) が ${NETWORK_ID} ではありません。Lace の設定で Preview を選択してください。`);
  }
  const config = await api.getConfiguration();
  const shielded = await api.getShieldedAddresses();
  const { unshieldedAddress } = await api.getUnshieldedAddress();

  // ZK 鍵・ZKIR: 単一 HTML 版は HTML に埋め込み済みのデータ、開発サーバ版は public/keys, public/zkir から取得
  const zkConfigProvider = import.meta.env.VITE_EMBED_ZK
    ? new EmbeddedZkConfigProvider<TDepositCircuitKeys>()
    : new FetchZkConfigProvider<TDepositCircuitKeys>(window.location.origin, fetch.bind(window));

  // 証明生成: 既定は Lace に委譲（Lace で設定された Proof Server を使用）
  //           VITE_PROOF_SERVER を指定した場合はその Proof Server を直接使用
  let proofProvider;
  let proofMode: string;
  const forced = import.meta.env.VITE_PROOF_SERVER as string | undefined;
  if (forced) {
    proofProvider = httpClientProofProvider(forced, zkConfigProvider);
    proofMode = `Proof Server 直接 (${forced})`;
  } else {
    try {
      const provingProvider = await api.getProvingProvider(zkConfigProvider);
      proofProvider = createProofProvider(provingProvider);
      proofMode = 'Lace ウォレットに委譲';
    } catch (e) {
      const uri = config.proverServerUri ?? 'http://localhost:6300';
      log(`getProvingProvider 非対応のため Proof Server を直接使用します: ${uri} (${String(e)})`);
      proofProvider = httpClientProofProvider(uri, zkConfigProvider);
      proofMode = `Proof Server 直接 (${uri})`;
    }
  }

  const providers: TDepositProviders = {
    privateStateProvider: inMemoryPrivateStateProvider<PrivateStateId, TDepositPrivateState>(),
    zkConfigProvider,
    proofProvider,
    publicDataProvider: indexerPublicDataProvider(config.indexerUri, config.indexerWsUri, window.WebSocket),
    walletProvider: {
      getCoinPublicKey: () => shielded.shieldedCoinPublicKey,
      getEncryptionPublicKey: () => shielded.shieldedEncryptionPublicKey,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        log('Lace でトランザクションを承認してください（手数料 DUST の支払い）…');
        const res = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>('signature', 'proof', 'binding', fromHex(res.tx));
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        log('トランザクションを送信中…');
        await api.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };

  const info: WalletInfo = {
    name: initial.name,
    apiVersion: initial.apiVersion,
    networkId: status.networkId,
    unshieldedAddress,
    shieldedAddress: shielded.shieldedAddress,
    indexerUri: config.indexerUri,
    proofMode,
  };
  Object.assign(info, await readWalletStatus(api, log));
  return { api, providers, info };
};

/** DUST 残高・DUST アドレス・NIGHT 残高を取得（Lace の画面に DUST が表示されない場合の診断用） */
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
