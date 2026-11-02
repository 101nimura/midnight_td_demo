/**
 * ローカルシミュレータによるコントラクトの業務ロジック検証
 * （ネットワーク・証明生成なしで回路を実行する）
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, OpKind, pureCircuits, type Ledger } from '../contract/managed/tdeposit/contract/index.js';
import { witnesses, type TDepositPrivateState } from '../src/contract/index.js';

const key = (n: number) => new Uint8Array(32).fill(n);
const BANK = key(1);
const ALICE = key(2);
const BOB = key(3);
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);

class Sim {
  readonly contract = new Contract<TDepositPrivateState>(witnesses);
  ctx: CircuitContext<TDepositPrivateState>;

  constructor() {
    const init = this.contract.initialState(createConstructorContext({ secretKey: BANK }, '0'.repeat(64)), 'Demo Bank Deposit Token', 'DJPY');
    this.ctx = {
      currentPrivateState: init.currentPrivateState,
      currentZswapLocalState: init.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(init.currentContractState.data, sampleContractAddress()),
    };
  }
  as(sk: Uint8Array) {
    this.ctx.currentPrivateState = { secretKey: sk };
    return this;
  }
  call<K extends keyof Contract<TDepositPrivateState>['impureCircuits']>(name: K, ...args: unknown[]): Ledger {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = this.contract.impureCircuits[name] as any;
    this.ctx = fn(this.ctx, ...args).context;
    return this.ledger();
  }
  ledger(): Ledger {
    return ledger(this.ctx.currentQueryContext.state);
  }
  bal(sk: Uint8Array): bigint {
    const l = this.ledger();
    return l.balances.member(id(sk)) ? l.balances.lookup(id(sk)) : 0n;
  }
}

describe('Tokenized deposit contract', () => {
  let s: Sim;
  beforeEach(() => {
    s = new Sim();
    s.as(BANK).call('registerAccount', id(ALICE));
    s.as(BANK).call('registerAccount', id(BOB));
  });

  it('初期状態', () => {
    const l = s.ledger();
    expect(l.issuer).toEqual(id(BANK));
    expect(l.tokenSymbol).toBe('DJPY');
    expect(l.registered.size()).toBe(2n);
  });

  it('発行 → 移転 → 償還', () => {
    s.as(BANK).call('issue', id(ALICE), 10_000n);
    expect(s.bal(ALICE)).toBe(10_000n);
    s.as(ALICE).call('transfer', id(BOB), 3_000n);
    expect(s.bal(ALICE)).toBe(7_000n);
    expect(s.bal(BOB)).toBe(3_000n);
    s.as(BOB).call('redeem', 1_000n);
    const l = s.ledger();
    expect(s.bal(BOB)).toBe(2_000n);
    expect(l.totalSupply).toBe(9_000n);
    expect(l.totalIssued).toBe(10_000n);
    expect(l.totalRedeemed).toBe(1_000n);
    expect(l.opCount).toBe(5n);
    expect(l.history.lookup(3n).kind).toBe(OpKind.TRANSFER);
  });

  it('発行は銀行のみ', () => {
    expect(() => s.as(ALICE).call('issue', id(ALICE), 1n)).toThrow(/発行体/);
  });

  it('未登録口座への発行・移転は不可', () => {
    const CAROL = key(4);
    expect(() => s.as(BANK).call('issue', id(CAROL), 1n)).toThrow(/未登録/);
    s.as(BANK).call('issue', id(ALICE), 100n);
    expect(() => s.as(ALICE).call('transfer', id(CAROL), 1n)).toThrow(/未登録/);
  });

  it('残高不足', () => {
    s.as(BANK).call('issue', id(ALICE), 100n);
    expect(() => s.as(ALICE).call('transfer', id(BOB), 101n)).toThrow(/残高不足/);
  });

  it('他人の口座は操作できない（秘密鍵を知らない）', () => {
    s.as(BANK).call('issue', id(ALICE), 100n);
    // BOB の鍵で transfer しても ALICE の残高は動かせない（BOB の残高から引かれる）
    expect(() => s.as(BOB).call('transfer', id(ALICE), 50n)).toThrow(/残高不足/);
  });

  it('凍結中は移転・償還不可、強制移転は可能', () => {
    s.as(BANK).call('issue', id(ALICE), 500n);
    s.as(BANK).call('freezeAccount', id(ALICE));
    expect(() => s.as(ALICE).call('transfer', id(BOB), 1n)).toThrow(/凍結/);
    expect(() => s.as(ALICE).call('redeem', 1n)).toThrow(/凍結/);
    expect(() => s.as(BANK).call('issue', id(BOB), 1n) && s.as(BOB).call('transfer', id(ALICE), 1n)).toThrow(/凍結/);
    s.as(BANK).call('forceTransfer', id(ALICE), id(BOB), 200n);
    expect(s.bal(ALICE)).toBe(300n);
    expect(s.bal(BOB)).toBe(201n);
    s.as(BANK).call('unfreezeAccount', id(ALICE));
    s.as(ALICE).call('transfer', id(BOB), 1n);
    expect(s.bal(ALICE)).toBe(299n);
  });

  it('強制償還', () => {
    s.as(BANK).call('issue', id(ALICE), 500n);
    s.as(BANK).call('forceRedeem', id(ALICE), 500n);
    const l = s.ledger();
    expect(s.bal(ALICE)).toBe(0n);
    expect(l.totalSupply).toBe(0n);
    expect(l.totalRedeemed).toBe(500n);
    expect(() => s.as(ALICE).call('forceRedeem', id(BOB), 1n)).toThrow(/発行体/);
  });

  it('全体停止', () => {
    s.as(BANK).call('issue', id(ALICE), 500n);
    s.as(BANK).call('pause');
    expect(() => s.as(ALICE).call('transfer', id(BOB), 1n)).toThrow(/停止/);
    expect(() => s.as(BANK).call('issue', id(ALICE), 1n)).toThrow(/停止/);
    // 停止中でも銀行の強制移転は可能
    s.as(BANK).call('forceTransfer', id(ALICE), id(BOB), 10n);
    s.as(BANK).call('unpause');
    s.as(ALICE).call('transfer', id(BOB), 1n);
    expect(s.bal(BOB)).toBe(11n);
  });
});
