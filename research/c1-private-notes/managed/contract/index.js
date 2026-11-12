import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.21.0');

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_1 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_2 = __compactRuntime.CompactTypeField;

class _Note_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_0.alignment().concat(_descriptor_2.alignment()));
  }
  fromValue(value_0) {
    return {
      owner: _descriptor_1.fromValue(value_0),
      value: _descriptor_0.fromValue(value_0),
      rand: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.owner).concat(_descriptor_0.toValue(value_0.value).concat(_descriptor_2.toValue(value_0.rand)));
  }
}

const _descriptor_3 = new _Note_0();

const _descriptor_4 = __compactRuntime.CompactTypeJubjubPoint;

class _Member_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_4.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      id: _descriptor_1.fromValue(value_0),
      encPk: _descriptor_4.fromValue(value_0),
      salt: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.id).concat(_descriptor_4.toValue(value_0.encPk).concat(_descriptor_1.toValue(value_0.salt)));
  }
}

const _descriptor_5 = new _Member_0();

class _MerkleTreeDigest_0 {
  alignment() {
    return _descriptor_2.alignment();
  }
  fromValue(value_0) {
    return {
      field: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.field);
  }
}

const _descriptor_6 = new _MerkleTreeDigest_0();

const _descriptor_7 = __compactRuntime.CompactTypeBoolean;

const _descriptor_8 = new __compactRuntime.CompactTypeVector(3, _descriptor_2);

class _NoteCipher_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_8.alignment().concat(_descriptor_8.alignment()));
  }
  fromValue(value_0) {
    return {
      epk: _descriptor_4.fromValue(value_0),
      toOwner: _descriptor_8.fromValue(value_0),
      toBank: _descriptor_8.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.epk).concat(_descriptor_8.toValue(value_0.toOwner).concat(_descriptor_8.toValue(value_0.toBank)));
  }
}

const _descriptor_9 = new _NoteCipher_0();

const _descriptor_10 = __compactRuntime.CompactTypeJubjubScalar;

class _MerkleTreePathEntry_0 {
  alignment() {
    return _descriptor_6.alignment().concat(_descriptor_7.alignment());
  }
  fromValue(value_0) {
    return {
      sibling: _descriptor_6.fromValue(value_0),
      goes_left: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_6.toValue(value_0.sibling).concat(_descriptor_7.toValue(value_0.goes_left));
  }
}

const _descriptor_11 = new _MerkleTreePathEntry_0();

const _descriptor_12 = new __compactRuntime.CompactTypeVector(10, _descriptor_11);

class _MerkleTreePath_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_12.alignment());
  }
  fromValue(value_0) {
    return {
      leaf: _descriptor_1.fromValue(value_0),
      path: _descriptor_12.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.leaf).concat(_descriptor_12.toValue(value_0.path));
  }
}

const _descriptor_13 = new _MerkleTreePath_0();

class _tuple_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_2.alignment().concat(_descriptor_2.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_1.fromValue(value_0),
      _descriptor_2.fromValue(value_0),
      _descriptor_2.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0[0]).concat(_descriptor_2.toValue(value_0[1]).concat(_descriptor_2.toValue(value_0[2])));
  }
}

const _descriptor_14 = new _tuple_0();

class _tuple_1 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_0.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_1.fromValue(value_0),
      _descriptor_0.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0[0]).concat(_descriptor_0.toValue(value_0[1]));
  }
}

const _descriptor_15 = new _tuple_1();

const _descriptor_16 = new __compactRuntime.CompactTypeVector(3, _descriptor_1);

const _descriptor_17 = new __compactRuntime.CompactTypeBytes(6);

class _LeafPreimage_0 {
  alignment() {
    return _descriptor_17.alignment().concat(_descriptor_1.alignment());
  }
  fromValue(value_0) {
    return {
      domain_sep: _descriptor_17.fromValue(value_0),
      data: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_17.toValue(value_0.domain_sep).concat(_descriptor_1.toValue(value_0.data));
  }
}

const _descriptor_18 = new _LeafPreimage_0();

const _descriptor_19 = new __compactRuntime.CompactTypeVector(2, _descriptor_2);

const _descriptor_20 = new __compactRuntime.CompactTypeVector(2, _descriptor_1);

class _Either_0 {
  alignment() {
    return _descriptor_7.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_7.fromValue(value_0),
      left: _descriptor_1.fromValue(value_0),
      right: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_7.toValue(value_0.is_left).concat(_descriptor_1.toValue(value_0.left).concat(_descriptor_1.toValue(value_0.right)));
  }
}

const _descriptor_21 = new _Either_0();

const _descriptor_22 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_23 = new _ContractAddress_0();

class _UserAddress_0 {
  alignment() {
    return _descriptor_1.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.bytes);
  }
}

const _descriptor_24 = new _UserAddress_0();

