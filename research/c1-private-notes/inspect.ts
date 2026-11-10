// 送金 1 回の「公開される部分」を確認する（調査用）
import { createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, pureCircuits } from './managed/contract/index.js';
const key = (n: number) => new Uint8Array(32).fill(n);
const id = (sk: Uint8Array) => pureCircuits.accountId(sk);
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');
const w = {
  localSecretKey: ({ privateState }: any) => [privateState, privateState.sk],
  memberPath: ({ privateState, ledger: l }: any, m: Uint8Array) => [privateState, l.members.findPathForLeaf(m)],
  notePath: ({ privateState, ledger: l }: any, c: Uint8Array) => [privateState, l.notes.findPathForLeaf(c)],
};
const c = new Contract<any>(w as any);
const A = '0'.repeat(64), ADDR = sampleContractAddress();
let st = (await c.initialState(createConstructorContext({ sk: key(1) }, A))).currentContractState.data;
const run = async (sk: Uint8Array, n: string, ...a: unknown[]) => {
  const r = await (c.impureCircuits as any)[n](createCircuitContext({ circuitId: n as any, contractAddress: ADDR, coinPublicKeyOrZswapState: A, contractState: st, privateState: { sk } }), ...a);
  st = r.context.callContext.currentQueryContext.state; return r;
};
await run(key(1), 'registerAccount', id(key(2)), 0n);
await run(key(1), 'registerAccount', id(key(3)), 1n);
const a = { owner: id(key(2)), value: 1000n, rand: new Uint8Array(32).fill(7) };
await run(key(1), 'issue', a);
const r = await run(key(2), 'transfer', a, { owner: id(key(3)), value: 333n, rand: new Uint8Array(32).fill(8) }, { owner: id(key(2)), value: 667n, rand: new Uint8Array(32).fill(9) });
const dump = String(st.toString());
console.log('state dump length:', dump.length, '| sample:', dump.slice(0, 160).replace(/\s+/g, ' '));
const trace = r.context.callProofDataTrace; console.log('trace type:', Array.isArray(trace) ? 'array len ' + trace.length : typeof trace, Object.keys(trace?.[0] ?? trace ?? {}));
const pub = JSON.stringify(trace, (_k, v) => typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? hex(v) : v);
console.log('public transcript length:', pub.length);
const secrets: Record<string, string> = { senderId: hex(id(key(2))), receiverId: hex(id(key(3))), rand7: hex(a.rand), rand8: '08'.repeat(32) };
for (const [k, v] of Object.entries(secrets)) console.log(`  in public transcript? ${k}:`, pub.includes(v), '| in state dump?', dump.includes(v));
for (const amt of ['333', '667', '1000']) console.log(`  amount ${amt} as number in transcript?`, new RegExp(`[^0-9]${amt}[^0-9]`).test(pub));
const t0: any = (r.context.callProofDataTrace as any)[0] ?? r.context.callProofDataTrace;
console.log('TRACE0 KEYS:', Object.keys(t0));
for (const k of Object.keys(t0)) {
  const s = JSON.stringify(t0[k], (_k, v) => typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? hex(v) : v) ?? '';
  console.log(` [${k}] len=${s.length} sender=${s.includes(secrets.senderId)} receiver=${s.includes(secrets.receiverId)} rand7=${s.includes(secrets.rand7)} rand8=${s.includes(secrets.rand8)}`);
}
