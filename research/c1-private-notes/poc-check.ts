/**
 * C1 PoC のシミュレータ検証（ネットワーク・証明生成なしで回路を実行する）
 *   実行: node research/c1-private-notes/poc-check.ts   （Node 24、リポジトリのルートで）
 *
 * 確かめること（C1_PRIVACY_STUDY.md 5.2 の番号）
 *   1. 送金で金額・送金元・送金先・乱数が公開レジャーに出ないこと（出るのはナリファイア・コミットメント・暗号文）
 *   2. 二重使用ができないこと
 *   3. 他人のノートは使えず、金額の水増しができないこと
 *   4. 凍結すると、その口座は送金・償還できず、凍結口座への送金もできないこと
 *   5. 発行体は、所有者の鍵なしで強制移転・強制償還できること（凍結中の口座のノートも）
 *   6. 発行体以外は強制移転・発行・凍結できないこと
 *   7. ノートの中身は暗号文として公開され、受取人と銀行だけが復号できること（オフチェーンでの共有なし）
 *   9. 口座の葉はコミットメントで、口座ID から登録済みかどうかを確かめられないこと
 *  10. 受取人の暗号化用公開鍵をすり替えた送金はできないこと
 *  11. 乱数を使い回して「使用済みと同じナリファイアになるノート」を作れないこと
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits, type Member, type Note } from './managed/contract/index.js';

type PS = { sk: Uint8Array };

// BLS12-381 のスカラー体（Field）と Jubjub のスカラー体の位数
const FIELD_P = 52435875175126190479447740508185965837690552500527637822603658699938581184513n;
const JUBJUB_R = 6554484396890773809930967563523245729705921265872317281365359162392183254199n;

const key = (n: number) => new Uint8Array(32).fill(n);
const rnd = () => crypto.getRandomValues(new Uint8Array(32));
const rndMod = (m: bigint) => BigInt('0x' + Buffer.from(crypto.getRandomValues(new Uint8Array(48))).toString('hex')) % m;
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);
const ADDRESS = sampleContractAddress();
const COIN_PK = '0'.repeat(64);

// 利用者（口座）: 署名用の秘密鍵 sk、暗号化用の秘密鍵 encSk、口座の葉の中身 member
type Party = { sk: Uint8Array; encSk: bigint; member: Member };
const party = (n: number): Party => {
  const sk = key(n), encSk = rndMod(JUBJUB_R);
  return { sk, encSk, member: { id: id(sk), encPk: pureCircuits.encPkOf(encSk), salt: rnd() } };
};
const BANK = party(1), ALICE = party(2), BOB = party(3), MALLORY = party(9);
const note = (owner: Party, value: bigint): Note => ({ owner: owner.member.id, value, rand: rndMod(FIELD_P) });

// ウィットネス: 秘密鍵、Merkle 木の証明パス（オフチェーンで公開レジャーから計算する）、暗号化の一時秘密鍵
const witnesses = {
  localSecretKey: ({ privateState }: any) => [privateState, privateState.sk],
  memberPath: ({ privateState, ledger: l }: any, leaf: Uint8Array) => {
    const p = l.members.findPathForLeaf(leaf);
    if (!p) throw new Error('memberPath: 口座が木にありません（未登録または凍結中）');
    return [privateState, p];
  },
  notePath: ({ privateState, ledger: l }: any, cm: Uint8Array) => {
    const p = l.notes.findPathForLeaf(cm);
    if (!p) throw new Error('notePath: ノートが木にありません');
    return [privateState, p];
  },
  ephemeralKey: ({ privateState }: any) => [privateState, rndMod(JUBJUB_R)],
};

class Sim {
  contract = new Contract<PS>(witnesses as any);
  state: any;
  static async create() {
    const s = new Sim();
    const init = await s.contract.initialState(createConstructorContext({ sk: BANK.sk }, COIN_PK), BANK.member.encPk);
    s.state = init.currentContractState.data;
    return s;
  }
  async call(who: Party, name: string, ...args: unknown[]) {
    const ctx = createCircuitContext<PS>({ circuitId: name as any, contractAddress: ADDRESS, coinPublicKeyOrZswapState: COIN_PK, contractState: this.state, privateState: { sk: who.sk } });
    const r = await (this.contract.impureCircuits as any)[name](ctx, ...args);
    this.state = r.context.callContext.currentQueryContext.state;
    return r;
  }
  get l() {
    return ledger(this.state);
  }
}

// ---------------- 復号（ウォレット側・銀行側の処理） ----------------

// 暗号文 → ノート。所有者の印とコミットメントが一致したものだけを返す
const tryOpen = (encSk: bigint, cm: Uint8Array, epk: any, c: bigint[], owners: Uint8Array[]): Note | undefined => {
  const [tag, value, rand] = pureCircuits.decrypt(encSk, epk, c);
  const owner = owners.find((o) => pureCircuits.ownerTag(o) === tag);
  if (!owner || value >= 1n << 64n) return undefined;
  const n: Note = { owner, value, rand };
  return hex(pureCircuits.noteCommitment(n)) === hex(cm) ? n : undefined;
};
const unspent = (s: Sim, n: Note) => !s.l.nullifiers.member(pureCircuits.nullifierOf(n));

// 利用者のウォレット: 公開された暗号文を試しに復号し、自分宛ての未使用ノートを見つける
const scanWallet = (s: Sim, p: Party): Note[] => {
  const found: Note[] = [];
  for (const [cm, c] of s.l.ciphers) {
    const n = tryOpen(p.encSk, cm, c.epk, c.toOwner, [p.member.id]);
    if (n && unspent(s, n)) found.push(n);
  }
  return found;
};

// 銀行: すべての暗号文を復号し、口座ごとの未使用ノート（= 残高）を把握する
const scanBank = (s: Sim, accounts: Party[]): Note[] => {
  const all: Note[] = [];
  for (const [cm, c] of s.l.ciphers) {
    const n = tryOpen(BANK.encSk, cm, c.epk, c.toBank, accounts.map((a) => a.member.id));
    assert.ok(n, '銀行が復号できない暗号文がある');
    if (unspent(s, n)) all.push(n);
  }
  return all;
};
const balance = (notes: Note[], p: Party) => notes.filter((n) => hex(n.owner) === hex(p.member.id)).reduce((a, n) => a + n.value, 0n);

const setup = async () => {
  const s = await Sim.create();
  await s.call(BANK, 'registerAccount', pureCircuits.memberLeaf(ALICE.member), 0n);
  await s.call(BANK, 'registerAccount', pureCircuits.memberLeaf(BOB.member), 1n);
  await s.call(BANK, 'issue', note(ALICE, 1000n), ALICE.member);
  const [a] = scanWallet(s, ALICE); // ALICE は発行されたノートを暗号文から受け取る
  assert.equal(a.value, 1000n);
  return { s, a };
};

test('#1 送金: 金額・送金元・送金先・乱数は公開レジャーに出ない', async () => {
  const { s, a } = await setup();
  const to = note(BOB, 300n), ch = note(ALICE, 700n);
  const r = await s.call(ALICE, 'transfer', a, ALICE.member, to, BOB.member, ch);
  const dump = String(s.state.toString());
  // チェーンに載るのは publicTranscript（input・privateTranscriptOutputs は証明の生成に手元でだけ使う）
  const transcript = JSON.stringify([r.context.callProofDataTrace].flat()[0].publicTranscript, (_k, v) => (typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? hex(v) : v));
  const le = (x: bigint) => Buffer.from(x.toString(16).padStart(64, '0'), 'hex').reverse().toString('hex');
  const secrets = {
    senderId: hex(ALICE.member.id), receiverId: hex(BOB.member.id), salt: hex(BOB.member.salt),
    inRand: a.rand.toString(), inRandBytes: le(a.rand), toRand: to.rand.toString(), toRandBytes: le(to.rand),
  };
  for (const [k, v] of Object.entries(secrets)) {
    assert.ok(!dump.includes(v), `公開レジャーに ${k} が含まれる`);
    assert.ok(!transcript.includes(v), `公開部分に ${k} が含まれる`);
  }
  // 金額が平文の数値として出ないこと（16 進文字列の一部に偶然含まれる場合は除く）
  for (const amt of ['300', '700', '1000']) assert.ok(!new RegExp(`(^|[^0-9a-f])${amt}([^0-9a-f]|$)`).test(transcript), `公開部分に金額 ${amt} が含まれる`);
  assert.equal(s.l.totalSupply, 1000n); // 送金では発行残高は変わらない
  assert.equal(s.l.nullifiers.size(), 1n);
  assert.equal(s.l.ciphers.size(), 3n); // 発行 1 + 送金先 1 + おつり 1
});

test('#2 二重使用はできない', async () => {
  const { s, a } = await setup();
  await s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 100n), BOB.member, note(ALICE, 900n));
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 100n), BOB.member, note(ALICE, 900n)), /使用済み/);
});

test('#3 他人のノートは使えない・金額は保存される', async () => {
  const { s, a } = await setup();
  await assert.rejects(s.call(BOB, 'transfer', a, BOB.member, note(BOB, 1000n), BOB.member, note(BOB, 0n)), /自分のノートではありません/);
  await assert.rejects(s.call(BOB, 'transfer', a, ALICE.member, note(BOB, 1000n), BOB.member, note(ALICE, 0n)), /自分の口座ではありません/);
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 600n), BOB.member, note(ALICE, 600n)), /金額が一致しません/);
});

test('#4 凍結: 凍結口座は送金・償還できず、凍結口座への送金もできない', async () => {
  const { s, a } = await setup();
  await s.call(BANK, 'freezeAccount', 0n); // ALICE（index 0）を凍結
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 1n), BOB.member, note(ALICE, 999n)), /未登録または凍結中|木にありません/);
  await assert.rejects(s.call(ALICE, 'redeem', a, ALICE.member), /未登録または凍結中|木にありません/);
  // BOB から凍結中の ALICE へは送れない
  await s.call(BANK, 'issue', note(BOB, 50n), BOB.member);
  const [b] = scanWallet(s, BOB);
  await assert.rejects(s.call(BOB, 'transfer', b, BOB.member, note(ALICE, 50n), ALICE.member, note(BOB, 0n)), /未登録または凍結中|木にありません/);
  // 凍結中の口座には発行もできない
  await assert.rejects(s.call(BANK, 'issue', note(ALICE, 1n), ALICE.member), /未登録または凍結中|木にありません/);
});

test('#5 強制移転・強制償還: 銀行は復号したノートで、所有者の鍵なしに実行できる（凍結中の口座のノートも）', async () => {
  const { s } = await setup();
  await s.call(BANK, 'freezeAccount', 0n);
  // 銀行は公開された暗号文だけから ALICE のノートを知る（オフチェーンでの共有なし）
  const [a] = scanBank(s, [ALICE, BOB]).filter((n) => hex(n.owner) === hex(ALICE.member.id));
  const to = note(BOB, 400n), ch = note(ALICE, 600n);
  await s.call(BANK, 'forceTransfer', a, to, BOB.member, ch, ALICE.member.encPk);
  const [chFound] = scanBank(s, [ALICE, BOB]).filter((n) => hex(n.owner) === hex(ALICE.member.id));
  await s.call(BANK, 'forceRedeem', chFound);
  assert.equal(s.l.totalSupply, 400n);
  // 強制移転したノートは、元の所有者も二度と使えない（同じナリファイア）
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 1n), BOB.member, note(ALICE, 999n)), /未登録または凍結中|使用済み|木にありません/);
  // 移転先の BOB は、受け取ったノートを暗号文から見つけて使える
  const [b] = scanWallet(s, BOB);
  assert.equal(b.value, 400n);
  await s.call(BOB, 'redeem', b, BOB.member);
  assert.equal(s.l.totalSupply, 0n);
});

test('#6 発行体以外は強制移転・発行・凍結・口座登録できない', async () => {
  const { s, a } = await setup();
  await assert.rejects(s.call(MALLORY, 'forceTransfer', a, note(BOB, 1000n), BOB.member, note(ALICE, 0n), ALICE.member.encPk), /発行体/);
  await assert.rejects(s.call(ALICE, 'issue', note(ALICE, 1n), ALICE.member), /発行体/);
  await assert.rejects(s.call(BOB, 'freezeAccount', 0n), /発行体/);
  await assert.rejects(s.call(MALLORY, 'registerAccount', pureCircuits.memberLeaf(MALLORY.member), 2n), /発行体/);
});

test('#7 暗号文: 受取人と銀行だけが復号でき、残高を把握できる', async () => {
  const { s, a } = await setup();
  await s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 300n), BOB.member, note(ALICE, 700n));
  // 受取人: 自分宛てのノートだけが見つかる
  assert.deepEqual(scanWallet(s, BOB).map((n) => n.value), [300n]);
  assert.deepEqual(scanWallet(s, ALICE).map((n) => n.value), [700n]); // おつりも暗号文から復元できる
  assert.deepEqual(scanWallet(s, MALLORY), []); // 第三者には何も見つからない
  // 銀行: 全口座の残高を把握できる
  const bankView = scanBank(s, [ALICE, BOB]);
  assert.equal(balance(bankView, ALICE), 700n);
  assert.equal(balance(bankView, BOB), 300n);
  // 受取人宛ての暗号文は、銀行の鍵でも第三者の鍵でも開けられない（逆も同じ）
  for (const [cm, c] of s.l.ciphers) {
    assert.equal(tryOpen(MALLORY.encSk, cm, c.epk, c.toOwner, [ALICE.member.id, BOB.member.id]), undefined);
    assert.equal(tryOpen(MALLORY.encSk, cm, c.epk, c.toBank, [ALICE.member.id, BOB.member.id]), undefined);
    assert.equal(tryOpen(BANK.encSk, cm, c.epk, c.toOwner, [ALICE.member.id, BOB.member.id]), undefined);
  }
});

test('#9 口座の葉はコミットメント: 口座ID を知っていても登録済みかどうか分からない', async () => {
  const { s } = await setup();
  const dump = String(s.state.toString());
  for (const p of [ALICE, BOB]) {
    assert.ok(!dump.includes(hex(p.member.id)), '公開レジャーに口座ID が含まれる');
    // 乱数（salt）を知らなければ、口座ID から葉を作れない
    const guess = pureCircuits.memberLeaf({ ...p.member, salt: new Uint8Array(32) });
    assert.ok(!s.l.members.findPathForLeaf(guess), '乱数なしで葉を推測できてしまう');
  }
});

test('#10 受取人の公開鍵をすり替えた送金はできない（銀行以外に復号させられない）', async () => {
  const { s, a } = await setup();
  const fakeBob: Member = { ...BOB.member, encPk: MALLORY.member.encPk };
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 300n), fakeBob, note(ALICE, 700n)), /未登録または凍結中|木にありません/);
});

test('#11 乱数を使い回しても、使用済みと同じナリファイアのノートは作れない', async () => {
  const { s, a } = await setup();
  // ALICE が 1000 を自分宛て（同じ乱数）に送り直そうとしても、同じコミットメントになり拒否される
  await assert.rejects(s.call(ALICE, 'transfer', a, ALICE.member, { ...a }, ALICE.member, note(ALICE, 0n)), /同じノートがすでにあります/);
  // 使用済みノートの乱数を流用して BOB 宛てのノートを作っても、ナリファイアは異なり BOB は使える
  await s.call(ALICE, 'transfer', a, ALICE.member, note(BOB, 1n), BOB.member, note(ALICE, 999n));
  const [c] = scanWallet(s, ALICE);
  await s.call(ALICE, 'transfer', c, ALICE.member, { owner: BOB.member.id, value: 999n, rand: a.rand }, BOB.member, note(ALICE, 0n));
  const reused = scanWallet(s, BOB).find((n) => n.rand === a.rand);
  assert.ok(reused, '乱数を流用したノートが見つからない');
  await s.call(BOB, 'redeem', reused, BOB.member);
});
