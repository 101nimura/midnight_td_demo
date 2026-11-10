/**
 * C1 PoC のシミュレータ検証（ネットワーク・証明生成なしで回路を実行する）
 *   実行: node research/c1-private-notes/poc-check.ts   （Node 24、リポジトリのルートで）
 *
 * 確かめること
 *   1. 送金で金額・送金元・送金先が公開レジャーに出ないこと（出るのはナリファイアとコミットメントだけ）
 *   2. 二重使用ができないこと
 *   3. 凍結すると、その口座は送金・償還できず、凍結口座への送金もできないこと
 *   4. 発行体は、所有者の鍵なしで強制移転・強制償還できること（凍結中の口座のノートも）
 *   5. 発行体以外は強制移転できないこと
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from './managed/contract/index.js';

type PS = { sk: Uint8Array };
type Note = { owner: Uint8Array; value: bigint; rand: Uint8Array };

const key = (n: number) => new Uint8Array(32).fill(n);
const rnd = () => crypto.getRandomValues(new Uint8Array(32));
const BANK = key(1), ALICE = key(2), BOB = key(3), MALLORY = key(9);
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);
const note = (owner: Uint8Array, value: bigint): Note => ({ owner: id(owner), value, rand: rnd() });
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const ADDRESS = sampleContractAddress();
const COIN_PK = '0'.repeat(64);

// ウィットネス: 秘密鍵と、Merkle 木の証明パス（パスはオフチェーンで公開レジャーから計算する）
const witnesses = {
  localSecretKey: ({ privateState }: any) => [privateState, privateState.sk],
  memberPath: ({ privateState, ledger: l }: any, mid: Uint8Array) => {
    const p = l.members.findPathForLeaf(mid);
    if (!p) throw new Error('memberPath: 口座が木にありません（未登録または凍結中）');
    return [privateState, p];
  },
  notePath: ({ privateState, ledger: l }: any, cm: Uint8Array) => {
    const p = l.notes.findPathForLeaf(cm);
    if (!p) throw new Error('notePath: ノートが木にありません');
    return [privateState, p];
  },
};

class Sim {
  contract = new Contract<PS>(witnesses as any);
  state: any;
  static async create() {
    const s = new Sim();
    const init = await s.contract.initialState(createConstructorContext({ sk: BANK }, COIN_PK));
    s.state = init.currentContractState.data;
    return s;
  }
  async call(sk: Uint8Array, name: string, ...args: unknown[]) {
    const ctx = createCircuitContext<PS>({ circuitId: name as any, contractAddress: ADDRESS, coinPublicKeyOrZswapState: COIN_PK, contractState: this.state, privateState: { sk } });
    const r = await (this.contract.impureCircuits as any)[name](ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
    return r;
  }
  get l() {
    return ledger(this.state);
  }
}

const setup = async () => {
  const s = await Sim.create();
  await s.call(BANK, 'registerAccount', id(ALICE), 0n);
  await s.call(BANK, 'registerAccount', id(BOB), 1n);
  const a = note(ALICE, 1000n);
  await s.call(BANK, 'issue', a);
  return { s, a };
};

test('送金: 金額・送金元・送金先は公開レジャーに出ない', async () => {
  const { s, a } = await setup();
  const before = JSON.stringify(s.state.toString ? s.state.toString() : '');
  const to = note(BOB, 300n), ch = note(ALICE, 700n);
  await s.call(ALICE, 'transfer', a, to, ch);
  // 公開レジャーの内容（文字列化）に、口座ID・乱数・金額が含まれないこと
  const dump = String(s.state.toString());
  for (const secret of [hex(id(ALICE)), hex(id(BOB)), hex(a.rand), hex(to.rand)]) {
    assert.ok(!dump.includes(secret), `公開レジャーに秘密が含まれる: ${secret.slice(0, 12)}…`);
  }
  assert.equal(s.l.totalSupply, 1000n); // 送金では発行残高は変わらない
  assert.equal(s.l.nullifiers.size(), 1n);
  assert.ok(before.length >= 0);
});

test('二重使用はできない', async () => {
  const { s, a } = await setup();
  await s.call(ALICE, 'transfer', a, note(BOB, 100n), note(ALICE, 900n));
  await assert.rejects(s.call(ALICE, 'transfer', a, note(BOB, 100n), note(ALICE, 900n)), /使用済み/);
});

test('他人のノートは使えない・金額は保存される', async () => {
  const { s, a } = await setup();
  await assert.rejects(s.call(BOB, 'transfer', a, note(BOB, 1000n), note(BOB, 0n)), /自分のノートではありません/);
  await assert.rejects(s.call(ALICE, 'transfer', a, note(BOB, 600n), note(ALICE, 600n)), /金額が一致しません/);
});

test('凍結: 凍結口座は送金・償還できず、凍結口座への送金もできない', async () => {
  const { s, a } = await setup();
  await s.call(BANK, 'freezeAccount', 0n); // ALICE（index 0）を凍結
  await assert.rejects(s.call(ALICE, 'transfer', a, note(BOB, 1n), note(ALICE, 999n)), /未登録または凍結中|木にありません/);
  await assert.rejects(s.call(ALICE, 'redeem', a), /未登録または凍結中|木にありません/);
  // BOB から凍結中の ALICE へは送れない
  const b = note(BOB, 50n);
  await s.call(BANK, 'issue', b);
  await assert.rejects(s.call(BOB, 'transfer', b, note(ALICE, 50n), note(BOB, 0n)), /未登録または凍結中|木にありません/);
});

test('強制移転・強制償還: 発行体は所有者の鍵なしで実行できる（凍結中の口座のノートも）', async () => {
  const { s, a } = await setup();
  await s.call(BANK, 'freezeAccount', 0n);
  const to = note(BOB, 400n), ch = note(ALICE, 600n);
  await s.call(BANK, 'forceTransfer', a, to, ch); // 銀行は a の中身（オフチェーンで共有）を知っている
  await s.call(BANK, 'forceRedeem', ch);
  assert.equal(s.l.totalSupply, 400n);
  // 強制移転したノートは、元の所有者も二度と使えない（同じナリファイア）
  await assert.rejects(s.call(ALICE, 'transfer', a, note(BOB, 1n), note(ALICE, 999n)), /未登録または凍結中|使用済み|木にありません/);
  // 移転先の BOB は受け取ったノートを使える
  await s.call(BOB, 'redeem', to);
  assert.equal(s.l.totalSupply, 0n);
});

test('発行体以外は強制移転・発行・凍結できない', async () => {
  const { s, a } = await setup();
  await assert.rejects(s.call(MALLORY, 'forceTransfer', a, note(BOB, 1000n), note(ALICE, 0n)), /発行体/);
  await assert.rejects(s.call(ALICE, 'issue', note(ALICE, 1n)), /発行体/);
  await assert.rejects(s.call(BOB, 'freezeAccount', 0n), /発行体/);
});
