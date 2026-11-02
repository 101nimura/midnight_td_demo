/**
 * ブラウザ用のシンプルなプライベートステートプロバイダ（メモリ保持）。
 * 本デモでは操作のたびに「現在選択中の口座の秘密鍵」をセットし直すため、
 * 永続化は identities.ts（localStorage）側で行う。
 */
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/compact-runtime';
import type {
  PrivateStateExport,
  PrivateStateId,
  PrivateStateProvider,
  SigningKeyExport,
} from '@midnight-ntwrk/midnight-js-types';

export const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> => {
  const states = new Map<ContractAddress, Map<PSI, PS>>();
  const signingKeys = new Map<ContractAddress, SigningKey>();
  let current: ContractAddress | null = null;

  const scope = (): Map<PSI, PS> => {
    if (current === null) throw new Error('Contract address not set');
    let m = states.get(current);
    if (!m) {
      m = new Map();
      states.set(current, m);
    }
    return m;
  };

  return {
    setContractAddress(address) {
      current = address;
    },
    async set(id, state) {
      scope().set(id, state);
    },
    async get(id) {
      return scope().get(id) ?? null;
    },
    async remove(id) {
      scope().delete(id);
    },
    async clear() {
      if (current) states.delete(current);
    },
    async setSigningKey(address, key) {
      signingKeys.set(address, key);
    },
    async getSigningKey(address) {
      return signingKeys.get(address) ?? null;
    },
    async removeSigningKey(address) {
      signingKeys.delete(address);
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    async exportPrivateStates(): Promise<PrivateStateExport> {
      throw new Error('exportPrivateStates is not supported in this demo');
    },
    async importPrivateStates() {
      throw new Error('importPrivateStates is not supported in this demo');
    },
    async exportSigningKeys(): Promise<SigningKeyExport> {
      throw new Error('exportSigningKeys is not supported in this demo');
    },
    async importSigningKeys() {
      throw new Error('importSigningKeys is not supported in this demo');
    },
  };
};
