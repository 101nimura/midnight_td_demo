import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  ephemeral(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  escrow(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  escrow(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  pubKeyOf(s_0: bigint): __compactRuntime.JubjubPoint;
  decrypt(s_0: bigint, R_0: __compactRuntime.JubjubPoint, c_0: bigint): bigint;
}

export type Circuits<PS> = {
  escrow(context: __compactRuntime.CircuitContext<PS>, value_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  pubKeyOf(context: __compactRuntime.CircuitContext<PS>, s_0: bigint): Promise<__compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>>;
  decrypt(context: __compactRuntime.CircuitContext<PS>,
          s_0: bigint,
          R_0: __compactRuntime.JubjubPoint,
          c_0: bigint): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
}

export type Ledger = {
  readonly issuerPk: __compactRuntime.JubjubPoint;
  escrowR: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): __compactRuntime.JubjubPoint;
    [Symbol.iterator](): Iterator<[bigint, __compactRuntime.JubjubPoint]>
  };
  escrowC: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  readonly n: bigint;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               pk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
