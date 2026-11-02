/**
 * トークン化預金コントラクトの TypeScript バインディング
 *  - コンパイル済みコントラクト (contract/managed/tdeposit) の再エクスポート
 *  - ウィットネス（秘密鍵の供給）
 *  - midnight-js 用の CompiledContract 定義
 */
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import * as TDeposit from '../../contract/managed/tdeposit/contract/index.js';

export * from '../../contract/managed/tdeposit/contract/index.js';

/** プライベートステート：操作者の口座秘密鍵（チェーンには出ない） */
export type TDepositPrivateState = {
  readonly secretKey: Uint8Array;
};

export const witnesses = {
  localSecretKey: ({
    privateState,
  }: WitnessContext<TDeposit.Ledger, TDepositPrivateState>): [TDepositPrivateState, Uint8Array] => [
    privateState,
    privateState.secretKey,
  ],
};

export type TDepositContract = TDeposit.Contract<TDepositPrivateState, typeof witnesses>;

export type TDepositCircuitKeys = Exclude<keyof TDepositContract['impureCircuits'], number | symbol>;

export const CompiledTDepositContract = CompiledContract.make<TDepositContract>(
  'TDeposit',
  TDeposit.Contract<TDepositPrivateState, typeof witnesses>,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/tdeposit'),
);

/** 秘密鍵 → 口座ID（コントラクトの pure circuit と同一計算） */
export const accountIdOf = (secretKey: Uint8Array): Uint8Array => TDeposit.pureCircuits.accountId(secretKey);