class _Either_1 {
  alignment() {
    return _descriptor_7.alignment().concat(_descriptor_23.alignment().concat(_descriptor_24.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_7.fromValue(value_0),
      left: _descriptor_23.fromValue(value_0),
      right: _descriptor_24.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_7.toValue(value_0.is_left).concat(_descriptor_23.toValue(value_0.left).concat(_descriptor_24.toValue(value_0.right)));
  }
}

const _descriptor_25 = new _Either_1();

class _Maybe_0 {
  alignment() {
    return _descriptor_7.alignment().concat(_descriptor_25.alignment());
  }
  fromValue(value_0) {
    return {
      is_some: _descriptor_7.fromValue(value_0),
      value: _descriptor_25.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_7.toValue(value_0.is_some).concat(_descriptor_25.toValue(value_0.value));
  }
}

const _descriptor_26 = new _Maybe_0();

const _descriptor_27 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_28 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.localSecretKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named localSecretKey');
    }
    if (typeof(witnesses_0.memberPath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named memberPath');
    }
    if (typeof(witnesses_0.notePath) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named notePath');
    }
    if (typeof(witnesses_0.ephemeralKey) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named ephemeralKey');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      async accountId(context, ...args_1) {
        return { result: pureCircuits.accountId(...args_1), context };
      },
      async memberLeaf(context, ...args_1) {
        return { result: pureCircuits.memberLeaf(...args_1), context };
      },
      async noteCommitment(context, ...args_1) {
        return { result: pureCircuits.noteCommitment(...args_1), context };
      },
      async nullifierOf(context, ...args_1) {
        return { result: pureCircuits.nullifierOf(...args_1), context };
      },
      async ownerTag(context, ...args_1) {
        return { result: pureCircuits.ownerTag(...args_1), context };
      },
      async encPkOf(context, ...args_1) {
        return { result: pureCircuits.encPkOf(...args_1), context };
      },
      async decrypt(context, ...args_1) {
        return { result: pureCircuits.decrypt(...args_1), context };
      },
      registerAccount: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`registerAccount: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const leaf_0 = args_1[1];
        const index_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('registerAccount',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 159 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('registerAccount',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 159 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0n && index_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('registerAccount',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'tdeposit_private.compact line 159 char 1',
                                     'Uint<0..18446744073709551616>',
                                     index_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(leaf_0).concat(_descriptor_0.toValue(index_0)),
            alignment: _descriptor_1.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._registerAccount_0(context,
                                                       partialProofData,
                                                       leaf_0,
                                                       index_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      freezeAccount: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`freezeAccount: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const index_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('freezeAccount',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 165 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0n && index_0 <= 18446744073709551615n)) {
          __compactRuntime.typeError('freezeAccount',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 165 char 1',
                                     'Uint<0..18446744073709551616>',
                                     index_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(index_0),
            alignment: _descriptor_0.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._freezeAccount_0(context,
                                                     partialProofData,
                                                     index_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      issue: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`issue: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const n_0 = args_1[1];
        const m_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('issue',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 172 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(n_0) === 'object' && n_0.owner.buffer instanceof ArrayBuffer && n_0.owner.BYTES_PER_ELEMENT === 1 && n_0.owner.length === 32 && typeof(n_0.value) === 'bigint' && n_0.value >= 0n && n_0.value <= 18446744073709551615n && typeof(n_0.rand) === 'bigint' && n_0.rand >= 0 && n_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('issue',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 172 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     n_0)
        }
        if (!(typeof(m_0) === 'object' && m_0.id.buffer instanceof ArrayBuffer && m_0.id.BYTES_PER_ELEMENT === 1 && m_0.id.length === 32 && typeof(m_0.encPk.x) === 'bigint' && m_0.encPk.x >= 0n && m_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(m_0.encPk.y) === 'bigint' && m_0.encPk.y >= 0n && m_0.encPk.y <= __compactRuntime.MAX_FIELD && m_0.salt.buffer instanceof ArrayBuffer && m_0.salt.BYTES_PER_ELEMENT === 1 && m_0.salt.length === 32)) {
          __compactRuntime.typeError('issue',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'tdeposit_private.compact line 172 char 1',
                                     'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                     m_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(n_0).concat(_descriptor_5.toValue(m_0)),
            alignment: _descriptor_3.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._issue_0(context, partialProofData, n_0, m_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      forceTransfer: async (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`forceTransfer: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const input_0 = args_1[1];
        const to_0 = args_1[2];
        const toMember_0 = args_1[3];
        const change_0 = args_1[4];
        const changePk_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(input_0) === 'object' && input_0.owner.buffer instanceof ArrayBuffer && input_0.owner.BYTES_PER_ELEMENT === 1 && input_0.owner.length === 32 && typeof(input_0.value) === 'bigint' && input_0.value >= 0n && input_0.value <= 18446744073709551615n && typeof(input_0.rand) === 'bigint' && input_0.rand >= 0 && input_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     input_0)
        }
        if (!(typeof(to_0) === 'object' && to_0.owner.buffer instanceof ArrayBuffer && to_0.owner.BYTES_PER_ELEMENT === 1 && to_0.owner.length === 32 && typeof(to_0.value) === 'bigint' && to_0.value >= 0n && to_0.value <= 18446744073709551615n && typeof(to_0.rand) === 'bigint' && to_0.rand >= 0 && to_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     to_0)
        }
        if (!(typeof(toMember_0) === 'object' && toMember_0.id.buffer instanceof ArrayBuffer && toMember_0.id.BYTES_PER_ELEMENT === 1 && toMember_0.id.length === 32 && typeof(toMember_0.encPk.x) === 'bigint' && toMember_0.encPk.x >= 0n && toMember_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(toMember_0.encPk.y) === 'bigint' && toMember_0.encPk.y >= 0n && toMember_0.encPk.y <= __compactRuntime.MAX_FIELD && toMember_0.salt.buffer instanceof ArrayBuffer && toMember_0.salt.BYTES_PER_ELEMENT === 1 && toMember_0.salt.length === 32)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                     toMember_0)
        }
        if (!(typeof(change_0) === 'object' && change_0.owner.buffer instanceof ArrayBuffer && change_0.owner.BYTES_PER_ELEMENT === 1 && change_0.owner.length === 32 && typeof(change_0.value) === 'bigint' && change_0.value >= 0n && change_0.value <= 18446744073709551615n && typeof(change_0.rand) === 'bigint' && change_0.rand >= 0 && change_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     change_0)
        }
        if (!(typeof(changePk_0.x) === 'bigint' && changePk_0.x >= 0n && changePk_0.x <= __compactRuntime.MAX_FIELD && typeof(changePk_0.y) === 'bigint' && changePk_0.y >= 0n && changePk_0.y <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forceTransfer',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'tdeposit_private.compact line 182 char 1',
                                     'JubjubPoint',
                                     changePk_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(input_0).concat(_descriptor_3.toValue(to_0).concat(_descriptor_5.toValue(toMember_0).concat(_descriptor_3.toValue(change_0).concat(_descriptor_4.toValue(changePk_0))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forceTransfer_0(context,
                                                     partialProofData,
                                                     input_0,
                                                     to_0,
                                                     toMember_0,
                                                     change_0,
                                                     changePk_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      forceRedeem: async (...args_1) => {
        if (args_1.length !== 2) {
          throw new __compactRuntime.CompactError(`forceRedeem: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const input_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('forceRedeem',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 194 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(input_0) === 'object' && input_0.owner.buffer instanceof ArrayBuffer && input_0.owner.BYTES_PER_ELEMENT === 1 && input_0.owner.length === 32 && typeof(input_0.value) === 'bigint' && input_0.value >= 0n && input_0.value <= 18446744073709551615n && typeof(input_0.rand) === 'bigint' && input_0.rand >= 0 && input_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('forceRedeem',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 194 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     input_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(input_0),
            alignment: _descriptor_3.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._forceRedeem_0(context,
                                                   partialProofData,
                                                   input_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      transfer: async (...args_1) => {
        if (args_1.length !== 6) {
          throw new __compactRuntime.CompactError(`transfer: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const input_0 = args_1[1];
        const me_0 = args_1[2];
        const to_0 = args_1[3];
        const toMember_0 = args_1[4];
        const change_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('transfer',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(input_0) === 'object' && input_0.owner.buffer instanceof ArrayBuffer && input_0.owner.BYTES_PER_ELEMENT === 1 && input_0.owner.length === 32 && typeof(input_0.value) === 'bigint' && input_0.value >= 0n && input_0.value <= 18446744073709551615n && typeof(input_0.rand) === 'bigint' && input_0.rand >= 0 && input_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('transfer',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     input_0)
        }
        if (!(typeof(me_0) === 'object' && me_0.id.buffer instanceof ArrayBuffer && me_0.id.BYTES_PER_ELEMENT === 1 && me_0.id.length === 32 && typeof(me_0.encPk.x) === 'bigint' && me_0.encPk.x >= 0n && me_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(me_0.encPk.y) === 'bigint' && me_0.encPk.y >= 0n && me_0.encPk.y <= __compactRuntime.MAX_FIELD && me_0.salt.buffer instanceof ArrayBuffer && me_0.salt.BYTES_PER_ELEMENT === 1 && me_0.salt.length === 32)) {
          __compactRuntime.typeError('transfer',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                     me_0)
        }
        if (!(typeof(to_0) === 'object' && to_0.owner.buffer instanceof ArrayBuffer && to_0.owner.BYTES_PER_ELEMENT === 1 && to_0.owner.length === 32 && typeof(to_0.value) === 'bigint' && to_0.value >= 0n && to_0.value <= 18446744073709551615n && typeof(to_0.rand) === 'bigint' && to_0.rand >= 0 && to_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('transfer',
                                     'argument 3 (argument 4 as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     to_0)
        }
        if (!(typeof(toMember_0) === 'object' && toMember_0.id.buffer instanceof ArrayBuffer && toMember_0.id.BYTES_PER_ELEMENT === 1 && toMember_0.id.length === 32 && typeof(toMember_0.encPk.x) === 'bigint' && toMember_0.encPk.x >= 0n && toMember_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(toMember_0.encPk.y) === 'bigint' && toMember_0.encPk.y >= 0n && toMember_0.encPk.y <= __compactRuntime.MAX_FIELD && toMember_0.salt.buffer instanceof ArrayBuffer && toMember_0.salt.BYTES_PER_ELEMENT === 1 && toMember_0.salt.length === 32)) {
          __compactRuntime.typeError('transfer',
                                     'argument 4 (argument 5 as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                     toMember_0)
        }
        if (!(typeof(change_0) === 'object' && change_0.owner.buffer instanceof ArrayBuffer && change_0.owner.BYTES_PER_ELEMENT === 1 && change_0.owner.length === 32 && typeof(change_0.value) === 'bigint' && change_0.value >= 0n && change_0.value <= 18446744073709551615n && typeof(change_0.rand) === 'bigint' && change_0.rand >= 0 && change_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('transfer',
                                     'argument 5 (argument 6 as invoked from Typescript)',
                                     'tdeposit_private.compact line 206 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     change_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(input_0).concat(_descriptor_5.toValue(me_0).concat(_descriptor_3.toValue(to_0).concat(_descriptor_5.toValue(toMember_0).concat(_descriptor_3.toValue(change_0))))),
            alignment: _descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_3.alignment().concat(_descriptor_5.alignment().concat(_descriptor_3.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._transfer_0(context,
                                                partialProofData,
                                                input_0,
                                                me_0,
                                                to_0,
                                                toMember_0,
                                                change_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      },
      redeem: async (...args_1) => {
        if (args_1.length !== 3) {
          throw new __compactRuntime.CompactError(`redeem: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        const input_0 = args_1[1];
        const me_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.callContext.currentQueryContext != undefined)) {
          __compactRuntime.typeError('redeem',
                                     'argument 1 (as invoked from Typescript)',
                                     'tdeposit_private.compact line 220 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        if (!(typeof(input_0) === 'object' && input_0.owner.buffer instanceof ArrayBuffer && input_0.owner.BYTES_PER_ELEMENT === 1 && input_0.owner.length === 32 && typeof(input_0.value) === 'bigint' && input_0.value >= 0n && input_0.value <= 18446744073709551615n && typeof(input_0.rand) === 'bigint' && input_0.rand >= 0 && input_0.rand <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('redeem',
                                     'argument 1 (argument 2 as invoked from Typescript)',
                                     'tdeposit_private.compact line 220 char 1',
                                     'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                     input_0)
        }
        if (!(typeof(me_0) === 'object' && me_0.id.buffer instanceof ArrayBuffer && me_0.id.BYTES_PER_ELEMENT === 1 && me_0.id.length === 32 && typeof(me_0.encPk.x) === 'bigint' && me_0.encPk.x >= 0n && me_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(me_0.encPk.y) === 'bigint' && me_0.encPk.y >= 0n && me_0.encPk.y <= __compactRuntime.MAX_FIELD && me_0.salt.buffer instanceof ArrayBuffer && me_0.salt.BYTES_PER_ELEMENT === 1 && me_0.salt.length === 32)) {
          __compactRuntime.typeError('redeem',
                                     'argument 2 (argument 3 as invoked from Typescript)',
                                     'tdeposit_private.compact line 220 char 1',
                                     'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                     me_0)
        }
        const context = __compactRuntime.copyCircuitContext(contextOrig_0);
        const partialProofData = {
          input: {
            value: _descriptor_3.toValue(input_0).concat(_descriptor_5.toValue(me_0)),
            alignment: _descriptor_3.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = await this._redeem_0(context,
                                              partialProofData,
                                              input_0,
                                              me_0);
        partialProofData.output = { value: [], alignment: [] };
        __compactRuntime.finalizeCallProofData(context, partialProofData);
        return { result: result_0, context: context, gasCost: context.callContext.currentGasCost };
      }
    };
    this.impureCircuits = {
      registerAccount: this.circuits.registerAccount,
      freezeAccount: this.circuits.freezeAccount,
      issue: this.circuits.issue,
      forceTransfer: this.circuits.forceTransfer,
      forceRedeem: this.circuits.forceRedeem,
      transfer: this.circuits.transfer,
      redeem: this.circuits.redeem
    };
    this.provableCircuits = {
      registerAccount: this.circuits.registerAccount,
      freezeAccount: this.circuits.freezeAccount,
      issue: this.circuits.issue,
      forceTransfer: this.circuits.forceTransfer,
      forceRedeem: this.circuits.forceRedeem,
      transfer: this.circuits.transfer,
      redeem: this.circuits.redeem
    };
  }
  async initialState(...args_0) {
    if (args_0.length !== 2) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 2 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const bankPk_0 = args_0[1];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(bankPk_0.x) === 'bigint' && bankPk_0.x >= 0n && bankPk_0.x <= __compactRuntime.MAX_FIELD && typeof(bankPk_0.y) === 'bigint' && bankPk_0.y >= 0n && bankPk_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'tdeposit_private.compact line 58 char 1',
                                 'JubjubPoint',
                                 bankPk_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('registerAccount', new __compactRuntime.ContractOperation());
    state_0.setOperation('freezeAccount', new __compactRuntime.ContractOperation());
    state_0.setOperation('issue', new __compactRuntime.ContractOperation());
    state_0.setOperation('forceTransfer', new __compactRuntime.ContractOperation());
    state_0.setOperation('forceRedeem', new __compactRuntime.ContractOperation());
    state_0.setOperation('transfer', new __compactRuntime.ContractOperation());
    state_0.setOperation('redeem', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext({circuitId: 'constructor', contractAddress: __compactRuntime.dummyContractAddress(), coinPublicKeyOrZswapState: constructorContext_0.initialZswapLocalState.coinPublicKey, contractState: state_0.data, privateState: constructorContext_0.initialPrivateState});
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(({x: 0n, y: 1n})),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(10)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                                        alignment: _descriptor_0.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                             new __compactRuntime.StateMap()
                                                                                                                                                                           ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(3n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newArray()
                                                          .arrayPush(__compactRuntime.StateValue.newBoundedMerkleTree(
                                                                       new __compactRuntime.StateBoundedMerkleTree(10)
                                                                     )).arrayPush(__compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                                        alignment: _descriptor_0.alignment() })).arrayPush(__compactRuntime.StateValue.newMap(
                                                                                                                                                                             new __compactRuntime.StateMap()
                                                                                                                                                                           ))
                                                          .encode() } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 2 } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(4n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(5n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_0 = this._accountId_0(this._localSecretKey_0(context,
                                                           partialProofData));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(0n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(1n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(bankPk_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 0n;
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_1),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.callContext.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.callContext.currentPrivateState,
      currentZswapLocalState: context.callContext.currentZswapLocalState
    }
  }
  _merkleTreePathRoot_0(path_0) {
    return { field:
               this._folder_0((...args_0) =>
                                this._merkleTreePathEntryRoot_0(...args_0),
                              this._degradeToTransient_0(this._persistentHash_2({ domain_sep:
                                                                                    new Uint8Array([109, 100, 110, 58, 108, 104]),
                                                                                  data:
                                                                                    path_0.leaf })),
                              path_0.path) };
  }
  _merkleTreePathEntryRoot_0(recursiveDigest_0, entry_0) {
    const left_0 = entry_0.goes_left ? recursiveDigest_0 : entry_0.sibling.field;
    const right_0 = entry_0.goes_left ?
                    entry_0.sibling.field :
                    recursiveDigest_0;
    return this._transientHash_1([left_0, right_0]);
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_8, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_19, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_20, value_0);
    return result_0;
  }
  _persistentHash_1(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_16, value_0);
    return result_0;
  }
  _persistentHash_2(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_18, value_0);
    return result_0;
  }
  _persistentCommit_0(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_14,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _persistentCommit_1(value_0, rand_0) {
    const result_0 = __compactRuntime.persistentCommit(_descriptor_15,
                                                       value_0,
                                                       rand_0);
    return result_0;
  }
  _degradeToTransient_0(x_0) {
    const result_0 = __compactRuntime.degradeToTransient(x_0);
    return result_0;
  }
  _jubjubPointX_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointX(pt_0);
    return result_0;
  }
  _jubjubPointY_0(pt_0) {
    const result_0 = __compactRuntime.jubjubPointY(pt_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _localSecretKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.localSecretKey(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('localSecretKey',
                                 'return value',
                                 'tdeposit_private.compact line 53 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  _memberPath_0(context, partialProofData, leaf_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.memberPath(witnessContext_0,
                                                                     leaf_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 10 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('memberPath',
                                 'return value',
                                 'tdeposit_private.compact line 54 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<10, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _notePath_0(context, partialProofData, cm_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.notePath(witnessContext_0,
                                                                   cm_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.leaf.buffer instanceof ArrayBuffer && result_0.leaf.BYTES_PER_ELEMENT === 1 && result_0.leaf.length === 32 && Array.isArray(result_0.path) && result_0.path.length === 10 && result_0.path.every((t) => typeof(t) === 'object' && typeof(t.sibling) === 'object' && typeof(t.sibling.field) === 'bigint' && t.sibling.field >= 0 && t.sibling.field <= __compactRuntime.MAX_FIELD && typeof(t.goes_left) === 'boolean'))) {
      __compactRuntime.typeError('notePath',
                                 'return value',
                                 'tdeposit_private.compact line 55 char 1',
                                 'struct MerkleTreePath<leaf: Bytes<32>, path: Vector<10, struct MerkleTreePathEntry<sibling: struct MerkleTreeDigest<field: Field>, goes_left: Boolean>>>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_13.toValue(result_0),
      alignment: _descriptor_13.alignment()
    });
    return result_0;
  }
  _ephemeralKey_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.callContext.currentQueryContext.state), context.callContext.currentPrivateState, context.callContext.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.ephemeralKey(witnessContext_0);
    context.callContext.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= __compactRuntime.MAX_JUBJUB_SCALAR)) {
      __compactRuntime.typeError('ephemeralKey',
                                 'return value',
                                 'tdeposit_private.compact line 56 char 1',
                                 'JubjubScalar',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_10.toValue(result_0),
      alignment: _descriptor_10.alignment()
    });
    return result_0;
  }
  _accountId_0(sk_0) {
    return this._persistentHash_0([new Uint8Array([116, 100, 112, 58, 97, 99, 99, 116, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   sk_0]);
  }
  _memberLeaf_0(m_0) {
    return this._persistentCommit_0([m_0.id,
                                     this._jubjubPointX_0(m_0.encPk),
                                     this._jubjubPointY_0(m_0.encPk)],
                                    m_0.salt);
  }
  _noteCommitment_0(n_0) {
    return this._persistentCommit_1([n_0.owner, n_0.value],
                                    __compactRuntime.convertBigintToBytes(32,
                                                                          n_0.rand,
                                                                          'tdeposit_private.compact line 75 char 70'));
  }
  _nullifierOf_0(n_0) {
    return this._persistentHash_1([new Uint8Array([116, 100, 112, 58, 110, 117, 108, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                   __compactRuntime.convertBigintToBytes(32,
                                                                         n_0.rand,
                                                                         'tdeposit_private.compact line 83 char 69'),
                                   this._noteCommitment_0(n_0)]);
  }
  _ownerTag_0(id_0) { return this._degradeToTransient_0(id_0); }
  _encPkOf_0(s_0) { return this._ecMulGenerator_0(s_0); }
  _keystream_0(S_0) {
    const x_0 = this._jubjubPointX_0(S_0);
    const y_0 = this._jubjubPointY_0(S_0);
    return [this._transientHash_0([x_0, y_0, 0n]),
            this._transientHash_0([x_0, y_0, 1n]),
            this._transientHash_0([x_0, y_0, 2n])];
  }
  _encryptTo_0(pk_0, e_0, n_0) {
    const k_0 = this._keystream_0(this._ecMul_0(pk_0, e_0));
    return [__compactRuntime.addField(this._ownerTag_0(n_0.owner), k_0[0]),
            __compactRuntime.addField(n_0.value, k_0[1]),
            __compactRuntime.addField(n_0.rand, k_0[2])];
  }
  _decrypt_0(s_0, epk_0, c_0) {
    const k_0 = this._keystream_0(this._ecMul_0(epk_0, s_0));
    return [__compactRuntime.subField(c_0[0], k_0[0]),
            __compactRuntime.subField(c_0[1], k_0[1]),
            __compactRuntime.subField(c_0[2], k_0[2])];
  }
  async _assertIssuer_0(context, partialProofData) {
    __compactRuntime.assert(this._equal_0(this._accountId_0(this._localSecretKey_0(context,
                                                                                   partialProofData)),
                                          _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_27.toValue(0n),
                                                                                                                                alignment: _descriptor_27.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value)),
                            '発行体（銀行）のみ実行できます');
    return [];
  }
  async _assertMember_0(context, partialProofData, m_0) {
    const leaf_0 = this._memberLeaf_0(m_0);
    const p_0 = this._memberPath_0(context, partialProofData, leaf_0);
    __compactRuntime.assert(this._equal_1(p_0.leaf, leaf_0), '口座の証明が一致しません');
    let tmp_0;
    __compactRuntime.assert((tmp_0 = this._merkleTreePathRoot_0(p_0),
                             _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(2n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(2n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_6.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            '未登録または凍結中の口座です');
    return [];
  }
  async _spend_0(context, partialProofData, n_0) {
    const cm_0 = this._noteCommitment_0(n_0);
    const p_0 = this._notePath_0(context, partialProofData, cm_0);
    __compactRuntime.assert(this._equal_2(p_0.leaf, cm_0), 'ノートの証明が一致しません');
    let tmp_0;
    __compactRuntime.assert((tmp_0 = this._merkleTreePathRoot_0(p_0),
                             _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(3n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(2n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(tmp_0),
                                                                                                                                               alignment: _descriptor_6.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value)),
                            '存在しないノートです');
    const nul_0 = this._nullifierOf_0(n_0);
    __compactRuntime.assert(!_descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(5n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(nul_0),
                                                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            '使用済みのノートです');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(5n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(nul_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _output_0(context, partialProofData, n_0, ownerPk_0) {
    const cm_0 = this._noteCommitment_0(n_0);
    __compactRuntime.assert(!_descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_27.toValue(4n),
                                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                                                                               alignment: _descriptor_1.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            '同じノートがすでにあります');
    const e_0 = this._ephemeralKey_0(context, partialProofData);
    const c_0 = { epk: this._ecMulGenerator_0(e_0),
                  toOwner: this._encryptTo_0(ownerPk_0, e_0, n_0),
                  toBank:
                    this._encryptTo_0(_descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                                partialProofData,
                                                                                                [
                                                                                                 { dup: { n: 0 } },
                                                                                                 { idx: { cached: false,
                                                                                                          pushPath: false,
                                                                                                          path: [
                                                                                                                 { tag: 'value',
                                                                                                                   value: { value: _descriptor_27.toValue(1n),
                                                                                                                            alignment: _descriptor_27.alignment() } }] } },
                                                                                                 { popeq: { cached: false,
                                                                                                            result: undefined } }]).value),
                                      e_0,
                                      n_0) };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(3n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_1.toValue(cm_0),
                                                                                                alignment: _descriptor_1.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { addi: { immediate: 1 } },
                                       { ins: { cached: true, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(4n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(cm_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_9.toValue(c_0),
                                                                                              alignment: _descriptor_9.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    return [];
  }
  async _registerAccount_0(context, partialProofData, leaf_0, index_0) {
    await this._assertIssuer_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(index_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_1.toValue(leaf_0),
                                                                                                alignment: _descriptor_1.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(index_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { addi: { immediate: 1 } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'lt',
                                       { branch: { skip: 2 } },
                                       'pop',
                                       { jmp: { skip: 2 } },
                                       { swap: { n: 0 } },
                                       'pop',
                                       { ins: { cached: false, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    return [];
  }
  async _freezeAccount_0(context, partialProofData, index_0) {
    await this._assertIssuer_0(context, partialProofData);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(index_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell(__compactRuntime.leafHash(
                                                                                              { value: _descriptor_1.toValue(new Uint8Array(32)),
                                                                                                alignment: _descriptor_1.alignment() }
                                                                                            )).encode() } },
                                       { ins: { cached: false, n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(1n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(index_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { addi: { immediate: 1 } },
                                       { dup: { n: 1 } },
                                       { dup: { n: 1 } },
                                       'lt',
                                       { branch: { skip: 2 } },
                                       'pop',
                                       { jmp: { skip: 2 } },
                                       { swap: { n: 0 } },
                                       'pop',
                                       { ins: { cached: false, n: 1 } },
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 2 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(2n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(2n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { dup: { n: 2 } },
                                       { idx: { cached: false,
                                                pushPath: false,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_27.toValue(0n),
                                                                  alignment: _descriptor_27.alignment() } }] } },
                                       'root',
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: true, n: 3 } }]);
    return [];
  }
  async _issue_0(context, partialProofData, n_0, m_0) {
    await this._assertIssuer_0(context, partialProofData);
    __compactRuntime.assert(this._equal_3(n_0.owner, m_0.id), '発行先の口座が一致しません');
    await this._assertMember_0(context, partialProofData, m_0);
    await this._output_0(context, partialProofData, n_0, m_0.encPk);
    const tmp_0 = ((t1) => {
                    if (t1 > 18446744073709551615n) {
                      throw new __compactRuntime.CompactError('tdeposit_private.compact line 177 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 18446744073709551615');
                    }
                    return t1;
                  })(_descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_27.toValue(6n),
                                                                                                           alignment: _descriptor_27.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value)
                     +
                     n_0.value);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  async _forceTransfer_0(context,
                         partialProofData,
                         input_0,
                         to_0,
                         toMember_0,
                         change_0,
                         changePk_0)
  {
    await this._assertIssuer_0(context, partialProofData);
    await this._spend_0(context, partialProofData, input_0);
    __compactRuntime.assert(this._equal_4(to_0.owner, toMember_0.id),
                            '送金先の口座が一致しません');
    await this._assertMember_0(context, partialProofData, toMember_0);
    __compactRuntime.assert(this._equal_5(change_0.owner, input_0.owner),
                            'おつりは元の所有者に戻します');
    __compactRuntime.assert(to_0.value + change_0.value === input_0.value,
                            '金額が一致しません');
    await this._output_0(context, partialProofData, to_0, toMember_0.encPk);
    await this._output_0(context, partialProofData, change_0, changePk_0);
    return [];
  }
  async _forceRedeem_0(context, partialProofData, input_0) {
    await this._assertIssuer_0(context, partialProofData);
    await this._spend_0(context, partialProofData, input_0);
    let t_0, t_1;
    const tmp_0 = (t_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_27.toValue(6n),
                                                                                                               alignment: _descriptor_27.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                   (t_1 = input_0.value,
                    (__compactRuntime.assert(t_0 >= t_1,
                                             'result of subtraction would be negative'),
                     t_0 - t_1)));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  async _transfer_0(context,
                    partialProofData,
                    input_0,
                    me_0,
                    to_0,
                    toMember_0,
                    change_0)
  {
    __compactRuntime.assert(this._equal_6(me_0.id,
                                          this._accountId_0(this._localSecretKey_0(context,
                                                                                   partialProofData))),
                            '自分の口座ではありません');
    __compactRuntime.assert(this._equal_7(input_0.owner, me_0.id),
                            '自分のノートではありません');
    await this._assertMember_0(context, partialProofData, me_0);
    __compactRuntime.assert(this._equal_8(to_0.owner, toMember_0.id),
                            '送金先の口座が一致しません');
    await this._assertMember_0(context, partialProofData, toMember_0);
    await this._spend_0(context, partialProofData, input_0);
    __compactRuntime.assert(this._equal_9(change_0.owner, me_0.id),
                            'おつりは自分に戻します');
    __compactRuntime.assert(to_0.value + change_0.value === input_0.value,
                            '金額が一致しません');
    await this._output_0(context, partialProofData, to_0, toMember_0.encPk);
    await this._output_0(context, partialProofData, change_0, me_0.encPk);
    return [];
  }
  async _redeem_0(context, partialProofData, input_0, me_0) {
    __compactRuntime.assert(this._equal_10(me_0.id,
                                           this._accountId_0(this._localSecretKey_0(context,
                                                                                    partialProofData))),
                            '自分の口座ではありません');
    __compactRuntime.assert(this._equal_11(input_0.owner, me_0.id),
                            '自分のノートではありません');
    await this._assertMember_0(context, partialProofData, me_0);
    await this._spend_0(context, partialProofData, input_0);
    let t_0, t_1;
    const tmp_0 = (t_0 = _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_27.toValue(6n),
                                                                                                               alignment: _descriptor_27.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value),
                   (t_1 = input_0.value,
                    (__compactRuntime.assert(t_0 >= t_1,
                                             'result of subtraction would be negative'),
                     t_0 - t_1)));
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_27.toValue(6n),
                                                                                              alignment: _descriptor_27.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _folder_0(f, x, a0) {
    for (let i = 0; i < 10; i++) { x = f(x, a0[i]); }
    return x;
  }
  _equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_3(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_4(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_5(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_6(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_7(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_8(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_9(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_10(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
  _equal_11(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) { return false; }
    return true;
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    callContext: { currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() },
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    get issuer() {
      return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(0n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get bankEncPk() {
      return _descriptor_4.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(1n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    members: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(1024n),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'tdeposit_private.compact line 46 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_6.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'tdeposit_private.compact line 46 char 1',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'tdeposit_private.compact line 46 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[2];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'tdeposit_private.compact line 46 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[2];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[2];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    notes: {
      isFull(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isFull: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(3n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(1n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(1024n),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'lt',
                                                                          'neg',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      checkRoot(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`checkRoot: expected 1 argument, received ${args_0.length}`);
        }
        const rt_0 = args_0[0];
        if (!(typeof(rt_0) === 'object' && typeof(rt_0.field) === 'bigint' && rt_0.field >= 0 && rt_0.field <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('checkRoot',
                                     'argument 1',
                                     'tdeposit_private.compact line 47 char 1',
                                     'struct MerkleTreeDigest<field: Field>',
                                     rt_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(3n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(2n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_6.toValue(rt_0),
                                                                                                                                 alignment: _descriptor_6.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      root(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`root: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return ((result) => result             ? __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(result)             : undefined)(self_0.asArray()[0].asBoundedMerkleTree().rehash().root()?.value);
      },
      firstFree(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`first_free: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return __compactRuntime.CompactTypeField.fromValue(self_0.asArray()[1].asCell().value);
      },
      pathForLeaf(...args_0) {
        if (args_0.length !== 2) {
          throw new __compactRuntime.CompactError(`path_for_leaf: expected 2 arguments, received ${args_0.length}`);
        }
        const index_0 = args_0[0];
        const leaf_0 = args_0[1];
        if (!(typeof(index_0) === 'bigint' && index_0 >= 0 && index_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 1',
                                     'tdeposit_private.compact line 47 char 1',
                                     'Field',
                                     index_0)
        }
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('path_for_leaf',
                                     'argument 2',
                                     'tdeposit_private.compact line 47 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[3];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().pathForLeaf(    index_0,    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      },
      findPathForLeaf(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`find_path_for_leaf: expected 1 argument, received ${args_0.length}`);
        }
        const leaf_0 = args_0[0];
        if (!(leaf_0.buffer instanceof ArrayBuffer && leaf_0.BYTES_PER_ELEMENT === 1 && leaf_0.length === 32)) {
          __compactRuntime.typeError('find_path_for_leaf',
                                     'argument 1',
                                     'tdeposit_private.compact line 47 char 1',
                                     'Bytes<32>',
                                     leaf_0)
        }
        const self_0 = state.asArray()[3];
        return ((result) => result             ? new __compactRuntime.CompactTypeMerkleTreePath(10, _descriptor_1).fromValue(result)             : undefined)(  self_0.asArray()[0].asBoundedMerkleTree().rehash().findPathForLeaf(    {      value: _descriptor_1.toValue(leaf_0),      alignment: _descriptor_1.alignment()    }  )?.value);
      },
      history(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`history: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[3];
        return self_0.asArray()[2].asMap().keys().map(  (elem) => __compactRuntime.CompactTypeMerkleTreeDigest.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    ciphers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(4n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(4n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'tdeposit_private.compact line 48 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(4n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(key_0),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'tdeposit_private.compact line 48 char 1',
                                     'Bytes<32>',
                                     key_0)
        }
        return _descriptor_9.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(4n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_1.toValue(key_0),
                                                                                                     alignment: _descriptor_1.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_1.fromValue(key.value),      _descriptor_9.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    nullifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(5n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(5n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          'size',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(elem_0.buffer instanceof ArrayBuffer && elem_0.BYTES_PER_ELEMENT === 1 && elem_0.length === 32)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'tdeposit_private.compact line 49 char 1',
                                     'Bytes<32>',
                                     elem_0)
        }
        return _descriptor_7.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_27.toValue(5n),
                                                                                                     alignment: _descriptor_27.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_1.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[5];
        return self_0.asMap().keys().map((elem) => _descriptor_1.fromValue(elem.value))[Symbol.iterator]();
      }
    },
    get totalSupply() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_27.toValue(6n),
                                                                                                   alignment: _descriptor_27.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  callContext: { currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress()), currentGasCost: __compactRuntime.emptyRunningCost() }
};
const _dummyContract = new Contract({
  localSecretKey: (...args) => undefined,
  memberPath: (...args) => undefined,
  notePath: (...args) => undefined,
  ephemeralKey: (...args) => undefined
});
export const pureCircuits = {
  accountId: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`accountId: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const sk_0 = args_0[0];
    if (!(sk_0.buffer instanceof ArrayBuffer && sk_0.BYTES_PER_ELEMENT === 1 && sk_0.length === 32)) {
      __compactRuntime.typeError('accountId',
                                 'argument 1',
                                 'tdeposit_private.compact line 65 char 1',
                                 'Bytes<32>',
                                 sk_0)
    }
    return _dummyContract._accountId_0(sk_0);
  },
  memberLeaf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`memberLeaf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const m_0 = args_0[0];
    if (!(typeof(m_0) === 'object' && m_0.id.buffer instanceof ArrayBuffer && m_0.id.BYTES_PER_ELEMENT === 1 && m_0.id.length === 32 && typeof(m_0.encPk.x) === 'bigint' && m_0.encPk.x >= 0n && m_0.encPk.x <= __compactRuntime.MAX_FIELD && typeof(m_0.encPk.y) === 'bigint' && m_0.encPk.y >= 0n && m_0.encPk.y <= __compactRuntime.MAX_FIELD && m_0.salt.buffer instanceof ArrayBuffer && m_0.salt.BYTES_PER_ELEMENT === 1 && m_0.salt.length === 32)) {
      __compactRuntime.typeError('memberLeaf',
                                 'argument 1',
                                 'tdeposit_private.compact line 69 char 1',
                                 'struct Member<id: Bytes<32>, encPk: JubjubPoint, salt: Bytes<32>>',
                                 m_0)
    }
    return _dummyContract._memberLeaf_0(m_0);
  },
  noteCommitment: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`noteCommitment: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const n_0 = args_0[0];
    if (!(typeof(n_0) === 'object' && n_0.owner.buffer instanceof ArrayBuffer && n_0.owner.BYTES_PER_ELEMENT === 1 && n_0.owner.length === 32 && typeof(n_0.value) === 'bigint' && n_0.value >= 0n && n_0.value <= 18446744073709551615n && typeof(n_0.rand) === 'bigint' && n_0.rand >= 0 && n_0.rand <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('noteCommitment',
                                 'argument 1',
                                 'tdeposit_private.compact line 74 char 1',
                                 'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                 n_0)
    }
    return _dummyContract._noteCommitment_0(n_0);
  },
  nullifierOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`nullifierOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const n_0 = args_0[0];
    if (!(typeof(n_0) === 'object' && n_0.owner.buffer instanceof ArrayBuffer && n_0.owner.BYTES_PER_ELEMENT === 1 && n_0.owner.length === 32 && typeof(n_0.value) === 'bigint' && n_0.value >= 0n && n_0.value <= 18446744073709551615n && typeof(n_0.rand) === 'bigint' && n_0.rand >= 0 && n_0.rand <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('nullifierOf',
                                 'argument 1',
                                 'tdeposit_private.compact line 82 char 1',
                                 'struct Note<owner: Bytes<32>, value: Uint<0..18446744073709551616>, rand: Field>',
                                 n_0)
    }
    return _dummyContract._nullifierOf_0(n_0);
  },
  ownerTag: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`ownerTag: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const id_0 = args_0[0];
    if (!(id_0.buffer instanceof ArrayBuffer && id_0.BYTES_PER_ELEMENT === 1 && id_0.length === 32)) {
      __compactRuntime.typeError('ownerTag',
                                 'argument 1',
                                 'tdeposit_private.compact line 87 char 1',
                                 'Bytes<32>',
                                 id_0)
    }
    return _dummyContract._ownerTag_0(id_0);
  },
  encPkOf: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`encPkOf: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const s_0 = args_0[0];
    if (!(typeof(s_0) === 'bigint' && s_0 >= 0 && s_0 <= __compactRuntime.MAX_JUBJUB_SCALAR)) {
      __compactRuntime.typeError('encPkOf',
                                 'argument 1',
                                 'tdeposit_private.compact line 91 char 1',
                                 'JubjubScalar',
                                 s_0)
    }
    return _dummyContract._encPkOf_0(s_0);
  },
  decrypt: (...args_0) => {
    if (args_0.length !== 3) {
      throw new __compactRuntime.CompactError(`decrypt: expected 3 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const s_0 = args_0[0];
    const epk_0 = args_0[1];
    const c_0 = args_0[2];
    if (!(typeof(s_0) === 'bigint' && s_0 >= 0 && s_0 <= __compactRuntime.MAX_JUBJUB_SCALAR)) {
      __compactRuntime.typeError('decrypt',
                                 'argument 1',
                                 'tdeposit_private.compact line 110 char 1',
                                 'JubjubScalar',
                                 s_0)
    }
    if (!(typeof(epk_0.x) === 'bigint' && epk_0.x >= 0n && epk_0.x <= __compactRuntime.MAX_FIELD && typeof(epk_0.y) === 'bigint' && epk_0.y >= 0n && epk_0.y <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('decrypt',
                                 'argument 2',
                                 'tdeposit_private.compact line 110 char 1',
                                 'JubjubPoint',
                                 epk_0)
    }
    if (!(Array.isArray(c_0) && c_0.length === 3 && c_0.every((t) => typeof(t) === 'bigint' && t >= 0 && t <= __compactRuntime.MAX_FIELD))) {
      __compactRuntime.typeError('decrypt',
                                 'argument 3',
                                 'tdeposit_private.compact line 110 char 1',
                                 'Vector<3, Field>',
                                 c_0)
    }
    return _dummyContract._decrypt_0(s_0, epk_0, c_0);
  }
};
export const expectedVk = {};

export const circuitSignatures = {
  'accountId': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Bytes', length: 32}},
  'memberLeaf': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Bytes', length: 32}},
  'noteCommitment': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}], resultType: {tag: 'Bytes', length: 32}},
  'nullifierOf': {pure: true, provable: false, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}], resultType: {tag: 'Bytes', length: 32}},
  'ownerTag': {pure: true, provable: false, argumentTypes: [{tag: 'Bytes', length: 32}], resultType: {tag: 'Field'}},
  'encPkOf': {pure: true, provable: false, argumentTypes: [{tag: 'JubjubScalar'}], resultType: {tag: 'JubjubPoint'}},
  'decrypt': {pure: true, provable: false, argumentTypes: [{tag: 'JubjubScalar'}, {tag: 'JubjubPoint'}, {tag: 'Vector', length: 3, type: {tag: 'Field'}}], resultType: {tag: 'Vector', length: 3, type: {tag: 'Field'}}},
  'registerAccount': {pure: false, provable: true, argumentTypes: [{tag: 'Bytes', length: 32}, {tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'freezeAccount': {pure: false, provable: true, argumentTypes: [{tag: 'Uint', maxval: '18446744073709551615'}], resultType: {tag: 'Tuple', types: []}},
  'issue': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Tuple', types: []}},
  'forceTransfer': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}, {tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'JubjubPoint'}], resultType: {tag: 'Tuple', types: []}},
  'forceRedeem': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}},
  'transfer': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}, {tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}, {tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}], resultType: {tag: 'Tuple', types: []}},
  'redeem': {pure: false, provable: true, argumentTypes: [{tag: 'Struct', name: 'Note', elements: [{name: 'owner', type: {tag: 'Bytes', length: 32}}, {name: 'value', type: {tag: 'Uint', maxval: '18446744073709551615'}}, {name: 'rand', type: {tag: 'Field'}}]}, {tag: 'Struct', name: 'Member', elements: [{name: 'id', type: {tag: 'Bytes', length: 32}}, {name: 'encPk', type: {tag: 'JubjubPoint'}}, {name: 'salt', type: {tag: 'Bytes', length: 32}}]}], resultType: {tag: 'Tuple', types: []}},
};

export const declaredInterfaces = {};

//# sourceMappingURL=index.js.map
