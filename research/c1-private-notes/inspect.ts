// 送金 1 回の「公開される部分」を確認する（調査用）
//   実行: node research/c1-private-notes/inspect.ts   （Node 24、リポジトリのルートで）
import { createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, pureCircuits, type Member } from './managed/contract/index.js';
const key = (n: number) => new Uint8Array(32).fill(n);
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const member = (sk: Uint8Array, s: bigint): Member => ({ id: id(sk), encPk: pureCircuits.encPkOf(s), salt: new Uint8Array(32).fill(0x5a) });
let eph = 1000n;
const w = {
  localSecretKey: ({ privateState }: any) => [privateState, privateState.sk],
  memberPath: ({ privateState, ledger: l }: any, m: Uint8Array) => [privateState, l.members.findPathForLeaf(m)],
  notePath: ({ privateState, ledger: l }: any, c: Uint8Array) => [privateState, l.notes.findPathForLeaf(c)],
  ephemeralKey: ({ privateState }: any) => [privateState, eph++],
};
const c = new Contract<any>(w as any);
const A = '0'.repeat(64), ADDR = sampleContractAddress();
const BANK = member(key(1), 11n), ALICE = member(key(2), 22n), BOB = member(key(3), 33n);
let st = (await c.initialState(createConstructorContext({ sk: key(1) }, A), BANK.encPk)).currentContractState.data;
const run = async (sk: Uint8Array, n: string, ...a: unknown[]) => {
  const r = await (c.impureCircuits as any)[n](createCircuitContext({ circuitId: n as any, contractAddress: ADDR, coinPublicKeyOrZswapState: A, contractState: st, privateState: { sk } }), ...a);
  st = r.context.callContext.currentQueryContext.state; return r;
};
await run(key(1), 'registerAccount', pureCircuits.memberLeaf(ALICE), 0n);
await run(key(1), 'registerAccount', pureCircuits.memberLeaf(BOB), 1n);
const a = { owner: ALICE.id, value: 1000n, rand: 0x1234567890abcdef1234567890abcdefn };
await run(key(1), 'issue', a, ALICE);
const r = await run(key(2), 'transfer', a, ALICE, { owner: BOB.id, value: 333n, rand: 0x0808n }, BOB, { owner: ALICE.id, value: 667n, rand: 0x0909n });

const ser = (x: unknown) => JSON.stringify(x, (_k, v) => (typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? hex(v) : v)) ?? '';
const dump = String(st.toString());
const secrets: Record<string, string> = { senderId: hex(ALICE.id), receiverId: hex(BOB.id), salt: hex(ALICE.salt), randDec: a.rand.toString(), randHexLE: Buffer.from(a.rand.toString(16).padStart(32, '0'), 'hex').reverse().toString('hex'), randHex: a.rand.toString(16) };
const trace: any = r.proofData ?? r.context.callProofDataTrace;
const t0: any = Array.isArray(trace) ? trace[0] : trace;
console.log('state dump length:', dump.length);
console.log('proof data keys:', Object.keys(t0 ?? {}));
for (const k of Object.keys(t0 ?? {})) {
  const s = ser(t0[k]);
  const hits = Object.entries(secrets).map(([n, v]) => `${n}=${s.includes(v)}`).join(' ');
  console.log(` [${k}] len=${s.length} ${hits}`);
}
for (const [n, v] of Object.entries(secrets)) console.log(`  in state dump? ${n}:`, dump.includes(v));
