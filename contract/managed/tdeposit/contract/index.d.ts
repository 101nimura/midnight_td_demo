import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum OpKind { REGISTER = 0,
                     ISSUE = 1,
                     TRANSFER = 2,
                     REDEEM = 3,
                     FORCE_TRANSFER = 4,
                     FORCE_REDEEM = 5,
                     FREEZE = 6,
                     UNFREEZE = 7,
                     PAUSE = 8,
                     UNPAUSE = 9
}

export type OpRecord = { kind: OpKind;
                         sender: Uint8Array;
                         receiver: Uint8Array;
                         amount: bigint
                       };

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issue(context: __compactRuntime.CircuitContext<PS>,
        dst_0: Uint8Array,
        amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                src_0: Uint8Array,
                dst_0: Uint8Array,
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>,
              src_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unfreezeAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  pause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  unpause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           dst_0: Uint8Array,
           amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  redeem(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issue(context: __compactRuntime.CircuitContext<PS>,
        dst_0: Uint8Array,
        amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                src_0: Uint8Array,
                dst_0: Uint8Array,
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>,
              src_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unfreezeAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  pause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  unpause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           dst_0: Uint8Array,
           amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  redeem(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  accountId(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  accountId(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  issue(context: __compactRuntime.CircuitContext<PS>,
        dst_0: Uint8Array,
        amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                src_0: Uint8Array,
                dst_0: Uint8Array,
                amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>,
              src_0: Uint8Array,
              amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  unfreezeAccount(context: __compactRuntime.CircuitContext<PS>,
                  acct_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  pause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  unpause(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           dst_0: Uint8Array,
           amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  redeem(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly issuer: Uint8Array;
  readonly tokenName: string;
  readonly tokenSymbol: string;
  readonly totalSupply: bigint;
  readonly totalIssued: bigint;
  readonly totalRedeemed: bigint;
  readonly paused: boolean;
  registered: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  frozen: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly opCount: bigint;
  history: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): OpRecord;
    [Symbol.iterator](): Iterator<[bigint, OpRecord]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               name_0: string,
               symbol_0: string): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
