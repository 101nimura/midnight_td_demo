/**
 * トークン化預金コントラクトの操作 API（デプロイ / 参加 / 回路呼び出し / 状態購読）
 */
import { deployContract, findDeployedContract, type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { ContractState, toHex } from '@midnight-ntwrk/compact-runtime';
import { map, type Observable } from 'rxjs';
import { CompiledTDepositContract, ledger, OpKind, type TDepositContract } from '../contract';
import { PRIVATE_STATE_ID, type TDepositProviders } from './wallet';

export type AccountView = {
  accountIdHex: string;
  balance: bigint;
  frozen: boolean;
};

export type HistoryView = {
  seq: bigint;
  kind: OpKind;
  senderHex: string;
  receiverHex: string;
  amount: bigint;
};

export type TDepositState = {
  issuerHex: string;
  tokenName: string;
  tokenSymbol: string;
  totalSupply: bigint;
  totalIssued: bigint;
  totalRedeemed: bigint;
  paused: boolean;
  accounts: AccountView[];
  history: HistoryView[];
};

export type TxResult = { txId: string; txHash: string; blockHeight: number | bigint };

type Deployed = FoundContract<TDepositContract>;

export class TDepositAPI {
  readonly address: string;
  readonly state$: Observable<TDepositState>;
  /** デプロイ Tx の情報（画面表示用） */
  readonly deployTx: { txHash: string; blockHeight?: number | bigint };

  private constructor(
    private readonly deployed: Deployed,
    private readonly providers: TDepositProviders,
  ) {
    this.address = deployed.deployTxData.public.contractAddress;
    const pub = deployed.deployTxData.public as { txHash?: unknown; blockHeight?: number | bigint };
    this.deployTx = { txHash: pub.txHash === undefined ? '' : String(pub.txHash), blockHeight: pub.blockHeight };
    this.state$ = providers.publicDataProvider
      .contractStateObservable(this.address, { type: 'latest' })
      // midnight-js 5.0.0: 状態はバイト列 + era で届くので、このコントラクトの runtime（0.21）で復号する
      .pipe(map((record) => toView(ledger(record.value.contractState.deserialize({ v9: ContractState }).data))));
  }

  /** 新規デプロイ（デプロイした口座鍵が発行体＝銀行になる） */
  static async deploy(
    providers: TDepositProviders,
    issuerSecretKey: Uint8Array,
    name: string,
    symbol: string,
  ): Promise<TDepositAPI> {
    const deployed = await deployContract(providers, {
      compiledContract: CompiledTDepositContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: { secretKey: issuerSecretKey },
      args: [name, symbol],
    });
    return new TDepositAPI(deployed, providers);
  }

  /** 既存コントラクトに参加 */
  static async join(providers: TDepositProviders, address: string, secretKey: Uint8Array): Promise<TDepositAPI> {
    const deployed = await findDeployedContract<TDepositContract>(providers, {
      contractAddress: address,
      compiledContract: CompiledTDepositContract,
      privateStateId: PRIVATE_STATE_ID,
      initialPrivateState: { secretKey },
    });
    return new TDepositAPI(deployed, providers);
  }

  /** 操作する口座鍵をプライベートステートに設定（ウィットネスが参照する） */
  private async actAs(secretKey: Uint8Array) {
    await this.providers.privateStateProvider.forContract(this.address).set(PRIVATE_STATE_ID, { secretKey });
  }

  private async run(
    secretKey: Uint8Array,
    fn: (c: Deployed['callTx']) => Promise<{ public: { txId: string; txHash: string; blockHeight: number | bigint } }>,
  ): Promise<TxResult> {
    await this.actAs(secretKey);
    const r = await fn(this.deployed.callTx);
    return { txId: String(r.public.txId), txHash: String(r.public.txHash), blockHeight: r.public.blockHeight };
  }

  // ---- 発行体（銀行） ----
  registerAccount = (sk: Uint8Array, acct: Uint8Array) => this.run(sk, (c) => c.registerAccount(acct));
  issue = (sk: Uint8Array, to: Uint8Array, amount: bigint) => this.run(sk, (c) => c.issue(to, amount));
  forceTransfer = (sk: Uint8Array, from: Uint8Array, to: Uint8Array, amount: bigint) =>
    this.run(sk, (c) => c.forceTransfer(from, to, amount));
  forceRedeem = (sk: Uint8Array, from: Uint8Array, amount: bigint) => this.run(sk, (c) => c.forceRedeem(from, amount));
  freezeAccount = (sk: Uint8Array, acct: Uint8Array) => this.run(sk, (c) => c.freezeAccount(acct));
  unfreezeAccount = (sk: Uint8Array, acct: Uint8Array) => this.run(sk, (c) => c.unfreezeAccount(acct));
  pause = (sk: Uint8Array) => this.run(sk, (c) => c.pause());
  unpause = (sk: Uint8Array) => this.run(sk, (c) => c.unpause());

  // ---- 利用者 ----
  transfer = (sk: Uint8Array, to: Uint8Array, amount: bigint) => this.run(sk, (c) => c.transfer(to, amount));
  redeem = (sk: Uint8Array, amount: bigint) => this.run(sk, (c) => c.redeem(amount));
}

const toView = (l: ReturnType<typeof ledger>): TDepositState => {
  const frozen = new Set<string>();
  for (const [k] of l.frozen) frozen.add(toHex(k));
  const balances = new Map<string, bigint>();
  for (const [k, v] of l.balances) balances.set(toHex(k), v);
  const accounts: AccountView[] = [];
  for (const [k] of l.registered) {
    const h = toHex(k);
    accounts.push({ accountIdHex: h, balance: balances.get(h) ?? 0n, frozen: frozen.has(h) });
  }
  const history: HistoryView[] = [];
  for (const [seq, r] of l.history) {
    history.push({
      seq,
      kind: r.kind,
      senderHex: toHex(r.sender),
      receiverHex: toHex(r.receiver),
      amount: r.amount,
    });
  }
  history.sort((a, b) => (a.seq < b.seq ? 1 : -1));
  return {
    issuerHex: toHex(l.issuer),
    tokenName: l.tokenName,
    tokenSymbol: l.tokenSymbol,
    totalSupply: l.totalSupply,
    totalIssued: l.totalIssued,
    totalRedeemed: l.totalRedeemed,
    paused: l.paused,
    accounts,
    history,
  };
};
