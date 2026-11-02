/**
 * デモ用の「口座鍵」管理。
 * 1 つのブラウザ・1 つの Lace ウォレットで、銀行／利用者 A／利用者 B…を切り替えて操作できるよう、
 * 口座ごとの秘密鍵を localStorage に保存する（※本番では絶対に行わないこと。ISSUES.md 参照）。
 */
import { toHex, fromHex } from '@midnight-ntwrk/compact-runtime';
import { accountIdOf } from '../contract';

export type Identity = {
  label: string;
  role: 'bank' | 'customer';
  secretKeyHex: string;
  accountIdHex: string;
};

const STORAGE_KEY = 'tdeposit.identities.v1';

const randomKey = (): Uint8Array => {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return b;
};

export const makeIdentity = (label: string, role: Identity['role'], sk: Uint8Array = randomKey()): Identity => ({
  label,
  role,
  secretKeyHex: toHex(sk),
  accountIdHex: toHex(accountIdOf(sk)),
});

export const loadIdentities = (): Identity[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const list = JSON.parse(raw) as Identity[];
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {
      /* fallthrough */
    }
  }
  const defaults = [
    makeIdentity('デモ銀行（発行体）', 'bank'),
    makeIdentity('利用者A（株式会社アルファ）', 'customer'),
    makeIdentity('利用者B（ベータ商事）', 'customer'),
  ];
  saveIdentities(defaults);
  return defaults;
};

export const saveIdentities = (list: Identity[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

export const secretKeyOf = (i: Identity): Uint8Array => fromHex(i.secretKeyHex);

export const isHex32 = (s: string) => /^(0x)?[0-9a-fA-F]{64}$/.test(s.trim());
export const normalizeHex = (s: string) => s.trim().replace(/^0x/, '').toLowerCase();
