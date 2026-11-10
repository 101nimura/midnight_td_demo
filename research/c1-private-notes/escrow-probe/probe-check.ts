// 発行体だけが、公開された暗号文から金額を復号できることを確認する
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCircuitContext, createConstructorContext, sampleContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger, pureCircuits } from './managed/contract/index.js';
const ISSUER_S = 123456789012345678901234567890n, OTHER_S = 987654321n, EPH = 55555555555555n;
test('発行体の秘密鍵でだけ金額を復号できる', async () => {
  const c = new Contract<any>({ ephemeral: ({ privateState }: any) => [privateState, EPH] } as any);
  const A = '0'.repeat(64), ADDR = sampleContractAddress();
  const pk = pureCircuits.pubKeyOf(ISSUER_S);
  let st = (await c.initialState(createConstructorContext({}, A), pk)).currentContractState.data;
  const r = await (c.impureCircuits as any).escrow(createCircuitContext({ circuitId: 'escrow' as any, contractAddress: ADDR, coinPublicKeyOrZswapState: A, contractState: st, privateState: {} }), 1234n);
  st = r.context.callContext.currentQueryContext.state;
  const l = ledger(st);
  const R = l.escrowR.lookup(0n), C = l.escrowC.lookup(0n);
  assert.notEqual(C, 1234n);                                   // 公開されるのは暗号文
  assert.equal(pureCircuits.decrypt(ISSUER_S, R, C), 1234n);   // 発行体は復号できる
  assert.notEqual(pureCircuits.decrypt(OTHER_S, R, C), 1234n); // ほかの鍵では復号できない
});
