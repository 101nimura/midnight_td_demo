/**
 * ローカルシミュレータによるコントラクトの業務ロジック検証
 * （ネットワーク・証明生成なしで回路を実行する）
 *
 * compact-runtime 0.21（compactc 0.36 / ledger 9）では、コンストラクタと回路の実行が非同期になり、
 * CircuitContext は呼び出しごとに createCircuitContext で作る形になった。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  type ChargedState,
  type ContractState,
  type StateValue,
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, OpKind, pureCircuits, type Ledger } from '../contract/managed/tdeposit/contract/index.js';
import { witnesses, type TDepositPrivateState } from '../src/contract/index.js';

const key = (n: number) => new Uint8Array(32).fill(n);
const BANK = key(1);
const ALICE = key(2);
const BOB = key(3);
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);
const COIN_PK = '0'.repeat(64);
const ADDRESS = sampleContractAddress();

type CircuitName = keyof Contract<TDepositPrivateState>['impureCircuits'];

class Sim {
  readonly contract = new Contract<TDepositPrivateState>(witnesses);
  state!: StateValue | ContractState | ChargedState;
  sk: Uint8Array = BANK;

  static async create(): Promise<Sim> {
    const s = new Sim();
    const init = await s.contract.initialState(createConstructorContext({ secretKey: BANK }, COIN_PK), 'Demo Bank Deposit Token', 'DJPY');
    s.state = init.currentContractState.data;
    return s;
  }
  as(sk: Uint8Array) {
    this.sk = sk;
    return this;
  }
  async call(name: CircuitName, ...args: unknown[]): Promise<Ledger> {
    const ctx = createCircuitContext<TDepositPrivateState>({
      circuitId: name,
      contractAddress: ADDRESS,
      coinPublicKeyOrZswapState: COIN_PK,
      contractState: this.state,
      privateState: { secretKey: this.sk },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = this.contract.impureCircuits[name] as any;
    const r = await fn(ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
    return this.ledger();
  }
  ledger(): Ledger {
    return ledger(this.state as StateValue);
  }
  bal(sk: Uint8Array): bigint {
    const l = this.ledger();
    return l.balances.member(id(sk)) ? l.balances.lookup(id(sk)) : 0n;
  }
}

describe('Tokenized deposit contract', () => {
  let s: Sim;
  beforeEach(async () => {
    s = await Sim.create();
    await s.as(BANK).call('registerAccount', id(ALICE));
    await s.as(BANK).call('registerAccount', id(BOB));
  });

  it('初期状態', () => {
    const l = s.ledger();
    expect(l.issuer).toEqual(id(BANK));
    expect(l.tokenSymbol).toBe('DJPY');
    expect(l.registered.size()).toBe(2n);
  });

  it('発行 → 移転 → 償還', async () => {
    await s.as(BANK).call('issue', id(ALICE), 10_000n);
    expect(s.bal(ALICE)).toBe(10_000n);
    await s.as(ALICE).call('transfer', id(BOB), 3_000n);
    expect(s.bal(ALICE)).toBe(7_000n);
    expect(s.bal(BOB)).toBe(3_000n);
    await s.as(BOB).call('redeem', 1_000n);
    const l = s.ledger();
    expect(s.bal(BOB)).toBe(2_000n);
    expect(l.totalSupply).toBe(9_000n);
    expect(l.totalIssued).toBe(10_000n);
    expect(l.totalRedeemed).toBe(1_000n);
    expect(l.opCount).toBe(5n);
    expect(l.history.lookup(3n).kind).toBe(OpKind.TRANSFER);
  });

  it('発行は銀行のみ', async () => {
    await expect(s.as(ALICE).call('issue', id(ALICE), 1n)).rejects.toThrow(/発行体/);
  });

  it('未登録口座への発行・移転は不可', async () => {
    const CAROL = key(4);
    await expect(s.as(BANK).call('issue', id(CAROL), 1n)).rejects.toThrow(/未登録/);
    await s.as(BANK).call('issue', id(ALICE), 100n);
    await expect(s.as(ALICE).call('transfer', id(CAROL), 1n)).rejects.toThrow(/未登録/);
  });

  it('残高不足', async () => {
    await s.as(BANK).call('issue', id(ALICE), 100n);
    await expect(s.as(ALICE).call('transfer', id(BOB), 101n)).rejects.toThrow(/残高不足/);
  });

  it('他人の口座は操作できない（秘密鍵を知らない）', async () => {
    await s.as(BANK).call('issue', id(ALICE), 100n);
    // BOB の鍵で transfer しても ALICE の残高は動かせない（BOB の残高から引かれる）
    await expect(s.as(BOB).call('transfer', id(ALICE), 50n)).rejects.toThrow(/残高不足/);
  });

  it('凍結中は移転・償還不可、強制移転は可能', async () => {
    await s.as(BANK).call('issue', id(ALICE), 500n);
    await s.as(BANK).call('freezeAccount', id(ALICE));
    await expect(s.as(ALICE).call('transfer', id(BOB), 1n)).rejects.toThrow(/凍結/);
    await expect(s.as(ALICE).call('redeem', 1n)).rejects.toThrow(/凍結/);
    await s.as(BANK).call('issue', id(BOB), 1n);
    await expect(s.as(BOB).call('transfer', id(ALICE), 1n)).rejects.toThrow(/凍結/);
    await s.as(BANK).call('forceTransfer', id(ALICE), id(BOB), 200n);
    expect(s.bal(ALICE)).toBe(300n);
    expect(s.bal(BOB)).toBe(201n);
    await s.as(BANK).call('unfreezeAccount', id(ALICE));
    await s.as(ALICE).call('transfer', id(BOB), 1n);
    expect(s.bal(ALICE)).toBe(299n);
  });

  it('強制償還', async () => {
    await s.as(BANK).call('issue', id(ALICE), 500n);
    await s.as(BANK).call('forceRedeem', id(ALICE), 500n);
    const l = s.ledger();
    expect(s.bal(ALICE)).toBe(0n);
    expect(l.totalSupply).toBe(0n);
    expect(l.totalRedeemed).toBe(500n);
    await expect(s.as(ALICE).call('forceRedeem', id(BOB), 1n)).rejects.toThrow(/発行体/);
  });

  it('全体停止', async () => {
    await s.as(BANK).call('issue', id(ALICE), 500n);
    await s.as(BANK).call('pause');
    await expect(s.as(ALICE).call('transfer', id(BOB), 1n)).rejects.toThrow(/停止/);
    await expect(s.as(BANK).call('issue', id(ALICE), 1n)).rejects.toThrow(/停止/);
    // 停止中でも銀行の強制移転は可能
    await s.as(BANK).call('forceTransfer', id(ALICE), id(BOB), 10n);
    await s.as(BANK).call('unpause');
    await s.as(ALICE).call('transfer', id(BOB), 1n);
    expect(s.bal(BOB)).toBe(11n);
  });
});
