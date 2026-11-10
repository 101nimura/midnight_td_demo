/**
 * ブラウザ用のシンプルなプライベートステートプロバイダ（メモリ保持）。midnight-js 5.0.0 の形
 * （コントラクトごとのビューを forContract で取り出す）に合わせている。
 * 本デモでは操作のたびに「現在選択中の口座の秘密鍵」をセットし直すため、
 * 永続化は口座鍵の管理側（localStorage）で行う。
 */
import type { ContractPrivateStates, PrivateStateId, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

type Address = Parameters<PrivateStateProvider['forContract']>[0];
type SigningKey = NonNullable<Awaited<ReturnType<PrivateStateProvider['getSigningKey']>>>;

const unsupported = (what: string) => async (): Promise<never> => {
  throw new Error(`${what} is not supported in this demo`);
};

export const inMemoryPrivateStateProvider = <PSI extends PrivateStateId, PS>(): PrivateStateProvider<PSI, PS> => {
  const states = new Map<string, Map<PSI, PS>>();
  const signingKeys = new Map<string, SigningKey>();
  // midnight-js 5.0.0 ではアドレスを小文字で比較する
  const norm = (a: Address) => String(a).toLowerCase();

  const forContract = (contractAddress: Address): ContractPrivateStates<PSI, PS> => {
    const key = norm(contractAddress);
    const scope = () => {
      let m = states.get(key);
      if (!m) {
        m = new Map();
        states.set(key, m);
      }
      return m;
    };
    return {
      contractAddress,
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
        states.delete(key);
      },
      exportPrivateStates: unsupported('exportPrivateStates'),
      importPrivateStates: unsupported('importPrivateStates'),
    };
  };

  return {
    forContract,
    async clearAll() {
      states.clear();
    },
    async setSigningKey(address, key) {
      signingKeys.set(norm(address), key);
    },
    async getSigningKey(address) {
      return signingKeys.get(norm(address)) ?? null;
    },
    async removeSigningKey(address) {
      signingKeys.delete(norm(address));
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    exportSigningKeys: unsupported('exportSigningKeys'),
    importSigningKeys: unsupported('importSigningKeys'),
  };
};
