import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Note = { owner: Uint8Array; value: bigint; rand: bigint };

export type Member = { id: Uint8Array;
                       encPk: __compactRuntime.JubjubPoint;
                       salt: Uint8Array
                     };

export type NoteCipher = { epk: __compactRuntime.JubjubPoint;
                           toOwner: bigint[];
                           toBank: bigint[]
                         };

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  memberPath(context: __compactRuntime.WitnessContext<Ledger, PS>,
             leaf_0: Uint8Array): [PS, { leaf: Uint8Array,
                                         path: { sibling: { field: bigint },
                                                 goes_left: boolean
                                               }[]
                                       }];
  notePath(context: __compactRuntime.WitnessContext<Ledger, PS>,
           cm_0: Uint8Array): [PS, { leaf: Uint8Array,
                                     path: { sibling: { field: bigint },
                                             goes_left: boolean
                                           }[]
                                   }];
  ephemeralKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  leaf_0: Uint8Array,
                  index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  issue(context: __compactRuntime.CircuitContext<PS>, n_0: Note, m_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                input_0: Note,
                to_0: Note,
                toMember_0: Member,
                change_0: Note,
                changePk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>, input_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           input_0: Note,
           me_0: Member,
           to_0: Note,
           toMember_0: Member,
           change_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  redeem(context: __compactRuntime.CircuitContext<PS>,
         input_0: Note,
         me_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  leaf_0: Uint8Array,
                  index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  issue(context: __compactRuntime.CircuitContext<PS>, n_0: Note, m_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                input_0: Note,
                to_0: Note,
                toMember_0: Member,
                change_0: Note,
                changePk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>, input_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           input_0: Note,
           me_0: Member,
           to_0: Note,
           toMember_0: Member,
           change_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  redeem(context: __compactRuntime.CircuitContext<PS>,
         input_0: Note,
         me_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  accountId(sk_0: Uint8Array): Uint8Array;
  memberLeaf(m_0: Member): Uint8Array;
  noteCommitment(n_0: Note): Uint8Array;
  nullifierOf(n_0: Note): Uint8Array;
  ownerTag(id_0: Uint8Array): bigint;
  encPkOf(s_0: bigint): __compactRuntime.JubjubPoint;
  decrypt(s_0: bigint, epk_0: __compactRuntime.JubjubPoint, c_0: bigint[]): bigint[];
}

export type Circuits<PS> = {
  accountId(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  memberLeaf(context: __compactRuntime.CircuitContext<PS>, m_0: Member): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  noteCommitment(context: __compactRuntime.CircuitContext<PS>, n_0: Note): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  nullifierOf(context: __compactRuntime.CircuitContext<PS>, n_0: Note): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  ownerTag(context: __compactRuntime.CircuitContext<PS>, id_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  encPkOf(context: __compactRuntime.CircuitContext<PS>, s_0: bigint): Promise<__compactRuntime.CircuitResults<PS, __compactRuntime.JubjubPoint>>;
  decrypt(context: __compactRuntime.CircuitContext<PS>,
          s_0: bigint,
          epk_0: __compactRuntime.JubjubPoint,
          c_0: bigint[]): Promise<__compactRuntime.CircuitResults<PS, bigint[]>>;
  registerAccount(context: __compactRuntime.CircuitContext<PS>,
                  leaf_0: Uint8Array,
                  index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  freezeAccount(context: __compactRuntime.CircuitContext<PS>, index_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  issue(context: __compactRuntime.CircuitContext<PS>, n_0: Note, m_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceTransfer(context: __compactRuntime.CircuitContext<PS>,
                input_0: Note,
                to_0: Note,
                toMember_0: Member,
                change_0: Note,
                changePk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  forceRedeem(context: __compactRuntime.CircuitContext<PS>, input_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  transfer(context: __compactRuntime.CircuitContext<PS>,
           input_0: Note,
           me_0: Member,
           to_0: Note,
           toMember_0: Member,
           change_0: Note): Promise<__compactRuntime.CircuitResults<PS, []>>;
  redeem(context: __compactRuntime.CircuitContext<PS>,
         input_0: Note,
         me_0: Member): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly issuer: Uint8Array;
  readonly bankEncPk: __compactRuntime.JubjubPoint;
  members: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  notes: {
    isFull(): boolean;
    checkRoot(rt_0: { field: bigint }): boolean;
    root(): __compactRuntime.MerkleTreeDigest;
    firstFree(): bigint;
    pathForLeaf(index_0: bigint, leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array>;
    findPathForLeaf(leaf_0: Uint8Array): __compactRuntime.MerkleTreePath<Uint8Array> | undefined;
    history(): Iterator<__compactRuntime.MerkleTreeDigest>
  };
  ciphers: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): NoteCipher;
    [Symbol.iterator](): Iterator<[Uint8Array, NoteCipher]>
  };
  nullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly totalSupply: bigint;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               bankPk_0: __compactRuntime.JubjubPoint): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
