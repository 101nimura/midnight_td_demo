/**
 * DUST 生成先指定（designation）ツール
 * ---------------------------------------------------------------------------
 * Lace の画面から「Generate tDUST」ができない場合の代替手段。
 *
 *  1. デモ専用ウォレット（このツール専用のシード）を作成／再利用
 *  2. Preview Faucet から tNIGHT を自動取得（失敗時は表示アドレスへ手動で Faucet）
 *  3. その tNIGHT の UTXO を「DUST 生成」に登録し、DUST の受取先を
 *     ★Lace の DUST アドレス★ にする
 *
 * → Lace のリカバリーフレーズは不要。Lace 側に DUST が蓄積され、DApp の手数料を払えるようになる。
 *
 * 使い方（WSL 内）:
 *   npm start -- <Lace の DUST アドレス (mn_dust_preview1...)>
 *
 * シードは tools/dust/.demo-wallet-seed に保存（デモ専用。本番用途に使わないこと）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { pino } from 'pino';
import * as Rx from 'rxjs';
import { FaucetClient, FluentWalletBuilder, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  DustSecretKey,
  LedgerParameters,
  unshieldedToken,
  ZswapSecretKeys,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { DustAddress, MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import type { FacadeState, WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';

const NETWORK = 'preview';
const SEED_FILE = path.resolve(import.meta.dirname, '.demo-wallet-seed');

const env: EnvironmentConfiguration = {
  walletNetworkId: NETWORK,
  networkId: NETWORK,
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  nodeWS: 'wss://rpc.preview.midnight.network',
  proofServer: process.env.PROOF_SERVER ?? 'http://localhost:6300',
  faucet: 'https://midnight-tmnight-preview.nethermind.dev/',
};

const log = pino({ transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } });

const isComplete = (p: unknown) =>
  !!p && typeof (p as { isStrictlyComplete?: unknown }).isStrictlyComplete === 'function'
    ? (p as { isStrictlyComplete: () => boolean }).isStrictlyComplete()
    : false;
const isSynced = (s: FacadeState) =>
  isComplete(s.shielded.state.progress) && isComplete(s.dust.state.progress) && isComplete(s.unshielded.progress);

const main = async () => {
  const target = process.argv[2]?.trim();
  const fundOnly = target === '--fund-only';
  if (!target || (!fundOnly && !target.startsWith('mn_dust_'))) {
    console.error('使い方: npm start -- <Lace の DUST アドレス (mn_dust_preview1...)>   または  npm start -- --fund-only');
    process.exit(1);
  }
  setNetworkId(NETWORK);
  const receiver = fundOnly ? undefined : DustAddress.codec.decode(NETWORK, MidnightBech32m.parse(target));
  log.info(fundOnly ? '入金のみモード（DUST 登録は行いません）' : `DUST の受取先（Lace）: ${target}`);

  // 1. デモ専用ウォレット
  const savedSeed = fs.existsSync(SEED_FILE) ? fs.readFileSync(SEED_FILE, 'utf8').trim() : undefined;
  const builder = FluentWalletBuilder.forEnvironment(env).withDustOptions({
    ledgerParams: LedgerParameters.initialParameters(),
    additionalFeeOverhead: 1_000n,
    feeBlocksMargin: 5,
  });
  const built = (await (savedSeed ? builder.withSeed(savedSeed) : builder.withRandomSeed()).buildWithoutStarting()) as unknown as {
    wallet: WalletFacade;
    seeds: { masterSeed: string; shielded: Uint8Array; dust: Uint8Array };
    keystore: { getPublicKey(): unknown; signData(payload: Uint8Array): string };
  };
  const { wallet, seeds, keystore } = built;
  if (!savedSeed) {
    fs.writeFileSync(SEED_FILE, seeds.masterSeed, { mode: 0o600 });
    log.info(`新しいデモ専用ウォレットを作成し、シードを ${SEED_FILE} に保存しました`);
  } else {
    log.info('保存済みのデモ専用ウォレットを使用します');
  }

  await wallet.start(ZswapSecretKeys.fromSeed(seeds.shielded), DustSecretKey.fromSeed(seeds.dust));
  try {
    const first = await Rx.firstValueFrom(wallet.unshielded.state);
    const myAddress = UnshieldedAddress.codec.encode(NETWORK, first.address).toString();
    log.info(`デモ専用ウォレットの tNIGHT アドレス: ${myAddress}`);

    // 2. 同期 & 残高確認（無ければ Faucet）
    log.info('ウォレットを同期中…（数分かかることがあります）');
    let state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter(isSynced)));
    const night = unshieldedToken().raw;
    if ((state.unshielded.balances[night] ?? 0n) === 0n) {
      log.info('tNIGHT 残高が 0 のため Faucet に請求します…');
      try {
        await new FaucetClient(env.faucet!, log).requestTokens(myAddress);
      } catch (e) {
        log.warn(`Faucet の自動請求に失敗しました: ${String(e)}`);
        log.warn(`ブラウザで Faucet を開き、上記アドレス ${myAddress} 宛てに tNIGHT を請求してください（このまま待機します）`);
      }
      log.info('tNIGHT の着金を待っています…');
      state = await Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.throttleTime(3000),
          Rx.filter((s) => isSynced(s) && (s.unshielded.balances[night] ?? 0n) > 0n),
        ),
      );
    }
    log.info(`tNIGHT 残高: ${state.unshielded.balances[night]}`);
    if (fundOnly || !receiver) return;

    // 3. DUST 生成登録（受取先 = Lace）
    const utxos = state.unshielded.availableCoins.filter((c) => !c.meta.registeredForDustGeneration);
    if (utxos.length === 0) {
      log.info('未登録の tNIGHT UTXO がありません（既に登録済み）。Lace 側で DUST が増えているか確認してください。');
      return;
    }
    const { fee } = await wallet.estimateRegistration(utxos);
    log.info(`登録トランザクションの手数料見積り: ${fee}（登録する tNIGHT から生成される DUST で支払われます）`);
    if (fee > 0n) {
      log.info('手数料分の DUST が生成されるまで待機します…');
      await wallet.waitForGeneratedDust(utxos, fee, { timeoutMs: 600_000 });
    }
    log.info(`${utxos.length} 個の UTXO を DUST 生成に登録します（ZK 証明を生成中…）`);
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      utxos,
      keystore.getPublicKey() as never,
      (payload) => keystore.signData(payload) as never,
      receiver,
    );
    const tx = await wallet.finalizeRecipe(recipe);
    const txId = await wallet.submitTransaction(tx);
    log.info(`登録トランザクションを送信しました: ${txId}`);
    log.info('数分後から Lace の DUST アドレスに DUST が蓄積されます。デモ画面の「DUST: 再取得」で確認してください。');
  } finally {
    await wallet.stop();
  }
};

main().then(
  () => process.exit(0),
  (e) => {
    log.error(e instanceof Error ? (e.stack ?? e.message) : String(e));
    process.exit(1);
  },
);
