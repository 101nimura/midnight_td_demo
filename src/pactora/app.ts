/**
 * Pactora UI 版 トークン化預金デモ（Midnight Preview × Lace）
 * ---------------------------------------------------------------------------
 *  - 画面・挙動は pactora-phase2-usecase-mock.html（業務 01 トークン化預金）をベースにしている
 *    （CSS はモックからそのまま流用：pactora.css）
 *  - モックの「署名リクエスト」を、実際の Midnight トランザクション
 *    （ブラウザ内で回路を実行 → ZK 証明 → Lace で承認・DUST 支払い → 送信 → ブロック取り込み）に置き換えた
 *  - オンチェーン：提供開始（デプロイ）／口座登録／発行（mint）／送金／償還（burn）／強制移転／強制償還／凍結／全体停止
 *  - オフチェーン（このブラウザの localStorage）：普通預金（勘定系の模擬）・入出金の申込・返却依頼・
 *    強制移転の申請・照合結果・監査ログ（Tx ハッシュ）
 */
import { fromHex, toHex } from '@midnight-ntwrk/compact-runtime';
import { accountIdOf, OpKind } from '../contract';
import { connectWallet, describeError, NETWORK_ID, readWalletStatus, type Session } from '../midnight/wallet';
import { TDepositAPI, type TDepositState, type TxResult } from '../midnight/tdepositApi';

/* =====================================================================
 * データ定義
 * ===================================================================== */
const ICON = '<svg viewBox="0 0 414 414"><circle fill="#002496" cx="207" cy="207" r="207"/><path fill="#fff" d="M188.078,84.786h-.017c-54.145-.003-98.041,43.887-98.044,98.032-.001,23.86-.003,47.831-.006,66.44-.001.016-.009.03-.009.047l.003,26.356c-.001,3.078-.003,5.383-.004,6.758,0,.017.004.033.005.049v7.103c.003,21.896,17.756,39.645,39.652,39.642h0c22.561-.002,40.849-18.292,40.85-40.853v-.007c0-1.51-.092-2.999-.257-4.466l20.821-.002c54.155-.006,98.05-43.912,98.044-98.067h0c-.006-55.798-45.24-101.029-101.038-101.033Z"/><path fill="#00e3d7" d="M317.993,216.198h-48.794v.058c-30.147,1.201-54.222,26.008-54.222,56.45,0,31.208,25.299,56.508,56.508,56.508,30.442,0,55.249-24.075,56.45-54.222h.058v-48.793c0-5.523-4.477-10-10-10Z"/></svg>';

type Role = 'bank' | 'admin' | 'investor' | 'auditor';
type Side = 'money' | 'inv' | 'ops';
type UserId = 'bank' | 'adm1' | 'invA' | 'invB' | 'auditor';
/** 口座鍵を持つ（オンチェーンの口座がある）ユーザー */
type Holder = 'bank' | 'invA' | 'invB';
const HOLDERS: Holder[] = ['bank', 'invA', 'invB'];
const INVESTORS: Holder[] = ['invA', 'invB'];

const ROLE_COLOR: Record<Role, string> = { bank: '#5B4B8A', admin: '#2E6F95', investor: '#2F7A6B', auditor: '#8C3B4E' };
const ROLE_ORDER: Role[] = ['bank', 'investor', 'admin', 'auditor'];
const ROLE: Record<Role, { label: string; side: Side }> = {
  bank: { label: '発行銀行', side: 'money' },
  investor: { label: '投資家', side: 'inv' },
  admin: { label: 'Pactora運用', side: 'ops' },
  auditor: { label: '監察機関', side: 'ops' },
};
const SIDE: Record<Side, { label: string; cls: string; color: string }> = {
  money: { label: '資金サイドの発行者', cls: 'money', color: '#9a6200' },
  inv: { label: '投資家・預金者', cls: 'inv', color: '#24624a' },
  ops: { label: '運用・監督', cls: 'ops', color: '#4a5468' },
};
const SIDE_ORDER: Side[] = ['money', 'inv', 'ops'];

type User = { name: string; org: string; dept: string; role: Role; ini: string; email: string; desc: string };
const USERS: Record<UserId, User> = {
  bank: { name: '小林 修', org: '△△銀行', dept: 'デジタル預金部（預金トークンの発行銀行）', role: 'bank', ini: '△', email: 'bank01@demo.pactora',
    desc: '預金トークンの提供開始（デプロイ）・口座登録・発行（mint）・出金処理、口座の凍結・全体停止、強制移転の承認' },
  invA: { name: '森 健太', org: '◎◎物流株式会社', dept: '財務部（法人投資家A）', role: 'investor', ini: 'A', email: 'inv-a@demo.pactora',
    desc: '預金トークンの入金・出金（償還）・送金、誤送金の返却依頼' },
  invB: { name: '藤井 彩', org: '☆☆商事株式会社', dept: '経理部（法人投資家B）', role: 'investor', ini: 'B', email: 'inv-b@demo.pactora',
    desc: '送金の受取、口座が凍結されると送金できないことの確認' },
  adm1: { name: '加藤 真一', org: 'Pactora運用チーム', dept: '運用担当', role: 'admin', ini: '加', email: 'ops01@demo.pactora',
    desc: '返却依頼の調査と強制移転の申請、預金台帳とオンチェーン残高の照合、監査ログ' },
  auditor: { name: '岡田 隆', org: '監督当局・監査人', dept: 'オブザーバー', role: 'auditor', ini: '監', email: 'audit@demo.pactora',
    desc: '発行残高・取引履歴・監査ログの確認（閲覧のみ）' },
};
const UC_USERS: UserId[] = ['bank', 'invA', 'invB', 'adm1', 'auditor'];
const UC = {
  no: '01', name: 'トークン化預金', en: 'Tokenized Deposit',
  lead: '△△銀行が円建て預金トークン（PAC1JPY）を Midnight 上で発行・償還。口座登録（KYC）・送金・誤送金の強制移転・凍結・照合を、実際のトランザクションで確認する。',
};
const TOKEN_DEFAULT = { name: '△△銀行 預金トークン（JPY）', sym: 'PAC1JPY' };

const OP_LABEL: Record<number, string> = {
  [OpKind.REGISTER]: '口座登録', [OpKind.ISSUE]: '発行（mint）', [OpKind.TRANSFER]: '送金', [OpKind.REDEEM]: '償還（burn）',
  [OpKind.FORCE_TRANSFER]: '強制移転', [OpKind.FORCE_REDEEM]: '強制償還', [OpKind.FREEZE]: '凍結', [OpKind.UNFREEZE]: '凍結解除',
  [OpKind.PAUSE]: '全体停止', [OpKind.UNPAUSE]: '停止解除',
};
const OP_TONE: Record<number, string> = {
  [OpKind.REGISTER]: 'info', [OpKind.ISSUE]: 'money', [OpKind.TRANSFER]: 'dvp', [OpKind.REDEEM]: 'mute', [OpKind.FORCE_TRANSFER]: 'ng',
  [OpKind.FORCE_REDEEM]: 'ng', [OpKind.FREEZE]: 'ng', [OpKind.UNFREEZE]: 'ok', [OpKind.PAUSE]: 'ng', [OpKind.UNPAUSE]: 'ok',
};

/* =====================================================================
 * ヘルパー
 * ===================================================================== */
const pad = (n: number) => String(n).padStart(2, '0');
const num = (n: number | bigint) => (typeof n === 'bigint' ? n.toLocaleString('ja-JP') : Math.round(n).toLocaleString('ja-JP'));
const yen = (n: number | bigint) => '¥' + num(n);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const short = (h: string, n = 8) => (h && h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-6)}` : h || '—');
const digits = (v: unknown) => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
const bd = (t: string, tone: string) => `<span class="bd bd-${tone}">${t}</span>`;
const chainBd = () => '<span class="bd bd-chain">Midnight</span>';
const roleOf = (id: UserId) => USERS[id].role;
const sideOf = (id: UserId) => ROLE[roleOf(id)].side;
const roleBd = (id: UserId) => bd(ROLE[roleOf(id)].label, SIDE[sideOf(id)].cls);
const av = (id: UserId, small?: boolean) => `<span class="av ${small ? 's' : ''}" style="background:${ROLE_COLOR[roleOf(id)]}">${USERS[id].ini}</span>`;
const nm = (id: UserId) => USERS[id].name;
const orgOf = (id: UserId) => USERS[id].org;
const who = (id: UserId) => `${USERS[id].org}（${USERS[id].name}）`;
const txSpan = (tx?: string) => (tx ? `<span class="mono" title="${esc(tx)}">${esc(short(tx, 6))}</span>` : '—');
const kvs = (rows: [string, string][]) => `<div class="kvs">${rows.map(([k, v]) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('')}</div>`;

/* =====================================================================
 * 口座鍵（オンチェーン口座の秘密鍵）。業務データの初期化では消さない
 * ===================================================================== */
type Key = { sk: string; id: string };
const KEYS_KEY = 'pactora-mn-tdeposit.keys.v1';
const newKey = (): Key => { const b = new Uint8Array(32); crypto.getRandomValues(b); return { sk: toHex(b), id: toHex(accountIdOf(b)) }; };
const keyFromSk = (skHex: string): Key => { const sk = fromHex(skHex.trim().replace(/^0x/, '').toLowerCase()); if (sk.length !== 32) throw new Error('口座鍵は 64 桁の 16 進数です'); return { sk: toHex(sk), id: toHex(accountIdOf(sk)) }; };
let KEYS: Record<Holder, Key> = (() => {
  let k: Partial<Record<Holder, Key>> = {};
  try { k = JSON.parse(localStorage.getItem(KEYS_KEY) || '{}'); } catch { k = {}; }
  HOLDERS.forEach((h) => { if (!k[h] || !k[h]!.sk) k[h] = newKey(); });
  localStorage.setItem(KEYS_KEY, JSON.stringify(k));
  return k as Record<Holder, Key>;
})();
const saveKeys = () => localStorage.setItem(KEYS_KEY, JSON.stringify(KEYS));
const isHolder = (id: UserId): id is Holder => (HOLDERS as string[]).includes(id);
const skOf = (h: Holder) => fromHex(KEYS[h].sk);
const idBytes = (h: Holder) => fromHex(KEYS[h].id);
const holderByHex = (hex: string): Holder | undefined => HOLDERS.find((h) => KEYS[h].id === hex);
const nameOfHex = (hex: string) => { const h = holderByHex(hex); if (h) return orgOf(h); if (CS && hex === CS.issuerHex) return '発行体（別の鍵）'; return `<span class="mono">${short(hex, 6)}</span>`; };

/* =====================================================================
 * 状態（オフチェーン：localStorage）
 * ===================================================================== */
type Mint = { id: string; ts: string; party: Holder; kind: '入金' | '出金'; amount: number; status: '処理中' | '完了'; tx?: string; burnTx?: string };
type Xfer = { id: string; ts: string; from: Holder; to: Holder; amount: number; tx: string };
type Inq = { id: string; xid: string; ts: string; from: Holder; to: Holder; amount: number; tx: string; reason: string; status: '受付' | '申請済' | '完了' };
type Recov = { id: string; inq: string; from: Holder; to: Holder; amount: number; reason: string; maker: UserId; status: '承認待ち' | '実行済'; tx?: string };
type Ev = { ts: string; user: UserId | null; op: string; target: string; result: string; tx: string | null; block?: string };
type Recon = { ts: string; ledger: number; chain: number; diff: number; pendIn: number; pendOut: number; ok: boolean };
type UI = { screen: 'usecase' | 'provision' | 'login' | 'app'; user: UserId | null; page: string; tab: 'guide' | 'menu'; pop: string | null; sel: UserId | null; form: Record<string, string>; loginErr: boolean; bandMin?: boolean };
type State = {
  v: 1; contract: string | null; token: { name: string; sym: string };
  ui: UI; acct: Record<Holder, number>; lock: number;
  mints: Mint[]; xfers: Xfer[]; inq: Inq[]; recov: Recov[]; recon: Recon | null; events: Ev[];
  flags: Record<string, boolean>; seq: { m: number; t: number; q: number; r: number }; gcur: number;
};
const KEY = 'pactora-mn-tdeposit.state.v1';
function defaultState(): State {
  return {
    v: 1, contract: null, token: { ...TOKEN_DEFAULT },
    ui: { screen: 'usecase', user: null, page: 'home', tab: 'guide', pop: null, sel: null, form: {}, loginErr: false },
    acct: { bank: 0, invA: 800000000, invB: 300000000 }, lock: 0,
    mints: [], xfers: [], inq: [], recov: [], recon: null, events: [], flags: {}, seq: { m: 0, t: 0, q: 0, r: 0 }, gcur: 0,
  };
}
let S: State;
try { S = JSON.parse(localStorage.getItem(KEY) || 'null') || defaultState(); if (S.v !== 1) S = defaultState(); } catch { S = defaultState(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } }
const U = () => S.ui;
const me = () => U().user as UserId;
const myRole = () => roleOf(me());
function addEvent(op: string, target: string, result?: string, tx?: string | null, block?: unknown) {
  S.events.unshift({ ts: now(), user: U().user, op, target, result: result || '成功', tx: tx || null, block: block === undefined ? undefined : String(block) });
}

/* =====================================================================
 * 実行時の状態（Lace・コントラクト・オンチェーンの状態）
 * ===================================================================== */
let SESSION: Session | undefined;
let API: TDepositAPI | undefined;
let CS: TDepositState | undefined;
let SUB: { unsubscribe(): void } | undefined;
let BUSY = false;
type LogLine = { at: string; level: 'info' | 'ok' | 'error'; msg: string };
const LOGS: LogLine[] = [];
let LOG_HOOK: ((msg: string) => void) | null = null;
function log(msg: string, level: LogLine['level'] = 'info') {
  LOGS.unshift({ at: new Date().toLocaleTimeString('ja-JP'), level, msg });
  if (LOGS.length > 300) LOGS.length = 300;
  if (level === 'error') console.error(msg); else console.log(msg);
  LOG_HOOK?.(msg);
}

const acctOf = (h: Holder) => CS?.accounts.find((a) => a.accountIdHex === KEYS[h].id);
const isReg = (h: Holder) => !!acctOf(h);
const tbal = (h: Holder): bigint => acctOf(h)?.balance ?? 0n;
const isFrz = (h: Holder) => !!acctOf(h)?.frozen;
const isPaused = () => !!CS?.paused;
const iAmIssuer = () => !!CS && CS.issuerHex === KEYS.bank.id;
const histHas = (kind: OpKind, f?: (r: TDepositState['history'][number]) => boolean) => !!CS?.history.some((r) => r.kind === kind && (!f || f(r)));
const supply = () => Number(CS?.totalSupply ?? 0n);
const pendIn = () => S.mints.filter((m) => m.kind === '入金' && m.status === '処理中').reduce((a, m) => a + m.amount, 0);
const pendOut = () => S.mints.filter((m) => m.kind === '出金' && m.status === '処理中').reduce((a, m) => a + m.amount, 0);
const mintOf = (p: Holder, kind: Mint['kind'], st?: Mint['status']) => S.mints.some((m) => m.party === p && m.kind === kind && (!st || m.status === st));

/* =====================================================================
 * ガイド（業務 01 トークン化預金のデモの流れ）
 * ===================================================================== */
type Step = { ph?: string; u: UserId; page: string; t: string; done: () => boolean };
const GUIDE: Step[] = [
  { ph: '提供開始', u: 'bank', page: 'money', t: 'Midnight で預金トークン（PAC1JPY）の提供を開始する（コントラクトをデプロイ）', done: () => !!S.contract },
  { ph: '口座開設（KYC）', u: 'bank', page: 'accounts', t: '法人投資家 A・B の口座を登録する（KYC 済みの口座IDをホワイトリストに登録）', done: () => isReg('invA') && isReg('invB') },
  { ph: '入金（mint）', u: 'invA', page: 'wallet', t: '普通預金から預金トークンへ入金を申し込む', done: () => mintOf('invA', '入金') },
  { u: 'bank', page: 'depMint', t: '入金を処理する（預金トークンの発行・mint）', done: () => mintOf('invA', '入金', '完了') },
  { ph: '誤送金と強制移転', u: 'invA', page: 'wallet', t: '預金トークンを送金する（誤って B社へ）', done: () => histHas(OpKind.TRANSFER, (r) => r.senderHex === KEYS.invA.id) },
  { u: 'invA', page: 'mypage', t: '誤送金の返却を依頼する', done: () => S.inq.length > 0 },
  { u: 'adm1', page: 'recovery', t: '調査して強制移転を申請する', done: () => S.recov.length > 0 },
  { u: 'bank', page: 'force', t: '強制移転を承認・実行する', done: () => S.recov.some((r) => r.status === '実行済') },
  { ph: '凍結', u: 'bank', page: 'accounts', t: 'B社の口座を凍結する', done: () => histHas(OpKind.FREEZE, (r) => r.receiverHex === KEYS.invB.id) },
  { u: 'invB', page: 'wallet', t: '凍結中は送金できない（コントラクトが拒否する）ことを確認する', done: () => !!S.flags.frozenTried },
  { u: 'bank', page: 'accounts', t: 'B社の凍結を解除する', done: () => histHas(OpKind.UNFREEZE, (r) => r.receiverHex === KEYS.invB.id) },
  { ph: '出金（burn）', u: 'invA', page: 'wallet', t: '預金トークンを普通預金へ出金する（償還・burn）', done: () => mintOf('invA', '出金') },
  { u: 'bank', page: 'depMint', t: '出金を処理する（普通預金への入金・ロック解除）', done: () => mintOf('invA', '出金', '完了') },
  { ph: '照合', u: 'adm1', page: 'recon', t: '預金台帳（勘定系）とオンチェーンの発行残高を照合する', done: () => !!S.recon },
  { ph: '監査', u: 'auditor', page: 'audit', t: '監査ログとオンチェーンの操作履歴で、取引の経緯を追跡する', done: () => !!S.flags.traced },
];
const curStep = () => { for (let i = S.gcur || 0; i < GUIDE.length; i++) if (!GUIDE[i].done()) return i; return GUIDE.findIndex((s) => !s.done()); };

/* =====================================================================
 * 基本メニューと権限
 * ===================================================================== */
const MENU: { g: string; side?: string; items: [string, string, string][] }[] = [
  { g: 'MAIN', items: [['home', 'ホーム', 'L-2'], ['approvals', '承認・対応待ち', 'C-1']] },
  { g: '資金サイド（MONEY）', side: 'money', items: [['money', '資金トークン 一覧', 'M-1'], ['depMint', '預金トークン 発行・償還', 'M-3'], ['accounts', '口座管理（登録・凍結・停止）', 'M-4'], ['force', '強制移転の承認（Recovery）', 'M-8'], ['recon', '預金台帳・照合', 'M-5']] },
  { g: '保有・資金', side: 'inv', items: [['wallet', '資金（入金・出金・送金）', 'I-3'], ['mypage', '保有・取引履歴', 'I-4']] },
  { g: '運用・管理', side: 'ops', items: [['recovery', 'Recovery（返却依頼・強制移転申請）', 'M-8'], ['master', 'コントラクト・ネットワーク設定', 'AD-3'], ['audit', '監査ログ', 'AD-4'], ['log', 'Midnight 実行ログ', 'AD-6']] },
];
const PERM: Record<string, '*' | Role[]> = {
  home: '*', log: '*', approvals: ['bank', 'admin'],
  money: ['bank', 'admin', 'auditor'], depMint: ['bank'], accounts: ['bank'], force: ['bank'], recon: ['bank', 'admin', 'auditor'],
  wallet: ['investor'], mypage: ['investor'], recovery: ['admin'], master: ['bank', 'admin', 'auditor'], audit: ['admin', 'auditor'],
};
const LABEL: Record<string, { l: string; n: string; g: string }> = {};
MENU.forEach((g) => g.items.forEach(([k, l, n]) => (LABEL[k] = { l, n, g: g.g })));
const can = (page: string, role?: Role) => { const p = PERM[page]; return p === '*' || (p || []).includes(role || myRole()); };
function pendingCount(page: string) {
  const r = myRole();
  if (page === 'depMint' && r === 'bank') return S.mints.filter((m) => m.status === '処理中').length;
  if (page === 'force' && r === 'bank') return S.recov.filter((x) => x.status === '承認待ち').length;
  if (page === 'recovery' && r === 'admin') return S.inq.filter((q) => q.status === '受付').length;
  if (page === 'accounts' && r === 'bank' && CS) return INVESTORS.filter((h) => !isReg(h)).length;
  return 0;
}
const approvalsCount = () => ['depMint', 'force', 'recovery', 'accounts'].reduce((a, k) => a + pendingCount(k), 0);

/* =====================================================================
 * 画面遷移
 * ===================================================================== */
function go(page: string) { Object.assign(U(), { page, pop: null }); render(); window.scrollTo(0, 0); }
function login(id: UserId, page?: string) {
  Object.assign(U(), { screen: 'app', user: id, page: page && can(page, roleOf(id)) ? page : 'home', pop: null, loginErr: false });
  render(); window.scrollTo(0, 0);
  autoConnect();
}
function openStep(i: number) {
  const s = GUIDE[i]; if (!s) return;
  S.gcur = i;
  const sw = me() !== s.u;
  login(s.u, s.page);
  if (sw) toast(`${nm(s.u)}（${ROLE[roleOf(s.u)].label}）に切り替えました`);
}

/* =====================================================================
 * Lace 接続とコントラクト
 * ===================================================================== */
async function connectLace() {
  log('Lace（Midnight）を探しています…');
  const s = await connectWallet((m) => log(m));
  // 送信完了をログに出す（進捗表示で「ブロック取り込み待ち」に切り替えるため）
  const mp = s.providers.midnightProvider, orig = mp.submitTx.bind(mp);
  mp.submitTx = async (tx) => { const id = await orig(tx); log('送信しました。ブロックへの取り込みを待っています…'); return id; };
  SESSION = s;
  log(`接続: ${s.info.name} / network=${s.info.networkId} / 証明: ${s.info.proofMode}`, 'ok');
}
function useApi(a: TDepositAPI) {
  SUB?.unsubscribe();
  API = a; CS = undefined;
  if (S.contract !== a.address) {
    // 別のコントラクトに切り替えたら、業務データ（申込・依頼・照合など）は最初から
    const keepUi = S.ui; S = defaultState(); S.ui = keepUi; S.contract = a.address;
  }
  SUB = a.state$.subscribe({
    next: (st) => { CS = st; S.token = { name: st.tokenName, sym: st.tokenSymbol }; save(); render(); },
    error: (e) => log(`状態の購読でエラー: ${String(e)}`, 'error'),
  });
  save();
}
async function joinContract(addr: string) {
  if (!SESSION) await connectLace();
  log(`コントラクトに接続しています: ${addr}`);
  const a = await TDepositAPI.join(SESSION!.providers, addr.trim(), skOf('bank'));
  useApi(a);
  log(`コントラクトに接続しました: ${a.address}`, 'ok');
}
async function ensureReady(needContract: boolean) {
  if (!SESSION) await connectLace();
  if (needContract && !API) {
    if (!S.contract) throw new Error('コントラクトがまだありません。△△銀行が「資金トークン 一覧」で提供を開始（デプロイ）してください。');
    await joinContract(S.contract);
  }
}
/* Proof Server の起動確認（no-cors：中身は読めないが、接続できるかどうかは分かる） */
const PROOF_URL = (import.meta.env.VITE_PROOF_SERVER as string | undefined) || 'http://localhost:6300';
let PS_OK: boolean | null = null;
async function checkProofServer(): Promise<boolean> {
  try {
    await fetch(`${PROOF_URL}/version`, { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(4000) });
    PS_OK = true;
  } catch {
    PS_OK = false;
  }
  log(PS_OK ? `Proof Server（${PROOF_URL}）に接続できました` : `Proof Server（${PROOF_URL}）に接続できません`, PS_OK ? 'ok' : 'error');
  return PS_OK;
}
let AUTO_TRIED = false;
function autoConnect() {
  if (AUTO_TRIED || SESSION || BUSY) return;
  AUTO_TRIED = true;
  ensureReady(!!S.contract).then(() => render()).catch((e) => { log(`自動接続できませんでした: ${errMsg(e)}`, 'error'); render(); });
}
const errMsg = (e: unknown) => { const m = describeError(e); if (typeof e === 'object' && e !== null) console.error(e); return m || '（エラーの詳細が取得できませんでした。F12 のコンソールを確認してください）'; };

/* =====================================================================
 * 共通部品：トースト／ダイアログ／トランザクション実行／完了
 * ===================================================================== */
function toast(msg: string, kind?: string) {
  const t = document.getElementById('toast')!; t.className = kind || ''; t.innerHTML = msg; t.style.display = 'block';
  clearTimeout((toast as unknown as { _t: number })._t);
  (toast as unknown as { _t: number })._t = window.setTimeout(() => (t.style.display = 'none'), 3600);
}
function modal(html: string, wide?: boolean) { const d = document.getElementById('dlg')!; d.className = 'dlg' + (wide ? ' w' : ''); d.innerHTML = html; document.getElementById('ov')!.style.display = 'flex'; }
function closeModal() { if (BUSY) return; document.getElementById('ov')!.style.display = 'none'; PEND = null; }
let PEND: (() => void) | null = null;

type Task = { label: string; run: () => Promise<TxResult>; needContract?: boolean };
type TxReq = { op: string; rows: [string, string][]; signer: Holder; warn?: string; tone?: string };
const STAGES = ['ブラウザ内で回路を実行し、ZK 証明を生成', 'Lace で承認（手数料 DUST の支払い）', 'トランザクションを送信', 'ブロックへの取り込みを確認'];

/** モックの「署名リクエスト」に相当。承認すると実際に Midnight のトランザクションを実行する */
function txSign(req: TxReq, tasks: Task[], fin: (rs: TxResult[]) => void, onErr?: (e: unknown) => boolean) {
  if (BUSY) { toast('ほかの処理を実行中です。完了までお待ちください', 'ng'); return; }
  PEND = () => void execTasks(req, tasks, fin, onErr);
  const signer = req.signer;
  modal(`<div class="dlg-h sign">🔑 トランザクションの実行（Midnight ${esc(NETWORK_ID)}）</div><div class="dlg-b">
    <p style="margin:0 0 12px">以下の内容でトランザクションを実行します。内容を確認して承認してください。</p>
    ${kvs([['操作', req.op], ...req.rows, ['証明する口座鍵', `${who(signer)}<br><span class="mono">口座ID ${short(KEYS[signer].id, 8)}</span>`], ['手数料', `接続中の Lace が DUST で支払い${SESSION?.info.dustBalance !== undefined ? `（残高 ${num(SESSION.info.dustBalance)}）` : ''}`], ['トランザクション数', `${tasks.length} 件`]])}
    ${req.warn ? `<div class="box box-ng" style="margin-top:12px;font-size:calc(12px + var(--fs))">${req.warn}</div>` : ''}
    <div class="box box-warn" style="margin-top:12px;font-size:calc(12px + var(--fs))">承認すると、口座鍵を公開せずに「権限・所有」をゼロ知識証明します（数十秒〜数分）。途中で <b>Lace の承認画面</b>が開くので、承認してください。</div></div>
    <div class="dlg-f"><button class="btn gh" data-act="closeModal">拒否</button><button class="btn ${req.tone === 'ng' ? 'ng' : ''}" data-act="signOk" id="signBtn">承認して実行</button></div>`, true);
}
let PROG_TIMER = 0;
async function execTasks(req: TxReq, tasks: Task[], fin: (rs: TxResult[]) => void, onErr?: (e: unknown) => boolean) {
  BUSY = true;
  const t0 = Date.now();
  let ti = 0, stage = 0;
  const lines: string[] = [];
  const draw = () => {
    const sec = ((Date.now() - t0) / 1000).toFixed(0);
    modal(`<div class="dlg-h sign"><span class="spin"></span> 実行中 ― ${esc(req.op)}<span style="margin-left:auto;font-weight:400;font-size:calc(12px + var(--fs))">${sec} 秒</span></div><div class="dlg-b">
      ${tasks.length > 1 ? `<div class="xs" style="margin-bottom:6px">${ti + 1} / ${tasks.length}：<b>${esc(tasks[ti]?.label || '')}</b></div>` : ''}
      <ul class="prov-list">${STAGES.map((l, j) => `<li class="${j < stage ? 'done' : j === stage ? 'run' : ''}"><span class="ic">${j < stage ? '✓' : ''}</span><span class="lb">${l}</span><span class="st">${j < stage ? '完了' : j === stage ? '実行中' : '待機中'}</span></li>`).join('')}</ul>
      <div class="pbar"><i style="width:${((ti * STAGES.length + stage) / (tasks.length * STAGES.length)) * 100}%"></i></div>
      <div class="mlog">${lines.slice(-5).map((l) => `<div>${esc(l)}</div>`).join('')}</div>
      <div class="xs" style="margin-top:8px">処理中はほかの操作はできません。Lace の承認画面が見当たらない場合は、ブラウザ右上の拡張機能アイコンから Lace を開いてください。</div></div>`, true);
  };
  LOG_HOOK = (m) => {
    lines.push(m);
    if (m.startsWith('Lace でトランザクションを承認')) stage = Math.max(stage, 1);
    else if (m.startsWith('トランザクションを送信中')) stage = Math.max(stage, 2);
    else if (m.startsWith('送信しました')) stage = Math.max(stage, 3);
    draw();
  };
  PROG_TIMER = window.setInterval(draw, 1000);
  draw();
  const rs: TxResult[] = [];
  try {
    await ensureReady(tasks.some((t) => t.needContract !== false));
    for (ti = 0; ti < tasks.length; ti++) {
      stage = 0; draw();
      log(`${tasks[ti].label}: 回路をローカル実行し、ZK 証明を生成しています…`);
      const r = await tasks[ti].run();
      rs.push(r);
      log(`${tasks[ti].label} 完了 tx=${short(r.txHash, 10)} block=${String(r.blockHeight)}`, 'ok');
    }
    stage = STAGES.length;
    cleanupProg();
    fin(rs);
  } catch (e) {
    cleanupProg();
    log(`${tasks[ti]?.label || req.op} 失敗: ${errMsg(e)}`, 'error');
    if (onErr && onErr(e)) return;
    if (/Internal Server Error|ServerError|Failed to fetch/i.test(errMsg(e))) await checkProofServer();
    errorDlg(req.op, e, rs.length);
  }
}
function cleanupProg() { clearInterval(PROG_TIMER); LOG_HOOK = null; BUSY = false; document.getElementById('ov')!.style.display = 'none'; }
function errorDlg(op: string, e: unknown, doneN: number) {
  const m = errMsg(e);
  const hints: string[] = [];
  if (/発行体/.test(m)) hints.push('発行体（銀行）の口座鍵が、このコントラクトをデプロイした鍵と一致していません（別のブラウザでデプロイした場合など）。口座鍵をインポートしてください。');
  if (/Internal Server Error|ServerError|Failed to fetch|ECONNREFUSED/i.test(m))
    hints.push(`Lace が証明サーバーに証明を依頼して失敗しています。<b>Proof Server（${PROOF_URL}）が起動しているか</b>確認してください${PS_OK === false ? '（いま確認したところ、<b>接続できません</b>）' : ''}。Rancher Desktop を起動して「Running」になってから <code>docker compose -f proof-server.yml up -d</code> を実行し、http://localhost:6300/version で 8.0.3 と表示されることを確かめます。`);
  else if (/dust|fee|balance/i.test(m)) hints.push('Lace の DUST 残高を確認してください（0 だと手数料を支払えません）。');
  if (/proof|prove|6300|fetch/i.test(m)) hints.push('Proof Server（http://localhost:6300）が起動しているか、Lace の証明サーバー設定を確認してください。');
  if (/reject|denied|cancel/i.test(m)) hints.push('Lace で承認が拒否されました。');
  if (/balanceUnsealedTransaction|InternalError|読み込めません/.test(m) && SESSION && /canary|alpha|beta|rc/i.test(SESSION.info.apiVersion))
    hints.push(`接続中の Lace は開発版（DApp Connector API ${esc(SESSION.info.apiVersion)}）です。このデモは midnight-js 4.1.1（API 4.0.1・ledger v8）で作っており、開発版の Lace とはトランザクションの形式が合わない可能性があります。`);
  hints.push('詳しくは「Midnight 実行ログ」と、F12 のコンソールを確認してください。');
  save(); render();
  modal(`<div class="dlg-h ng">実行できませんでした ― ${esc(op)}<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <div class="box box-ng" style="word-break:break-all">${esc(m)}</div>
    ${doneN ? `<p class="xs">先に実行した ${doneN} 件のトランザクションは完了しています。</p>` : ''}
    <ul style="margin:12px 0 0;padding-left:18px;font-size:calc(12.5px + var(--fs))">${hints.map((h) => `<li>${h}</li>`).join('')}</ul></div>
    <div class="dlg-f"><button class="btn gh" data-act="goLog">実行ログを開く</button><button class="btn" data-act="closeModal">閉じる</button></div>`, true);
}
function done(msg: string, note?: string) {
  save(); render();
  const cs = curStep(), s = GUIDE[cs];
  const nx = s ? `<div class="nx"><div class="k">ガイド ― 次のステップ（${cs + 1}/${GUIDE.length}）</div><div><b>${nm(s.u)}</b>（${ROLE[roleOf(s.u)].label}）：${s.t}</div></div>` : `<div class="box box-ok" style="margin-top:14px">✓ ガイドの流れを一通り完了しました</div>`;
  modal(`<div class="dlg-b" style="text-align:center;padding:26px 24px 18px"><div class="done-mk">✓</div><h2 style="margin:0;font-size:calc(17px + var(--fs));color:var(--navy)">${msg}</h2>${note ? `<p class="xs" style="margin:8px 0 0">${note}</p>` : ''}${nx}</div>
    <div class="dlg-f">${s ? `<button class="btn gh" data-act="closeModal">この画面に留まる</button><button class="btn" data-act="doneNext">次のステップへ →</button>` : '<button class="btn" data-act="closeModal">OK</button>'}</div>`);
}
function confirmDlg(title: string, body: string, okLabel: string, okAct: string, arg?: string, tone?: string) {
  modal(`<div class="dlg-h ${tone || ''}">${title}<span class="ns">署名なし</span><button class="x" data-act="closeModal">×</button></div><div class="dlg-b">${body}</div>
    <div class="dlg-f"><button class="btn gh" data-act="closeModal">キャンセル</button><button class="btn ${tone === 'ng' ? 'ng' : ''}" data-act="${okAct}" data-a="${arg || ''}">${okLabel}</button></div>`, true);
}
const txOf = (r: TxResult) => r.txHash;
/** 画面側の事前チェック（モックと同じくトーストで止める）。null なら OK */
const needChain = (): string | null => (!SESSION ? 'Lace に接続してください（右上のウォレット）' : !CS ? 'コントラクトの状態を取得中です。しばらくお待ちください' : null);

/* =====================================================================
 * 描画：ログイン前
 * ===================================================================== */
const preHead = () => `<div class="pre-h"><span class="logo">${ICON}<span class="wm">Pactora</span><span class="sub">MULTI-CHAIN DIGITAL ASSET PLATFORM × MIDNIGHT</span></span></div>`;
function hero(eb: string, h: string, p: string, n: number) {
  const L = ['業務選択', '環境の準備', 'ログイン'];
  return `<div class="hero"><div class="eb">${eb}</div><h1>${h}</h1><p>${p}</p>
    <div class="stepper">${L.map((l, i) => `<div class="${i + 1 === n ? 'on' : i + 1 < n ? 'done' : ''}"><span>${i + 1 < n ? '✓' : i + 1}</span>${l}</div>`).join('')}</div></div>`;
}
/* プラットフォーム図（モックの b1：淡い青）を、銀行 ⇄ Midnight ⇄ 預金者 に置き換えたもの */
function platformSvg() {
  const T = { bg: '#dde6f3', circ: '#fff', ic: '#002496', arrow: '#002496', title: '#002496', sub: '#1a2533' };
  const circ = (cx: number) => `<circle cx="${cx}" cy="300" r="150" fill="${T.circ}"/>`;
  const arR = (x: number, y: number) => `<path d="M${x} ${y - 21}h112v-41l64 62-64 62v-41h-112z" fill="${T.arrow}"/>`;
  const arL = (x: number, y: number) => `<path d="M${x + 176} ${y - 21}h-112v-41l-64 62 64 62v-41h112z" fill="${T.arrow}"/>`;
  const st = `fill="none" stroke="${T.ic}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"`;
  const title = (x: number, t: string) => `<text x="${x}" y="540" text-anchor="middle" font-size="62" font-weight="700" fill="${T.title}" font-family="Segoe UI, Noto Sans JP, sans-serif">${t}</text>`;
  const sub = (x: number, y: number, t: string) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="34" fill="${T.sub}" font-family="Segoe UI, Noto Sans JP, sans-serif">${t}</text>`;
  return `<svg class="pf-svg" viewBox="-70 0 2140 700" role="img" aria-label="発行銀行と預金者を Midnight のゼロ知識証明で結ぶ">
    <rect x="-70" width="2140" height="700" rx="28" fill="${T.bg}"/>
    ${circ(300)}${circ(1000)}${circ(1700)}
    ${arR(560, 252)}${arL(560, 372)}${arR(1264, 252)}${arL(1264, 372)}
    <g ${st}><path d="M200 258l100-58 100 58"/><circle cx="300" cy="262" r="20"/><path d="M226 302v66M264 302v66M336 302v66M374 302v66"/><path d="M200 398h200"/></g>
    <g ${st}><path d="M1000 200l86 38v62c0 58-38 96-86 112-48-16-86-54-86-112v-62z"/><path d="M962 304l26 26 52-56"/></g>
    <g ${st}><ellipse cx="1668" cy="240" rx="48" ry="22"/><path d="M1620 240v118c0 12 22 22 48 22"/><path d="M1620 280c0 12 22 22 48 22"/><path d="M1620 320c0 12 22 22 48 22"/><path d="M1716 240v44"/></g>
    <circle cx="1734" cy="350" r="46" fill="${T.circ}" ${st}/>
    ${title(300, 'Bank')}${sub(300, 600, 'Issuer（△△銀行）')}
    ${title(1000, 'Midnight')}${sub(1000, 600, 'ZK Proof ・ Compact')}
    ${title(1700, 'Depositor')}${sub(1700, 600, 'Tokenized Deposit（PAC1JPY）')}
  </svg>`;
}
function vUsecase() {
  const roles = [...new Set(UC_USERS.map((id) => ROLE[roleOf(id)].label))];
  const row = `<button class="pt-row money" data-act="pickUc"><span class="no">${UC.no}</span><span class="tx"><b>${UC.name}<span class="xs">（Midnight ${esc(NETWORK_ID)}・実トランザクション）</span></b><span class="xs">${UC.lead}</span><span class="tg">${roles.map((r) => bd(r, 'mute')).join('')}</span></span><span class="go2">ガイド付きで始める →</span></button>`;
  const note = `<p class="xs" style="margin-top:16px">※ 仮称：△△銀行（預金トークン発行）／◎◎物流・☆☆商事（法人投資家）。普通預金（勘定系）は模擬、預金トークンの残高・操作は Midnight ${esc(NETWORK_ID)} 上の実データです。</p>`;
  return preHead() + `<div class="pt-band pf"><div><div class="lp-eb">TOKENIZED DEPOSIT ON MIDNIGHT</div><h1>Pactora × Midnight へようこそ</h1><p>預金トークンの発行・償還、口座登録・送金・強制移転・凍結までを、Midnight のゼロ知識証明付きトランザクションで実行します。</p></div><div class="pt-pf">${platformSvg()}</div></div>
    <div class="pt-body"><div class="card pt-login"><h3>はじめる前に</h3><p class="xs">デモを始める前に、毎回次の項目を確認してください。</p>
        <ul class="pt-ul"><li>Docker（Rancher Desktop）が Running になり、Proof Server が起動している（http://localhost:6300/version → 8.0.3）</li><li>Lace（Midnight 対応版）のネットワークが <b>Preview</b>、証明サーバーが <b>http://localhost:6300</b></li><li>Lace の <b>DUST が 0 より大きい</b>（0 だと手数料不足ですべての操作が失敗します）</li></ul>
        <button class="btn lg" style="width:100%;margin-top:14px" data-act="pickUc">業務 01 を始める →</button></div>
      <div><div class="pt-h"><h3>業務から始める</h3><span class="xs">業務の流れに沿ってガイド付きで操作できます</span></div>
        <div class="pt-list"><div class="ucg-h money">資金サイド<small>MONEY</small></div>${row}</div>${note}</div></div>`;
}
function vProvision() {
  const s = SESSION?.info;
  const st = (ok: boolean | null, t: string) => `<span class="st">${ok === null ? t : ok ? bd(t, 'ok') : bd(t, 'warn')}</span>`;
  const dust = s?.dustBalance;
  const items: [string, string, boolean | null, string, string][] = [
    ['Lace（Midnight）に接続', s ? `${esc(s.name)} ／ network=${esc(s.networkId)} ／ 証明：${esc(s.proofMode)}<br><span class="mono">${esc(short(s.unshieldedAddress, 12))}</span>` : 'ブラウザの Lace 拡張機能に接続します。Lace の承認画面が開きます', s ? true : false, s ? '接続済み' : '未接続',
      s ? '' : `<button class="btn sm" data-act="connect">Lace に接続</button>`],
    ['手数料（DUST）の確認', s ? `DUST 残高 ${dust === undefined ? '不明' : num(dust)}${s.dustCap !== undefined ? ` ／ 上限 ${num(s.dustCap)}` : ''}${dust === 0n ? '<br><b style="color:var(--ng)">DUST が 0 のため、すべての操作が手数料不足で失敗します（SETUP.md 7 章）</b>' : ''}` : 'Lace に接続すると表示されます', s ? dust !== 0n : null, s ? (dust === 0n ? 'DUST 不足' : 'OK') : '—',
      s ? '<button class="btn sm gh" data-act="dustRefresh">再取得</button>' : ''],
    ['Proof Server の起動確認', PS_OK === null ? `${PROOF_URL} に接続できるか確認します（Lace の証明サーバーを「カスタム ${PROOF_URL}」にしている場合に必要）` : PS_OK ? `${PROOF_URL} に接続できました` : `<b style="color:var(--ng)">${PROOF_URL} に接続できません。</b>Rancher Desktop を起動し「Running」になってから、<code>docker compose -f proof-server.yml up -d</code> を実行してください（http://localhost:6300/version → 8.0.3）`, PS_OK, PS_OK === null ? '未確認' : PS_OK ? 'OK' : '停止中',
      '<button class="btn sm gh" data-act="psCheck">確認</button>'],
    ['デモユーザーの口座鍵', `${HOLDERS.map((h) => `${orgOf(h)}：<span class="mono">${short(KEYS[h].id, 6)}</span>`).join('<br>')}<br><span class="xs">口座鍵（秘密鍵）はこのブラウザにのみ保存。チェーンには口座ID（ハッシュ）だけが記録されます</span>`, true, '作成済み',
      '<button class="btn sm gh" data-act="keysExport">エクスポート</button> <button class="btn sm gh" data-act="keysImport">インポート</button>'],
    ['コントラクト（預金トークン）', S.contract ? `<span class="mono">${esc(short(S.contract, 10))}</span>${API ? '（接続済み）' : '（ログイン後に自動で接続）'}` : 'まだありません。ログイン後、ガイドの最初のステップで △△銀行がデプロイ（提供開始）します', S.contract ? true : null, S.contract ? '設定済み' : 'ログイン後に作成',
      '<button class="btn sm gh" data-act="joinAsk">既存のアドレスを指定</button>'],
  ];
  return preHead() + hero(`STEP 2 — BUSINESS ${UC.no} ${UC.en.toUpperCase()} <span class="sid">S-2</span>`, `「${UC.name}」の環境を準備します`, 'Lace に接続し、手数料（DUST）と口座鍵、コントラクトを確認します。', 2) +
    `<div class="pre-b"><div class="prov card"><div class="card-h"><h3>セットアップ</h3><span class="xs">ネットワーク：<span class="mono">Midnight ${esc(NETWORK_ID)}</span></span></div>
     <div class="card-b"><ul class="prov-list">${items.map(([lb, sm, ok, t, btn]) => `<li class="${ok ? 'done' : ''}"><span class="ic">${ok ? '✓' : ''}</span><span class="lb">${lb}<small>${sm}</small></span><span style="display:flex;gap:6px;align-items:center">${btn}${st(ok, t)}</span></li>`).join('')}</ul>
     <div style="display:flex;justify-content:space-between;margin-top:14px"><button class="btn gh" data-act="toUsecase">← 業務選択に戻る</button>
     <button class="btn" ${s ? '' : 'disabled title="先に Lace に接続してください"'} data-act="toLogin">ログイン画面へ →</button></div></div></div></div>`;
}
function vLogin() {
  const f = U().form, sel = U().sel;
  const groups = SIDE_ORDER.map((sd) => ({ sd, ids: UC_USERS.filter((id) => sideOf(id) === sd) })).filter((g) => g.ids.length);
  return `${preHead()}<div class="login">
   <div class="lg-card"><h1>ログイン<span class="sid">L-1</span></h1><p class="lead">Pactora プラットフォームへようこそ</p>
     <label>メールアドレス <span class="req">必須</span></label><input class="inp" id="lgEmail" data-f="lgEmail" value="${esc(f.lgEmail || '')}" placeholder="user@example.com">
     <label>パスワード <span class="req">必須</span></label><input class="inp" id="lgPw" data-f="lgPw" type="password" value="${esc(f.lgPw || '')}" placeholder="••••••••">
     <div class="row"><span>☐ ログイン状態を保持する</span><span class="link" style="font-weight:400">パスワードを忘れた場合</span></div>
     ${U().loginErr ? `<div class="box box-ng err">メールアドレスまたはパスワードが正しくありません。右のユーザー一覧から選ぶと入力されます。</div>` : ''}
     <button class="btn full lg" data-act="loginForm">ログイン</button>
     <p class="xs" style="margin:10px 0 0">手数料は接続中の Lace がまとめて支払い、操作の権限・所有は各ユーザーの口座鍵でゼロ知識証明します。</p>
     <div class="lg-uc"><div class="xs" style="letter-spacing:.14em">選択中の業務</div>
       <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px"><b style="color:var(--navy);font-size:calc(14px + var(--fs))">BUSINESS ${UC.no}　${UC.name}（Midnight）</b>
       <button class="btn gh sm" data-act="toUsecase">← 業務選択に戻る</button></div></div>
   </div>
   <div class="demo"><div class="demo-h"><span class="tag">BUSINESS</span><b>業務のユーザーでログイン</b><span class="xs" style="margin-left:auto">${UC_USERS.length} ユーザー ／ パスワードは自動入力</span></div>
     <div style="padding:10px 20px 2px" class="xs">「${UC.name}」に必要なユーザーです。行を押すと左のフォームに入力され、「ログイン」でそのまま入れます。</div>
     ${groups.map((g) => `<div class="demo-grp" style="color:${SIDE[g.sd].color}">${SIDE[g.sd].label}</div>` + g.ids.map((id) => { const x = USERS[id];
       return `<div class="demo-u ${sel === id ? 'sel' : ''}" data-act="fill" data-a="${id}">${av(id)}<div class="who"><div class="nm">${x.name}　<span style="font-weight:400;font-size:calc(12px + var(--fs));color:var(--ink2)">${x.org}</span></div>
         <div class="og">${roleBd(id)} ${x.dept}</div><div class="ds">${x.desc}${isHolder(id) ? `<br><span class="mono">口座ID ${short(KEYS[id].id, 6)}</span>` : ''}</div></div><button class="btn sm" data-act="login" data-a="${id}">ログイン</button></div>`; }).join('')).join('')}
     <div style="padding:10px 20px" class="xs">※ ユーザー一覧は検証環境でのみ表示します。</div></div>
  </div>`;
}

/* =====================================================================
 * 描画：ログイン後シェル
 * ===================================================================== */
function vTop() {
  const u = USERS[me()], pop = U().pop, ac = approvalsCount();
  const s = SESSION?.info;
  const wallet = s ? `<span class="dot"></span><span class="wl">Lace </span><span class="mono">DUST ${s.dustBalance === undefined ? '?' : num(s.dustBalance)}</span>` : `<span class="dot" style="background:#a1a1aa"></span>Lace 未接続`;
  const userDd = pop === 'user' ? `<div class="dd"><div class="cap">ユーザーを切り替える（${UC.name}）</div>
     ${ROLE_ORDER.map((r) => { const ids = UC_USERS.filter((id) => roleOf(id) === r); return ids.length ? `<div class="dd-grp" style="--role:${ROLE_COLOR[r]}"><div class="dd-rh"><i></i>${ROLE[r].label}<small>${SIDE[ROLE[r].side].label}</small></div>` + ids.map((id) => `<button class="it ${id === me() ? 'on' : ''}" data-act="switch" data-a="${id}">${av(id, true)}<span><b>${USERS[id].name}${id === me() ? '（ログイン中）' : ''}</b><small>${ROLE[roleOf(id)].label}・${USERS[id].org}</small></span></button>`).join('') + '</div>' : ''; }).join('')}
     <div class="sep"></div><button class="it" data-act="logout"><span><b>ログアウト</b><small>ログイン画面に戻る</small></span></button></div>` : '';
  return `<div class="top" style="--role:${ROLE_COLOR[u.role]}"><button class="logo" data-act="go" data-a="home">${ICON}<span class="wm">Pactora</span></button>
    <div class="uctag"><span class="k">BUSINESS</span><span class="v">${UC.no}　${UC.name}</span></div>
    <div class="sp"></div>
    <div class="tb date">⛓ Midnight ${esc(NETWORK_ID)}</div>
    <button class="tb" data-act="go" data-a="${can('approvals') ? 'approvals' : 'home'}" title="承認・対応待ち">🔔${ac ? `<span class="cnt">${ac}</span>` : ''}</button>
    <button class="tb" data-act="walletDlg" title="ウォレット接続（L-3）">${wallet}</button>
    <span class="rolechip" title="ログイン中の役割">${ROLE[u.role].label}</span>
    <div class="tb user" role="button" style="cursor:pointer" data-act="pop" data-a="user">${av(me(), true)}<span><div class="n">${u.name} ▾</div><div class="o">${u.org}｜${ROLE[u.role].label}</div></span>${userDd}</div>
    <button class="tb" data-act="toUsecase">業務変更</button>
    <button class="tb" data-act="logout">ログアウト</button></div>`;
}
function vGuide() {
  const cs = curStep(), dn = GUIDE.filter((s) => s.done()).length;
  return `<div class="g-head"><div class="k">BUSINESS ${UC.no} デモガイド<span class="sid">C-7</span></div><div class="v">${UC.name}（Midnight）</div><button class="g-reset" data-act="resetAsk" title="業務データを初期化する">↺ 初期化</button>
     <div class="pg"><div class="pbar"><i style="width:${(dn / GUIDE.length) * 100}%"></i></div><span>${dn}/${GUIDE.length}</span></div></div>
    ${GUIDE.map((s, i) => { const d = s.done(), cur = i === cs, here = s.u === me() && s.page === U().page;
      const w = `<span class="who"><i style="background:${ROLE_COLOR[roleOf(s.u)]}"></i>${USERS[s.u].name}（${ROLE[roleOf(s.u)].label}・${USERS[s.u].org}）</span>`;
      return `${s.ph ? `<div class="g-ph">${s.ph}</div>` : ''}<div class="gs ${d ? 'done' : ''} ${cur ? 'cur' : ''} ${here ? 'here' : ''}" data-act="step" data-a="${i}"><span class="mk">${d ? '✓' : i + 1}</span><div class="tx">${w}${s.t}</div>
        ${cur ? `<div class="go"><button class="btn sm" data-act="step" data-a="${i}">${here ? '操作中' : '開く'}</button></div>` : ''}</div>`; }).join('')}
    ${cs < 0 ? `<div class="box box-ok" style="margin:12px">✓ 一通り完了しました。「メニュー」タブから自由に操作できます。</div>` : ''}`;
}
function vMenu() {
  const C: Record<string, string> = { money: '#9a6200', inv: '#24624a', ops: '#4a5468' };
  return MENU.map((g) => `<div class="mg">${g.side ? `<i style="background:${C[g.side]}"></i>` : ''}${g.g}</div>` + g.items.map(([k, l, n]) => {
    const ok = can(k), c = ok ? pendingCount(k) : 0, on = U().page === k;
    return `<button class="mi ${on ? 'on' : ''}" ${ok ? `data-act="go" data-a="${k}"` : 'disabled title="この役割では使えません"'}><span>${l}${c ? `<span class="cnt">${c}</span>` : ''}</span><span class="no">${n}</span></button>`; }).join('')).join('');
}
function vSide() {
  const tab = U().tab, dn = GUIDE.filter((x) => x.done()).length;
  return `<aside class="side"><div class="stabs"><button class="${tab === 'guide' ? 'on' : ''}" data-act="tab" data-a="guide">ガイド（${dn}/${GUIDE.length}）</button><button class="${tab === 'menu' ? 'on' : ''}" data-act="tab" data-a="menu">メニュー</button></div>
    <div class="sbody">${tab === 'guide' ? vGuide() : vMenu()}</div>
    <div class="s-foot"><span>${ROLE[myRole()].label}としてログイン中</span><button class="link" data-act="resetAsk" style="font-weight:400">初期化</button></div></aside>`;
}
function vApp() {
  const p = U().page, L = LABEL[p] || LABEL.home;
  const body = PAGES[p] && can(p) ? PAGES[p]() : PAGES.home();
  const st = !SESSION ? '<span style="color:var(--ng)">Lace 未接続</span>' : !S.contract ? '<span>コントラクト未作成</span>' : !CS ? '<span>同期中…</span>' : isPaused() ? '<span style="color:var(--ng)">全体停止中</span>' : '<span class="ok">稼働中</span>';
  const mbar = `<div class="mbar">ネットワーク <b>Midnight ${esc(NETWORK_ID)}</b><span class="sep">｜</span>コントラクト <b class="mono">${S.contract ? esc(short(S.contract, 6)) : '—'}</b><span class="sep">｜</span>発行残高 <b>${CS ? yen(CS.totalSupply) : '—'}</b><span class="sep">｜</span>状態 ${st}${BUSY ? '<span class="sep">｜</span><span class="spin" style="border-color:rgba(0,36,150,.3);border-top-color:var(--brand)"></span> 実行中' : ''}<button class="link" data-act="go" data-a="log">実行ログ › <span class="sid">AD-6</span></button></div>`;
  return vTop() + `<div class="body" style="--role:${ROLE_COLOR[myRole()]}">${vSide()}<div class="main">${mbar}<div class="crumb">${UC.name} ／ ${L.g === 'MAIN' ? '' : L.g + ' ／ '}<b>${L.l}</b></div>
    <div class="page">${connBanner()}${body}</div><div class="foot"><span>© 2026 Pactora. Digital Asset Platform（CAC）× Midnight</span><span>${now().slice(0, 10)}</span></div></div></div>`;
}
function connBanner() {
  if (!SESSION) return `<div class="box box-warn" style="margin-bottom:16px;display:flex;align-items:center;gap:12px"><span style="flex:1">Lace に接続されていません。オンチェーンの残高・状態を表示し、操作するには接続してください。</span><button class="btn sm" data-act="connect">Lace に接続</button></div>`;
  if (S.contract && !API) return `<div class="box box-warn" style="margin-bottom:16px;display:flex;align-items:center;gap:12px"><span style="flex:1">コントラクト <span class="mono">${esc(short(S.contract, 8))}</span> に未接続です。</span><button class="btn sm" data-act="connect">接続する</button></div>`;
  if (S.contract && !CS) return `<div class="box box-info" style="margin-bottom:16px"><span class="spin" style="border-color:rgba(0,36,150,.3);border-top-color:var(--brand)"></span> コントラクトの状態をインデクサから取得しています…</div>`;
  return '';
}
const head = (title: string, sub: string, id: string, right?: string) => `<div class="ph"><div><h2>${title}<span class="sid">${id}</span></h2>${sub ? `<p>${sub}</p>` : ''}</div><div style="display:flex;gap:8px">${right || ''}</div></div>`;
function nextCard() {
  const cs = curStep(); if (cs < 0) return '';
  const s = GUIDE[cs];
  if (s.u === me()) return `<div class="next"><div style="flex:1"><div class="k">ガイド ― 次にやること（${cs + 1}/${GUIDE.length}）</div><div class="t">${s.t}</div></div>${U().page === s.page ? '<span class="xs">この画面で操作します</span>' : `<button class="btn" data-act="step" data-a="${cs}">画面を開く →</button>`}</div>`;
  return `<div class="next other"><div style="flex:1"><div class="k">ガイド ― 次のステップ（${cs + 1}/${GUIDE.length}）</div><div class="t">${nm(s.u)}（${ROLE[roleOf(s.u)].label}）：${s.t}</div></div><button class="btn sec" data-act="step" data-a="${cs}">ユーザーを切り替えて開く →</button></div>`;
}

/* =====================================================================
 * 画面（ページ）
 * ===================================================================== */
const kpi = (k: string, v: string | number, unit: string, s: string, cls?: string) => `<div class="kpi ${cls || ''}"><div class="k">${k}</div><div class="v n">${v}${unit ? `<small>${unit}</small>` : ''}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
const tcard = (title: string, inner: string, right?: string) => `<div class="card"><div class="card-h"><h3>${title}</h3>${right || ''}</div>${inner}</div>`;
const tbl = (heads: string[], rows: string[], empty?: string) => (rows.length ? `<table class="t"><thead><tr>${heads.map((h) => `<th class="${h.startsWith('>') ? 'r' : ''}">${h.replace(/^>/, '')}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>` : `<div class="empty">${empty || 'データはありません'}</div>`);
const acctState = (h: Holder) => (!CS ? bd('—', 'mute') : !isReg(h) ? bd('未登録', 'warn') : isFrz(h) ? bd('凍結中', 'ng') : bd('有効', 'ok'));
const fmtTok = (h: Holder) => (CS ? (isReg(h) ? yen(tbal(h)) : '—') : '…');
const histRows = (list: TDepositState['history']) => list.map((r) => `<tr><td class="n">#${String(r.seq)}</td><td>${bd(OP_LABEL[r.kind] || String(r.kind), OP_TONE[r.kind] || 'mute')}</td><td>${nameOfHex(r.senderHex)}</td><td>${nameOfHex(r.receiverHex)}</td><td class="r n">${r.amount === 0n ? '—' : yen(r.amount)}</td></tr>`);
const PAGES: Record<string, () => string> = {};

/* ---------- ホーム（L-2） ---------- */
PAGES.home = () => {
  const id = me(), u = USERS[id], r = myRole();
  let h = head(`ようこそ、${u.name} 様`, `${u.org} ／ ${u.dept}`, 'L-2') + nextCard();
  if (r === 'investor' && isHolder(id)) {
    const mine = S.mints.filter((m) => m.party === id && m.status === '処理中').length;
    return h + `<div class="grid3">
      <div class="blk money"><div class="bh">資金<small>使える残高</small></div><div class="row"><div><div class="nm">普通預金（△△銀行）</div><div class="sb">勘定系（模擬）</div></div><b class="n">${yen(S.acct[id] || 0)}</b></div>
        <div class="row"><div><div class="nm">${esc(S.token.name)}</div><div class="sb">Midnight ${esc(NETWORK_ID)}・${acctState(id)}</div></div><b class="n">${fmtTok(id)}</b></div>
        <div class="ft"><button class="btn sm sec" data-act="go" data-a="wallet">入金・出金・送金</button></div></div>
      <div class="blk dvp"><div class="bh">手続き<small>入出金の申込</small></div><div class="bd2"><div class="big n">${mine}</div><div class="xs">銀行の処理待ち</div></div>
        <div class="ft"><button class="btn sm sec" data-act="go" data-a="mypage">保有・取引履歴</button></div></div>
      <div class="blk asset"><div class="bh">口座<small>オンチェーン</small></div><div class="row"><div><div class="nm">口座ID</div><div class="sb mono">${short(KEYS[id].id, 8)}</div></div>${acctState(id)}</div>
        <div class="row"><div><div class="nm">口座鍵</div><div class="sb">このブラウザに保存（チェーンには出ない）</div></div></div>
        <div class="ft"><button class="btn sm sec" data-act="walletDlg">ウォレット・口座鍵</button></div></div></div>`;
  }
  h += `<div class="grid4" style="margin-bottom:16px">${kpi('預金トークン 発行残高', CS ? yen(CS.totalSupply) : '—', '', `Midnight ${esc(NETWORK_ID)}`, 'money')}
    ${kpi('登録口座数', CS ? CS.accounts.length : '—', '口座', 'KYC 済み（発行体を含まない）', 'asset')}${kpi('オンチェーン操作', CS ? CS.history.length : '—', '件', 'コントラクトの操作履歴', 'dvp')}
    ${kpi('承認・対応待ち（あなた宛）', approvalsCount(), '件', can('approvals') ? '<button class="link" data-act="go" data-a="approvals">承認・対応待ちへ →</button>' : '')}</div>`;
  const recent = CS ? CS.history.slice(0, 4) : [];
  return h + `<div class="blocks">
   <div class="blk money"><div class="bh">資金サイド<small>MONEY ― 資金の発行管理</small></div><div class="row"><div><div class="nm">${esc(S.token.name)}</div><div class="sb">トークン化預金｜Midnight</div></div><div class="r"><div class="n b">${CS ? yen(CS.totalSupply) : '—'}</div>${!S.contract ? bd('準備中', 'mute') : !CS ? bd('同期中', 'mute') : isPaused() ? bd('全体停止中', 'ng') : bd('稼働中', 'ok')}</div></div>
     <div class="ft">${can('money') ? '<button class="link" data-act="go" data-a="money">発行管理へ →</button>' : '<span class="xs">発行者のみ操作できます</span>'}</div></div>
   <div class="blk dvp"><div class="bh">オンチェーン操作<small>MIDNIGHT</small></div><div class="bd2"><div class="xs">ZK 証明付きトランザクション</div><div class="big n">${CS ? CS.history.length : '—'}</div><div class="xs">累計の操作（コントラクトの履歴）</div>
     <div style="text-align:left;width:100%;margin-top:6px">${recent.map((d) => `<div class="xs" style="border-top:1px solid var(--line2);padding:5px 0"><b class="n" style="color:var(--ink2)">#${String(d.seq)}</b> ${OP_LABEL[d.kind]} ${d.amount ? yen(d.amount) : ''}</div>`).join('')}</div></div>
     <div class="ft">${can('audit') ? '<button class="link" data-act="go" data-a="audit">監査ログへ →</button>' : '<button class="link" data-act="go" data-a="log">実行ログへ →</button>'}</div></div>
   <div class="blk asset"><div class="bh">口座<small>KYC 済みの保有者</small></div>${INVESTORS.map((h2) => `<div class="row"><div><div class="nm">${orgOf(h2)}</div><div class="sb mono">${short(KEYS[h2].id, 6)}</div></div><div class="r">${r === 'bank' || r === 'auditor' || r === 'admin' ? `<div class="n b">${fmtTok(h2)}</div>` : ''}${acctState(h2)}</div></div>`).join('')}
     <div class="ft">${can('accounts') ? '<button class="link" data-act="go" data-a="accounts">口座管理へ →</button>' : '<span class="xs">口座の登録・凍結は発行銀行が行います</span>'}</div></div></div>`;
};

/* ---------- 承認・対応待ち（C-1） ---------- */
PAGES.approvals = () => {
  const r = myRole(), rows: string[] = [];
  const row = (kind: string, side: string, txt: string, by: string, st: string, page: string) => rows.push(`<tr><td>${bd(kind, side)}</td><td>${txt}</td><td>${by}</td><td>${st}</td><td class="r"><button class="btn sm" data-act="go" data-a="${page}">開く ▸</button></td></tr>`);
  if (r === 'bank') {
    if (CS) INVESTORS.filter((h) => !isReg(h)).forEach((h) => row('口座登録（KYC）', 'money', `${who(h)} の口座ID <span class="mono">${short(KEYS[h].id, 6)}</span>`, '—', bd('登録待ち', 'warn'), 'accounts'));
    S.mints.filter((m) => m.status === '処理中').forEach((m) => row(m.kind === '入金' ? 'mint（資金）' : 'unlock（資金）', 'money', `${who(m.party)} ${yen(m.amount)}`, nm(m.party), bd('処理待ち', 'warn'), 'depMint'));
    S.recov.filter((x) => x.status === '承認待ち').forEach((x) => row('強制移転（資金）', 'money', `${orgOf(x.from)} → ${orgOf(x.to)} ${yen(x.amount)}`, nm(x.maker), bd('承認待ち', 'warn'), 'force'));
  }
  if (r === 'admin') S.inq.filter((q) => q.status === '受付').forEach((q) => row('返却依頼', 'ops', `${orgOf(q.from)} の誤送金 ${yen(q.amount)}`, nm(q.from), bd('新しい依頼', 'warn'), 'recovery'));
  return head('承認・対応待ち', '起票 → 承認 → 実行（ZK 証明・Lace 承認）→ 完了。オンチェーンに影響する操作はここから処理します', 'C-1') + nextCard() +
    tcard(`あなた宛（${rows.length}）`, tbl(['種別', '内容', '起票', '状態', '>操作'], rows, '対応待ちはありません'));
};

/* ---------- 資金トークン一覧（M-1）・提供開始 ---------- */
PAGES.money = () => {
  const r = myRole(), f = U().form;
  if (!S.contract) {
    const deployCard = r === 'bank' ? tcard('預金トークンの提供開始（コントラクトのデプロイ）', `<div class="card-b"><div class="form">
        <div class="lb">トークン名 <span class="req">必須</span></div><div><input class="inp" style="min-width:0;width:100%" data-f="tkName" value="${esc(f.tkName ?? TOKEN_DEFAULT.name)}"></div>
        <div class="lb">シンボル <span class="req">必須</span></div><div><input class="inp s" data-f="tkSym" value="${esc(f.tkSym ?? TOKEN_DEFAULT.sym)}"></div>
        <div class="lb">チェーン</div><div>${chainBd()} <span class="xs">${esc(NETWORK_ID)}</span></div>
        <div class="lb">発行体</div><div>${who('bank')}<div class="xs mono">口座ID ${short(KEYS.bank.id, 8)}（この口座鍵が発行体として登録されます）</div></div></div>
        <div class="box box-warn" style="margin-top:12px;font-size:calc(12px + var(--fs))">デプロイ後は、この口座鍵がないと銀行の操作（発行・凍結・強制移転など）が一切できなくなります。「ウォレット・口座鍵」からエクスポートして控えてください。</div>
        <div style="text-align:right;margin-top:14px"><button class="btn" data-act="deploy">提供を開始（デプロイ）</button></div></div>`) : `<div class="card empty">△△銀行（発行銀行）が提供を開始すると表示されます</div>`;
    return head('資金サイド ― 発行管理', '資金トークン（トークン化預金）の発行・償却・裏付けの突合を管理します', 'M-1') + nextCard() + deployCard +
      `<div style="margin-top:16px">${tcard('既存のコントラクトに接続', `<div class="card-b" style="display:flex;gap:8px;align-items:center"><input class="inp" style="flex:1;min-width:0" data-f="joinAddr" value="${esc(f.joinAddr || '')}" placeholder="コントラクトアドレス（0200…）"><button class="btn sec" data-act="join">接続</button></div>`)}</div>`;
  }
  const diff = S.lock - supply();
  const rows = [`<tr><td><b>${esc(S.token.name)}</b><div class="xs">${esc(S.token.sym)}・発行者：△△銀行</div></td><td>${bd('トークン化預金', 'money')}</td><td>${chainBd()}</td>
    <td class="r n">${CS ? yen(CS.totalSupply) : '…'}</td><td class="xs">勘定系ロック ${yen(S.lock)}</td><td>${!CS ? '—' : diff === 0 ? bd('一致 ✓', 'ok') : bd(`差異 ${yen(diff)}`, 'warn')}</td>
    <td>${!CS ? bd('同期中', 'mute') : isPaused() ? bd('全体停止中', 'ng') : bd('稼働中', 'ok')}</td></tr>`];
  return head('資金サイド ― 発行管理', '資金トークン（トークン化預金）の発行・償却・裏付けの突合を管理します', 'M-1', r === 'bank' ? '<button class="btn sec" data-act="go" data-a="depMint">発行・償還の処理へ</button>' : '') + nextCard() +
    tcard('資金トークン', tbl(['資金トークン', '種別', 'チェーン', '>発行残高（オンチェーン）', '裏付け', '突合', '状態'], rows)) +
    `<div class="grid2" style="margin-top:16px">${tcard('コントラクト', `<div class="card-b">${kvs([['アドレス', `<span class="mono" style="word-break:break-all">${esc(S.contract)}</span> <button class="link" data-act="copy" data-a="${esc(S.contract)}">コピー</button>`], ['デプロイ Tx', txSpan(API?.deployTx.txHash)], ['発行体の口座ID', CS ? `<span class="mono">${short(CS.issuerHex, 8)}</span> ${iAmIssuer() ? bd('このブラウザの銀行の鍵', 'ok') : bd('別の鍵', 'ng')}` : '…'], ['累計発行 ／ 累計償還', CS ? `${yen(CS.totalIssued)} ／ ${yen(CS.totalRedeemed)}` : '…']])}</div>`)}
     <div class="stack"><div class="box box-info">預金トークンの<b>提供開始</b>は △△銀行（発行銀行）が行います。発行体の権限は、デプロイ時の口座鍵から計算した<b>口座ID（ハッシュ）</b>としてチェーンに記録され、操作のたびに鍵を公開せずにゼロ知識証明します。</div>
     <div class="box box-mute">Midnight：Compact コントラクト（発行・償還・強制移転・強制償還・凍結・全体停止の回路）。残高はコントラクトの公開台帳で管理（強制措置のため。課題 C1）</div></div></div>`;
};

/* ---------- 預金トークン 発行・償還（M-3） ---------- */
PAGES.depMint = () => {
  const q = S.mints.slice().reverse(), pend = q.filter((m) => m.status === '処理中').length;
  const diff = S.lock - supply();
  return head(`${esc(S.token.name)} ― 発行・償還`, '入金申込 → 預金ロック → mint（issue）／ 出金申込（利用者が償還・burn）→ 普通預金へ入金（unlock）', 'M-3') + nextCard() +
    `<div class="grid4" style="margin-bottom:16px">${kpi('発行残高（オンチェーン）', CS ? yen(CS.totalSupply) : '—', '', `累計発行 ${CS ? yen(CS.totalIssued) : '—'}`, 'money')}${kpi('勘定系ロック残高', yen(S.lock), '', diff === 0 ? '突合 一致 ✓' : `差異 ${yen(diff)}（処理待ち）`, 'money')}${kpi('処理待ち', pend, '件', 'mint／unlock')}${kpi('全体の状態', !CS ? '—' : isPaused() ? '停止中' : '稼働中', '', isPaused() ? '停止中は新規発行できません' : '')}</div>` +
    tcard('発行・償却キュー', tbl(['申込番号', '日時', '種別', '顧客', 'チェーン', '>金額', '勘定系', '状態', '>操作／Tx'], q.map((m) => `<tr><td class="mono">${m.id}</td><td class="n">${m.ts.slice(5, 16)}</td><td>${m.kind === '入金' ? bd('mint', 'money') + ' 入金' : bd('burn', 'mute') + ' 出金'}</td><td>${who(m.party)}</td><td>${chainBd()}</td><td class="r n">${yen(m.amount)}</td>
      <td class="xs">${m.kind === '入金' ? 'ロック済 ✓' : m.status === '完了' ? 'unlock 済 ✓' : `burn 済 ✓ ${txSpan(m.burnTx)}<br>unlock 待ち`}</td><td>${m.status === '完了' ? bd('完了', 'ok') : bd('処理待ち', 'warn')}</td>
      <td class="r">${m.status === '処理中' ? `<button class="btn sm" data-act="procMint" data-a="${m.id}">${m.kind === '入金' ? '発行（mint）する' : '普通預金へ入金する'}</button>` : txSpan(m.tx)}</td></tr>`), '処理待ちの申込はありません（投資家の「資金（入金・出金・送金）」画面から申し込まれます）')) +
    `<div class="box box-mute" style="margin-top:16px">出金は、利用者が自分の口座鍵で償還（<code>redeem</code>・burn）した時点でオンチェーンの発行残高が減ります。銀行はその後、勘定系で普通預金へ入金（ロック解除）します。オンチェーンとオフチェーンの処理はアトミックではありません（課題 C5）。</div>`;
};

/* ---------- 口座管理（M-4） ---------- */
PAGES.accounts = () => {
  const unreg = INVESTORS.filter((h) => CS && !isReg(h));
  const pauseCard = `<div class="card"><div class="card-h"><h3>Midnight：全体の移転</h3>${!CS ? bd('—', 'mute') : isPaused() ? bd('一時停止中', 'ng') : bd('稼働中', 'ok')}</div><div class="card-b" style="display:flex;align-items:center;gap:12px">
      <div style="flex:1" class="xs">${!CS ? 'コントラクトの状態を取得すると操作できます' : isPaused() ? '利用者の送金・償還と新規発行を停止しています（強制移転・強制償還は実行可能）。' : '預金トークンは通常どおり送金・償還できます。'}<br>権限：△△銀行（<code>pause</code> ／ <code>unpause</code>）</div>
      ${CS ? `<button class="btn ${isPaused() ? 'ok' : 'ng'}" data-act="pauseToggle">${isPaused() ? '移転を再開' : '全体の移転を一時停止'}</button>` : ''}</div></div>`;
  const regCard = `<div class="card"><div class="card-h"><h3>口座登録（KYC 完了）</h3>${unreg.length ? bd(`未登録 ${unreg.length}`, 'warn') : CS ? bd('全員登録済', 'ok') : ''}</div><div class="card-b" style="display:flex;align-items:center;gap:12px">
      <div style="flex:1" class="xs">KYC 済みの顧客の口座ID（口座鍵のハッシュ）をホワイトリストに登録します。登録済みの口座の間でのみ送金できます。<br>権限：△△銀行（<code>registerAccount</code>）</div>
      ${unreg.length ? `<button class="btn" data-act="regAll">未登録の ${unreg.length} 口座を登録</button>` : ''}</div></div>`;
  const others = CS ? CS.accounts.filter((a) => !holderByHex(a.accountIdHex)) : [];
  const cell = (h: Holder) => (!CS ? '—' : !isReg(h) ? `<button class="btn sm" data-act="regOne" data-a="${h}">登録する</button>` : `<div class="fz">${isFrz(h) ? bd('凍結中', 'ng') : bd('有効', 'ok')}<button class="btn sm ${isFrz(h) ? 'sec' : 'gh'}" data-act="freezeToggle" data-a="${h}">${isFrz(h) ? '解除' : '凍結'}</button></div>`);
  return head('口座管理（登録・凍結・移転停止）', '凍結中は送金・償還が不可（受取は可）。凍結・停止は △△銀行の口座鍵で証明して実行します', 'M-4') + nextCard() +
    `<div class="grid2" style="margin-bottom:16px">${regCard}${pauseCard}</div>` +
    tcard('保有者（口座の状態）', tbl(['保有者', 'KYC', '口座ID', '>残高', '状態／操作'], INVESTORS.map((h) => `<tr><td><b>${orgOf(h)}</b><div class="xs">${nm(h)}</div></td><td>${bd('済', 'ok')}</td><td class="mono">${short(KEYS[h].id, 6)}</td><td class="r n">${fmtTok(h)}</td><td>${cell(h)}</td></tr>`).concat(
      others.map((a) => `<tr><td><b>その他の口座</b><div class="xs">このブラウザに鍵がない口座</div></td><td>${bd('済', 'ok')}</td><td class="mono">${short(a.accountIdHex, 6)}</td><td class="r n">${yen(a.balance)}</td><td>${a.frozen ? bd('凍結中', 'ng') : bd('有効', 'ok')}</td></tr>`))),
      '<span class="xs">Midnight：<code>freezeAccount</code> ／ <code>unfreezeAccount</code>（△△銀行の口座鍵で証明）</span>');
};

/* ---------- 強制移転の承認（M-8）・強制償還 ---------- */
PAGES.force = () => {
  const f = U().form;
  return head('強制移転の承認', 'Pactora 運用が調査・申請した強制移転を、発行銀行として承認し実行します（forceTransfer：凍結中・停止中でも実行可）', 'M-8') + nextCard() +
    tcard('強制移転', tbl(['申請番号', '移転元', '移転先', 'チェーン', '>金額', '理由', '申請者', '状態', '>操作／Tx'], S.recov.slice().reverse().map((x) => `<tr><td class="mono">${x.id}</td><td>${orgOf(x.from)}</td><td>${orgOf(x.to)}</td><td>${chainBd()}</td><td class="r n">${yen(x.amount)}</td><td class="xs">${esc(x.reason)}</td><td>${nm(x.maker)}</td>
      <td>${x.status === '実行済' ? bd('実行済', 'ok') : bd('承認待ち', 'warn')}</td><td class="r">${x.status === '承認待ち' ? `<button class="btn sm" data-act="execRecov" data-a="${x.id}">承認して実行</button>` : txSpan(x.tx)}</td></tr>`), '承認待ちの強制移転はありません')) +
    `<div style="margin-top:16px">${tcard('強制償還（口座解約・差押えなど）', `<div class="card-b"><div class="form">
      <div class="lb">対象口座</div><div><select class="inp" style="min-width:0" data-f="frTarget">${INVESTORS.map((h) => `<option value="${h}" ${(f.frTarget || 'invB') === h ? 'selected' : ''}>${orgOf(h)}（残高 ${fmtTok(h)}）</option>`).join('')}</select></div>
      <div class="lb">金額</div><div><input class="inp s" data-f="frAmt" value="${esc(f.frAmt || '')}" placeholder="金額を入力"></div></div>
      <div class="hint">トークンを消却します（forceRedeem）。償還額の支払い（差押債権者・解約口座への入金など）は勘定系で別途処理します。</div>
      <div style="text-align:right;margin-top:12px"><button class="btn ng" data-act="forceRedeem">強制償還する</button></div></div>`)}</div>`;
};

/* ---------- 預金台帳・照合（M-5） ---------- */
PAGES.recon = () => {
  const r = S.recon, on = !!CS;
  const diff = S.lock - supply(), pi = pendIn(), po = pendOut();
  return head('預金台帳・照合', '預金台帳（勘定系のロック残高）とオンチェーンの発行残高（totalSupply）を照合します。説明できない差異があれば全体停止を検討', 'M-5') + nextCard() +
    `<div class="grid2"><div class="card"><div class="card-h"><h3>Midnight ${esc(NETWORK_ID)}</h3>${r ? bd((r.ok ? '照合済 ✓ ' : '差異あり ') + r.ts.slice(11, 16), r.ok ? 'ok' : 'ng') : on ? bd('未照合', 'mute') : bd('同期待ち', 'mute')}</div><div class="card-b">
      ${kvs([['預金台帳（勘定系ロック・模擬正本）', yen(S.lock)], ['トークン発行残高（オンチェーン）', on ? yen(supply()) : '—'], ['差異', on ? `<b>${yen(diff)}</b>` : '—'], ['　うち 入金処理待ち（ロック済・mint 前）', yen(pi)], ['　うち 出金処理待ち（burn 済・unlock 前）', `−${yen(po)}`], ['説明できない差異', on ? `<b style="color:${diff - pi + po === 0 ? 'var(--ok)' : 'var(--ng)'}">${yen(diff - pi + po)}</b>` : '—']])}
      <div style="margin-top:12px;text-align:right"><button class="btn sm" data-act="recon" ${on ? '' : 'disabled'}>照合を実行</button></div></div></div>
     <div class="stack"><div class="box box-info">オンチェーンの発行残高は、Lace が接続しているインデクサから取得したコントラクトの公開状態です。勘定系の値はこのブラウザ内の模擬データです。</div>
     ${r ? `<div class="box ${r.ok ? 'box-ok' : 'box-ng'}">前回の照合（${esc(r.ts)}）：預金台帳 ${yen(r.ledger)} ／ オンチェーン ${yen(r.chain)} ／ 差異 ${yen(r.diff)}（処理待ちで説明できる分 ${yen(r.pendIn - r.pendOut)}）</div>` : ''}</div></div>`;
};

/* ---------- 資金（入金・出金・送金）（I-3） ---------- */
PAGES.wallet = () => {
  const id = me() as Holder, f = U().form;
  const others = INVESTORS.filter((x) => x !== id);
  const to = (f.xTo as Holder) || others[0];
  const mine = S.mints.filter((m) => m.party === id).slice().reverse();
  const flows = CS ? CS.history.filter((r) => (r.kind === OpKind.TRANSFER || r.kind === OpKind.FORCE_TRANSFER) && (r.senderHex === KEYS[id].id || r.receiverHex === KEYS[id].id)) : [];
  const outDefault = f.outA ?? (CS ? String(tbal(id)) : '');
  return head('資金 ― 入金・出金・送金', '普通預金 ⇄ 預金トークン（入金＝lock → mint ／ 出金＝burn → unlock）。送金・出金は自分の口座鍵で所有をゼロ知識証明します', 'I-3') + nextCard() +
    `<div class="grid4" style="margin-bottom:16px">${kpi('普通預金（△△銀行）', yen(S.acct[id] || 0), '', '勘定系（模擬）', 'money')}${kpi('預金トークン（Midnight）', fmtTok(id), '', esc(S.token.sym), 'money')}
     ${kpi('口座の状態', CS ? (isReg(id) ? (isFrz(id) ? '凍結中' : '有効') : '未登録') : '—', '', `口座ID ${short(KEYS[id].id, 5)}`)}${kpi('全体の状態', !CS ? '—' : isPaused() ? '停止中' : '稼働中', '', '△△銀行の全体停止')}</div>
    <div class="grid3">
     ${tcard('入金（普通預金 → 預金トークン）', `<div class="card-b"><div class="xs">チェーン</div><div class="chips" style="margin:4px 0 10px"><button class="chip on">Midnight</button></div>
       <div class="xs">金額</div><input class="inp s" style="width:100%" data-f="inA" value="${esc(f.inA ?? '50,000,000')}"><div class="hint">出金口座 普通 ***1234（残高 ${yen(S.acct[id] || 0)}）・手数料無料</div>
       <button class="btn" style="width:100%;margin-top:12px" data-act="depIn">入金を申し込む</button><div class="hint">預金がロックされ、銀行の処理（mint）後に同額の預金トークンが発行されます</div></div>`)}
     ${tcard('出金（預金トークン → 普通預金）', `<div class="card-b"><div class="xs">チェーン</div><div class="chips" style="margin:4px 0 10px"><button class="chip on">Midnight</button></div>
       <div class="xs">金額</div><input class="inp s" style="width:100%" data-f="outA" value="${esc(outDefault ? num(digits(outDefault)) : '')}"><div class="hint">残高 ${fmtTok(id)}・入金先 普通 ***1234（本人名義）</div>
       <button class="btn sec" style="width:100%;margin-top:12px" data-act="depOut">出金する（償還・burn）</button><div class="hint">トークンを償還（burn）し、銀行の処理後に普通預金へ入金されます</div></div>`)}
     ${tcard('送金（預金トークン）', `<div class="card-b"><div class="xs">チェーン</div><div class="chips" style="margin:4px 0 10px"><button class="chip on">Midnight</button></div>
       <div class="xs">受取人</div><select class="inp" style="width:100%;min-width:0" data-f="xTo">${others.map((x) => `<option value="${x}" ${to === x ? 'selected' : ''}>${orgOf(x)}（${nm(x)}）</option>`).join('')}</select>
       <div class="xs" style="margin-top:8px">金額</div><input class="inp s" style="width:100%" data-f="xA" value="${esc(f.xA ?? '5,000,000')}" placeholder="金額を入力"><div class="hint">登録済み口座の間で送金（手数料 DUST は Lace が支払い）</div>
       <button class="btn sec" style="width:100%;margin-top:12px" data-act="xfer">送金する（ZK 証明）</button></div>`)}
    </div>
    <div class="grid2" style="margin-top:16px">${tcard('入金・出金の申込', tbl(['日時', '種別', '>金額', '状態', 'Tx'], mine.map((m) => `<tr><td class="n">${m.ts.slice(5, 16)}</td><td>${m.kind}</td><td class="r n">${yen(m.amount)}</td><td>${m.status === '完了' ? bd('完了', 'ok') : bd('銀行の処理待ち', 'warn')}</td><td>${txSpan(m.kind === '出金' ? m.burnTx : m.tx)}</td></tr>`), 'まだ申込はありません'))}
      ${tcard('送金と受取（オンチェーン）', tbl(['#', '種別', '相手', '>金額'], flows.map((r) => { const out = r.senderHex === KEYS[id].id; return `<tr><td class="n">#${String(r.seq)}</td><td>${bd(OP_LABEL[r.kind], OP_TONE[r.kind])}</td><td>${out ? '→ ' + nameOfHex(r.receiverHex) : '← ' + nameOfHex(r.senderHex)}</td><td class="r n">${out ? '−' : '+'}${yen(r.amount)}</td></tr>`; }), 'まだ送金はありません'))}</div>`;
};

/* ---------- 保有・取引履歴（I-4） ---------- */
PAGES.mypage = () => {
  const id = me() as Holder;
  const sent = S.xfers.filter((t) => t.from === id).slice().reverse(), myEv = S.events.filter((e) => e.user === id);
  const mine = CS ? CS.history.filter((r) => r.senderHex === KEYS[id].id || r.receiverHex === KEYS[id].id) : [];
  return head('保有・取引履歴', '資金残高・送金・取引履歴を確認します（自分の分のみ表示）', 'I-4') + nextCard() +
    `<div class="grid4" style="margin-bottom:16px">${kpi('預金トークン残高', fmtTok(id), '', 'Midnight', 'money')}${kpi('普通預金', yen(S.acct[id] || 0), '', '勘定系（模擬）', 'money')}
     ${kpi('送金（このブラウザで実行）', sent.length, '件', '')}${kpi('手続き中', S.mints.filter((m) => m.party === id && m.status === '処理中').length + S.inq.filter((q) => q.from === id && q.status !== '完了').length, '件', '入出金・返却依頼')}</div>` +
    `<div class="box box-warn" style="margin-bottom:16px">🔒 この画面は自分の分だけを表示していますが、このデモの方式では <b>Midnight の公開台帳上で全口座の残高・送金額・送金先を誰でも参照できます</b>（強制移転・凍結を確実に行うため。課題 C1）。</div>` +
    `<div class="stack">${tcard('送金履歴', tbl(['日時', '送金先', 'チェーン', '>金額', 'Tx', '>操作'], sent.map((t) => { const q = S.inq.find((x) => x.xid === t.id);
       return `<tr><td class="n">${t.ts.slice(5, 16)}</td><td>${orgOf(t.to)}</td><td>${chainBd()}</td><td class="r n">${yen(t.amount)}</td><td>${txSpan(t.tx)}</td><td class="r">${q ? bd('返却：' + q.status, q.status === '完了' ? 'ok' : 'warn') : `<button class="btn sm gh" data-act="inquiry" data-a="${t.id}">返却を依頼</button>`}</td></tr>`; }), 'まだ送金はありません'))}
     ${tcard('オンチェーンの取引（自分の口座に関係するもの）', tbl(['#', '種別', 'From', 'To', '>金額'], histRows(mine), 'まだ取引はありません'))}
     ${tcard('取引履歴（証跡）', tbl(['日時', '操作', '対象', '結果', 'Tx'], myEv.map((e) => `<tr><td class="n">${e.ts.slice(5, 16)}</td><td>${esc(e.op)}</td><td>${e.target}</td><td>${bd(esc(e.result), e.result === '拒否' ? 'ng' : 'ok')}</td><td>${txSpan(e.tx || undefined)}</td></tr>`), '取引履歴はありません'))}</div>`;
};

/* ---------- Recovery（返却依頼・Pactora 運用） ---------- */
PAGES.recovery = () => head('Recovery（返却依頼・強制移転の申請）', '投資家からの返却依頼を調査し、強制移転を申請します（承認・実行は発行銀行）', 'M-8') + nextCard() +
  tcard('返却依頼', tbl(['依頼番号', '依頼者', '対象取引', '>金額', '理由', '状態', '>操作'], S.inq.slice().reverse().map((q) => `<tr><td class="mono">${q.id}</td><td>${orgOf(q.from)}</td><td>${orgOf(q.from)} → ${orgOf(q.to)}<div>${txSpan(q.tx)}</div></td><td class="r n">${yen(q.amount)}</td><td class="xs">${esc(q.reason)}</td>
    <td>${bd(q.status, q.status === '完了' ? 'ok' : q.status === '受付' ? 'warn' : 'info')}</td><td class="r">${q.status === '受付' ? `<button class="btn sm" data-act="applyRecov" data-a="${q.id}">調査して強制移転を申請</button>` : ''}</td></tr>`), '返却依頼はありません')) +
  `<div style="margin-top:16px">${tcard('これまでの Recovery', tbl(['申請番号', '種別', '移転元 → 移転先', '>金額', '承認者', '状態'], S.recov.slice().reverse().map((x) => `<tr><td class="mono">${x.id}</td><td>強制移転</td><td>${orgOf(x.from)} → ${orgOf(x.to)}</td><td class="r n">${yen(x.amount)}</td><td>△△銀行</td><td>${bd(x.status, x.status === '実行済' ? 'ok' : 'warn')}</td></tr>`), 'まだありません'))}</div>`;

/* ---------- コントラクト・ネットワーク設定（AD-3） ---------- */
const CIRCUITS: [string, string, string][] = [
  ['registerAccount', '口座登録（KYC）', '発行体'], ['issue', '発行（mint）', '発行体'], ['forceTransfer', '強制移転', '発行体'], ['forceRedeem', '強制償還', '発行体'],
  ['freezeAccount / unfreezeAccount', '凍結 / 解除', '発行体'], ['pause / unpause', '全体停止 / 解除', '発行体'], ['transfer', '送金', '口座の保有者'], ['redeem', '償還（burn）', '口座の保有者'],
];
PAGES.master = () => {
  const s = SESSION?.info;
  return head('コントラクト・ネットワーク設定', 'ネットワーク・インデクサ・証明の方式、コントラクトと回路（権限）、参加者の口座IDを確認します', 'AD-3') + nextCard() +
    `<div class="grid2">${tcard('ネットワーク', `<div class="card-b">${kvs([['ネットワーク', `Midnight ${esc(NETWORK_ID)}`], ['ウォレット', s ? `${esc(s.name)}（API ${esc(s.apiVersion)}）` : '未接続'], ['インデクサ', s ? `<span class="mono" style="word-break:break-all">${esc(s.indexerUri)}</span>` : '—'], ['証明の方式', s ? esc(s.proofMode) : '—'], ['ZK 鍵', import.meta.env.VITE_EMBED_ZK ? 'HTML に埋め込み（単一 HTML 版）' : 'サーバーから取得（開発サーバー版）']])}</div>`)}
     ${tcard('コントラクト', `<div class="card-b">${kvs([['アドレス', S.contract ? `<span class="mono" style="word-break:break-all">${esc(S.contract)}</span>` : '—'], ['トークン', `${esc(S.token.name)}（${esc(S.token.sym)}）`], ['発行体の口座ID', CS ? `<span class="mono">${short(CS.issuerHex, 8)}</span>` : '—'], ['言語', 'Compact 0.31.1（contract/tdeposit.compact）']])}</div>`)}</div>` +
    `<div style="margin-top:16px">${tcard('回路と実行権限', tbl(['回路', '操作', '実行できる人（ゼロ知識証明する内容）'], CIRCUITS.map(([c, l, w]) => `<tr><td class="mono">${c}</td><td>${l}</td><td>${w === '発行体' ? '発行体：口座鍵のハッシュが issuer と一致すること' : '保有者：送金元・償還元の口座鍵を持っていること'}</td></tr>`)))}</div>
     <div style="margin-top:16px">${tcard('参加者', tbl(['参加者', '区分', '口座ID', '状態'], UC_USERS.map((p) => `<tr><td><b>${orgOf(p)}</b><div class="xs">${nm(p)}</div></td><td>${ROLE[roleOf(p)].label}</td><td class="mono">${isHolder(p) ? short(KEYS[p].id, 6) : '—（オフチェーンのみ）'}</td><td>${p === 'bank' ? (CS ? (iAmIssuer() ? bd('発行体', 'ok') : bd('発行体と不一致', 'ng')) : '—') : isHolder(p) ? acctState(p) : bd('登録済', 'ok')}</td></tr>`)))}</div>`;
};

/* ---------- 監査ログ（AD-4） ---------- */
PAGES.audit = () => head('監査ログ', '誰が・いつ・何を・どの対象に・結果はどうだったか（Tx 含む）と、コントラクトに記録されたオンチェーンの操作履歴を確認します', 'AD-4') + nextCard() +
  tcard(`操作ログ（${S.events.length}件・このブラウザ）`, tbl(['日時', 'ユーザー', '操作', '対象', '結果', 'Tx／証跡', '>'], S.events.map((e, i) => `<tr><td class="n">${e.ts.slice(5, 16)}</td><td>${e.user ? nm(e.user) : '—'}<div class="xs">${e.user ? orgOf(e.user) : ''}</div></td><td>${esc(e.op)}</td><td>${e.target}</td><td>${bd(esc(e.result), e.result === '拒否' || e.result === '差異あり' ? 'ng' : 'ok')}</td><td>${txSpan(e.tx || undefined)}</td>
    <td class="r">${e.tx ? `<button class="btn sm gh" data-act="trace" data-a="${i}">経緯を追跡</button>` : ''}</td></tr>`), 'まだ操作ログはありません')) +
  `<div style="margin-top:16px">${tcard(`オンチェーンの操作履歴（${CS ? CS.history.length : '—'}件・コントラクトの history）`, tbl(['#', '種別', 'From', 'To', '>金額'], CS ? histRows(CS.history) : [], CS ? '操作はまだありません' : 'コントラクトの状態を取得中です'))}</div>`;

/* ---------- 実行ログ（AD-6） ---------- */
PAGES.log = () => head('Midnight 実行ログ', '証明の生成・Lace の承認・送信の進み具合とエラー（困ったらまずここを見る）', 'AD-6', '<button class="btn gh" data-act="dustRefresh">DUST を再取得</button>') +
  tcard(`ログ（${LOGS.length}件・このタブのみ）`, LOGS.length ? `<div class="card-b mlog" style="max-height:none">${LOGS.map((l) => `<div class="${l.level}"><span class="n" style="color:var(--ink3)">${l.at}</span> ${esc(l.msg)}</div>`).join('')}</div>` : '<div class="empty">まだログはありません</div>');

/* =====================================================================
 * 操作（data-act）
 * ===================================================================== */
type Act = (el: HTMLElement) => void;
const A: Record<string, Act> = {};
A.closeModal = () => closeModal();
A.signOk = () => { const b = document.getElementById('signBtn') as HTMLButtonElement | null; if (b) b.disabled = true; const f = PEND; PEND = null; f?.(); };
A.doneNext = () => { closeModal(); const cs = curStep(); if (cs >= 0) openStep(cs); };
A.goLog = () => { closeModal(); if (U().screen === 'app') go('log'); };
A.copy = (el) => { void navigator.clipboard.writeText(el.dataset.a || ''); toast('コピーしました'); };
A.pickUc = () => { Object.assign(U(), { screen: 'provision', user: null, sel: null, tab: 'guide' }); render(); void checkProofServer().then(() => { if (U().screen === 'provision') render(); }); };
A.toUsecase = () => { Object.assign(U(), { screen: 'usecase', user: null, pop: null }); render(); };
A.toLogin = () => { Object.assign(U(), { screen: 'login', loginErr: false }); render(); };
A.fill = (el) => { if ((el as HTMLElement).closest('button') && (el as HTMLElement).closest('button') !== el) return; const id = el.dataset.a as UserId; Object.assign(U(), { sel: id, loginErr: false }); U().form.lgEmail = USERS[id].email; U().form.lgPw = 'demo-password'; render(); };
A.login = (el) => login(el.dataset.a as UserId);
A.loginForm = () => { const e = (U().form.lgEmail || '').trim(), id = UC_USERS.find((k) => USERS[k].email === e); if (id && U().form.lgPw) login(id); else { U().loginErr = true; render(); } };
A.logout = () => { Object.assign(U(), { screen: 'login', user: null, pop: null, sel: null }); render(); };
A.pop = (el) => { U().pop = U().pop === el.dataset.a ? null : el.dataset.a || null; render(); };
A.switch = (el) => { const id = el.dataset.a as UserId, pg = U().page; login(id, pg); toast(`${nm(id)}（${ROLE[roleOf(id)].label}・${orgOf(id)}）に切り替えました`); };
A.go = (el) => go(el.dataset.a || 'home');
A.tab = (el) => { U().tab = el.dataset.a as UI['tab']; render(); };
A.step = (el) => openStep(Number(el.dataset.a));

/* --- Lace・コントラクト --- */
A.connect = () => {
  if (BUSY) return;
  BUSY = true; toast('Lace に接続しています…（Lace の承認画面が開いたら承認してください）'); render();
  ensureReady(!!S.contract).then(() => { BUSY = false; toast('接続しました'); render(); }).catch((e) => { BUSY = false; render(); errorDlg('Lace に接続', e, 0); });
};
A.psCheck = () => { void checkProofServer().then((ok) => { render(); toast(ok ? 'Proof Server に接続できました' : 'Proof Server に接続できません（Rancher Desktop と Proof Server を起動してください）', ok ? '' : 'ng'); }); };
A.dustRefresh = () => {
  if (!SESSION) { toast('先に Lace に接続してください', 'ng'); return; }
  readWalletStatus(SESSION.api, (m) => log(m)).then((st) => { Object.assign(SESSION!.info, st); render(); toast(`DUST 残高 ${st.dustBalance === undefined ? '不明' : num(st.dustBalance)}`); });
};
A.walletDlg = () => {
  const s = SESSION?.info, id = me();
  modal(`<div class="dlg-h">ウォレット・口座鍵<span class="sid">L-3</span><button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <div class="xs" style="font-weight:700;color:var(--navy);margin-bottom:6px">1. 手数料を支払うウォレット（全ユーザー共通）</div>
    ${s ? kvs([['ウォレット', `${esc(s.name)} ／ ${esc(s.networkId)}`], ['アドレス', `<span class="mono" style="word-break:break-all">${esc(s.unshieldedAddress)}</span>`], ['DUST', `${s.dustBalance === undefined ? '不明' : num(s.dustBalance)}${s.dustCap !== undefined ? ` ／ 上限 ${num(s.dustCap)}` : ''}`], ['証明', esc(s.proofMode)]]) : '<div class="box box-warn">Lace に接続されていません</div>'}
    <div class="xs" style="font-weight:700;color:var(--navy);margin:14px 0 6px">2. ${who(id)} の口座鍵</div>
    ${isHolder(id) ? kvs([['口座ID（チェーンに記録）', `<span class="mono" style="word-break:break-all">${KEYS[id].id}</span>`], ['口座鍵（秘密鍵）', 'このブラウザの localStorage に保存（チェーンには出ない）'], ['状態', acctState(id)]]) : '<div class="box box-mute">このユーザーはオンチェーンの口座を持ちません（Pactora 上のオフチェーン操作のみ）</div>'}
    <div class="box box-mute" style="margin-top:10px;font-size:calc(11.5px + var(--fs))">Midnight では、手数料（DUST）の支払いと操作の権限を別の鍵で扱えます。このデモでは手数料はすべて接続中の Lace が支払い、権限・所有は各ユーザーの口座鍵でゼロ知識証明します。</div></div>
    <div class="dlg-f"><button class="btn gh" style="margin-right:auto" data-act="keysExport">口座鍵のエクスポート</button>${s ? '<button class="btn gh" data-act="dustRefresh">DUST を再取得</button>' : '<button class="btn" data-act="connect">Lace に接続</button>'}<button class="btn" data-act="closeModal">閉じる</button></div>`, true);
};
A.keysExport = () => {
  const json = JSON.stringify({ contract: S.contract, keys: Object.fromEntries(HOLDERS.map((h) => [h, KEYS[h].sk])) }, null, 1);
  modal(`<div class="dlg-h ng">口座鍵のエクスポート<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <div class="box box-ng" style="margin-bottom:10px">秘密鍵です。デモ用の鍵以外では絶対に共有しないでください。別のブラウザ・配布形態（file:// / localhost）で同じ口座を使うときにインポートします。</div>
    <textarea class="inp" style="width:100%;height:150px;font-family:Consolas,monospace;font-size:12px" readonly>${esc(json)}</textarea></div>
    <div class="dlg-f"><button class="btn gh" data-act="copy" data-a="${esc(json)}">コピー</button><button class="btn" data-act="closeModal">閉じる</button></div>`, true);
};
A.keysImport = () => modal(`<div class="dlg-h">口座鍵のインポート<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <p class="xs" style="margin:0 0 8px">エクスポートした JSON を貼り付けます。現在の口座鍵は上書きされます（コントラクトのアドレスが含まれていれば、それも設定します）。</p>
    <textarea class="inp" id="keysIn" style="width:100%;height:150px;font-family:Consolas,monospace;font-size:12px"></textarea></div>
    <div class="dlg-f"><button class="btn gh" data-act="closeModal">キャンセル</button><button class="btn" data-act="keysImportOk">インポート</button></div>`, true);
A.keysImportOk = () => {
  try {
    const j = JSON.parse((document.getElementById('keysIn') as HTMLTextAreaElement).value);
    const next = { ...KEYS };
    HOLDERS.forEach((h) => { if (j.keys?.[h]) next[h] = keyFromSk(String(j.keys[h])); });
    KEYS = next; saveKeys();
    if (j.contract && typeof j.contract === 'string' && j.contract !== S.contract) { SUB?.unsubscribe(); API = undefined; CS = undefined; const ui = S.ui; S = defaultState(); S.ui = ui; S.contract = j.contract; }
    save(); closeModal(); render(); toast('口座鍵をインポートしました');
  } catch (e) { toast(`インポートできません：${esc(errMsg(e))}`, 'ng'); }
};
A.joinAsk = () => modal(`<div class="dlg-h">既存のコントラクトを指定<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <p class="xs" style="margin:0 0 8px">別のブラウザでデプロイしたコントラクトを使う場合に指定します。銀行の操作をするには、デプロイしたときの銀行の口座鍵（インポート）が必要です。</p>
    <input class="inp" id="joinIn" style="width:100%" value="${esc(S.contract || '')}" placeholder="0200…"></div>
    <div class="dlg-f"><button class="btn gh" data-act="closeModal">キャンセル</button><button class="btn" data-act="joinAskOk">設定する</button></div>`, true);
A.joinAskOk = () => {
  const v = (document.getElementById('joinIn') as HTMLInputElement).value.trim();
  if (v !== S.contract) { SUB?.unsubscribe(); API = undefined; CS = undefined; const ui = S.ui; S = defaultState(); S.ui = ui; S.contract = v || null; }
  save(); closeModal(); render();
  if (v && SESSION) A.connect(document.body);
};
A.join = () => {
  const v = (U().form.joinAddr || '').trim(); if (!v) { toast('アドレスを入力してください', 'ng'); return; }
  if (BUSY) return;
  BUSY = true; render();
  joinContract(v).then(() => { BUSY = false; addEvent('コントラクトに接続', `<span class="mono">${short(v, 6)}</span>`); done('コントラクトに接続しました', `<span class="mono">${esc(short(v, 10))}</span>`); })
    .catch((e) => { BUSY = false; render(); errorDlg('コントラクトに接続', e, 0); });
};
A.deploy = () => {
  const f = U().form, name = (f.tkName ?? TOKEN_DEFAULT.name).trim(), sym = (f.tkSym ?? TOKEN_DEFAULT.sym).trim();
  if (!name || !sym) { toast('トークン名とシンボルを入力してください', 'ng'); return; }
  if (!SESSION) { toast('先に Lace に接続してください', 'ng'); return; }
  txSign({ op: '預金トークンの提供開始（コントラクトのデプロイ）', rows: [['トークン', `${esc(name)}（${esc(sym)}）`], ['発行体', who('bank')]], signer: 'bank' },
    [{ label: 'デプロイ', needContract: false, run: async () => { const a = await TDepositAPI.deploy(SESSION!.providers, skOf('bank'), name, sym); useApi(a); S.token = { name, sym }; return { txId: '', txHash: a.deployTx.txHash, blockHeight: a.deployTx.blockHeight ?? 0 }; } }],
    ([r]) => { addEvent('提供開始（デプロイ）', `${esc(sym)}（Midnight）`, '成功', txOf(r), r.blockHeight); done('預金トークンの提供を開始しました', `コントラクト <span class="mono">${esc(short(S.contract || '', 10))}</span>`); });
};

/* --- 口座登録・凍結・全体停止 --- */
const regTask = (h: Holder): Task => ({ label: `口座登録（${orgOf(h)}）`, run: () => API!.registerAccount(skOf('bank'), idBytes(h)) });
A.regAll = () => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const list = INVESTORS.filter((h) => !isReg(h));
  txSign({ op: '口座登録（KYC 完了）', rows: list.map((h) => ['登録する口座', `${who(h)}<br><span class="mono">${short(KEYS[h].id, 8)}</span>`] as [string, string]), signer: 'bank' }, list.map(regTask),
    (rs) => { rs.forEach((r, i) => addEvent('口座登録（KYC）', who(list[i]), '成功', txOf(r), r.blockHeight)); done(`${list.length} 口座を登録しました`, list.map(orgOf).join('・')); });
};
A.regOne = (el) => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const h = el.dataset.a as Holder;
  txSign({ op: '口座登録（KYC 完了）', rows: [['登録する口座', `${who(h)}<br><span class="mono">${short(KEYS[h].id, 8)}</span>`]], signer: 'bank' }, [regTask(h)],
    ([r]) => { addEvent('口座登録（KYC）', who(h), '成功', txOf(r), r.blockHeight); done('口座を登録しました', orgOf(h)); });
};
A.freezeToggle = (el) => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const h = el.dataset.a as Holder, on = !isFrz(h);
  txSign({ op: on ? '口座の凍結（freezeAccount）' : '凍結の解除（unfreezeAccount）', rows: [['対象', who(h)], ['影響', on ? '送金・償還：不可／受取：可' : '通常どおり']], signer: 'bank', tone: on ? 'ng' : '' },
    [{ label: on ? '凍結' : '凍結解除', run: () => (on ? API!.freezeAccount(skOf('bank'), idBytes(h)) : API!.unfreezeAccount(skOf('bank'), idBytes(h))) }],
    ([r]) => { addEvent(on ? '凍結' : '凍結解除', who(h), '成功', txOf(r), r.blockHeight); done(on ? '口座を凍結しました' : '凍結を解除しました', orgOf(h)); });
};
A.pauseToggle = () => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const on = !isPaused();
  txSign({ op: on ? '全体の移転停止（pause）' : '移転の再開（unpause）', rows: [['対象', `${esc(S.token.name)}（Midnight）`], ['影響', on ? '利用者の送金・償還、新規発行を停止' : '通常どおり']], signer: 'bank', tone: on ? 'ng' : '' },
    [{ label: on ? '全体停止' : '停止解除', run: () => (on ? API!.pause(skOf('bank')) : API!.unpause(skOf('bank'))) }],
    ([r]) => { addEvent(on ? '全体停止' : '停止解除', `${esc(S.token.sym)}（Midnight）`, '成功', txOf(r), r.blockHeight); done(on ? '全体の移転を一時停止しました' : '移転を再開しました'); });
};

/* --- 入金・出金・送金（投資家） --- */
A.depIn = () => {
  const id = me() as Holder, a = digits(U().form.inA ?? '50000000');
  if (!(a > 0) || a > (S.acct[id] || 0)) { toast('金額を確認してください（普通預金の残高を超えています）', 'ng'); return; }
  if (CS && !isReg(id)) { toast('口座が未登録です（△△銀行の口座登録を待ってください）', 'ng'); return; }
  S.seq.m++; S.acct[id] -= a; S.lock += a;
  S.mints.push({ id: 'M-' + String(S.seq.m).padStart(4, '0'), ts: now(), party: id, kind: '入金', amount: a, status: '処理中' });
  addEvent('入金申込（普通預金 → 預金トークン）', yen(a), '受付');
  done('入金を申し込みました', '普通預金をロックしました。△△銀行の処理（mint）後に預金トークンが発行されます');
};
A.depOut = () => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const id = me() as Holder, a = digits(U().form.outA ?? String(tbal(id)));
  if (!(a > 0) || BigInt(a) > tbal(id)) { toast('金額を確認してください（預金トークンの残高を超えています）', 'ng'); return; }
  if (isFrz(id)) { toast('口座が凍結されているため出金できません', 'ng'); return; }
  if (isPaused()) { toast('預金トークンは全体停止中です', 'ng'); return; }
  txSign({ op: '預金トークンの償還（redeem・burn）', rows: [['金額', yen(a)], ['入金先', '普通 ***1234（本人名義）・銀行の処理後']], signer: id },
    [{ label: '償還', run: () => API!.redeem(skOf(id), BigInt(a)) }],
    ([r]) => {
      S.seq.m++; S.mints.push({ id: 'M-' + String(S.seq.m).padStart(4, '0'), ts: now(), party: id, kind: '出金', amount: a, status: '処理中', burnTx: txOf(r) });
      delete U().form.outA;
      addEvent('出金（償還・burn）', yen(a), '成功', txOf(r), r.blockHeight); done('預金トークンを償還しました', '△△銀行の処理後、普通預金へ入金されます');
    });
};
A.xfer = () => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const id = me() as Holder, f = U().form, to = (f.xTo as Holder) || INVESTORS.find((x) => x !== id)!, a = digits(f.xA ?? '5000000');
  if (!(a > 0)) { toast('金額を入力してください', 'ng'); return; }
  const blocked = isFrz(id) ? '送金元の口座が凍結されています' : isPaused() ? '預金トークンは全体停止中です' : isFrz(to) ? '送金先の口座が凍結されています' : null;
  if (!blocked && BigInt(a) > tbal(id)) { toast('金額を確認してください（預金トークンの残高を超えています）', 'ng'); return; }
  if (!blocked && !isReg(to)) { toast('送金先の口座が未登録です', 'ng'); return; }
  txSign({ op: '預金トークンの送金（transfer）', rows: [['送金先', `${who(to)}<br><span class="mono">${short(KEYS[to].id, 8)}</span>`], ['金額', yen(a)]], signer: id,
    warn: blocked ? `${blocked}。実行すると、ブラウザ内での回路の実行（証明の生成前）にコントラクトの条件チェックで拒否されます。手数料はかかりません。拒否されることを確認する場合は「承認して実行」を押してください。` : undefined },
    [{ label: '送金', run: () => API!.transfer(skOf(id), idBytes(to), BigInt(a)) }],
    ([r]) => {
      S.seq.t++; S.xfers.push({ id: 'T-' + String(S.seq.t).padStart(4, '0'), ts: now(), from: id, to, amount: a, tx: txOf(r) });
      addEvent('送金', `${orgOf(to)} へ ${yen(a)}`, '成功', txOf(r), r.blockHeight); done('送金しました', `${orgOf(to)} へ ${yen(a)}`);
    },
    (err) => {
      if (!blocked) return false;
      if (isFrz(id)) S.flags.frozenTried = true;
      addEvent('送金（拒否）', `${orgOf(to)} へ ${yen(a)}：${esc(errMsg(err)).slice(0, 80)}`, '拒否');
      save(); render();
      modal(`<div class="dlg-h ng">コントラクトが送金を拒否しました<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
        <div class="box box-ng" style="word-break:break-all">${esc(errMsg(err))}</div>
        <p style="margin:12px 0 0">回路の条件チェック（<code>assert</code>）で拒否されたため、証明は作られず、トランザクションも送信されていません（手数料なし）。凍結・停止の判定は銀行のシステムではなく、コントラクト自身が行っています。</p>
        ${GUIDE[curStep()] ? `<div class="nx"><div class="k">ガイド ― 次のステップ（${curStep() + 1}/${GUIDE.length}）</div><div><b>${nm(GUIDE[curStep()].u)}</b>：${GUIDE[curStep()].t}</div></div>` : ''}</div>
        <div class="dlg-f"><button class="btn gh" data-act="closeModal">この画面に留まる</button><button class="btn" data-act="doneNext">次のステップへ →</button></div>`);
      return true;
    });
};

/* --- 発行・出金処理（銀行） --- */
A.procMint = (el) => {
  const m = S.mints.find((x) => x.id === el.dataset.a); if (!m) return;
  if (m.kind === '出金') {
    confirmDlg('出金の処理（普通預金への入金）', `<p style="margin:0 0 10px">償還（burn）済みのトークンの代わり金を、勘定系で普通預金へ入金し、ロックを解除します。</p>${kvs([['顧客', who(m.party)], ['金額', yen(m.amount)], ['償還 Tx', txSpan(m.burnTx)]])}`, '普通預金へ入金する', 'procOutOk', m.id);
    return;
  }
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  if (isPaused()) { toast('全体停止中は発行できません（口座管理で再開してください）', 'ng'); return; }
  if (!isReg(m.party)) { toast('顧客の口座が未登録です（口座管理で登録してください）', 'ng'); return; }
  txSign({ op: '預金トークンの発行（issue・mint）', rows: [['顧客', `${who(m.party)}<br><span class="mono">${short(KEYS[m.party].id, 8)}</span>`], ['金額', yen(m.amount)], ['勘定系', `ロック済 ✓（ロックID L-${m.id.slice(2)}）`]], signer: 'bank' },
    [{ label: '発行', run: () => API!.issue(skOf('bank'), idBytes(m.party), BigInt(m.amount)) }],
    ([r]) => { m.status = '完了'; m.tx = txOf(r); addEvent('発行（mint）', `${orgOf(m.party)} ${yen(m.amount)}`, '成功', txOf(r), r.blockHeight); done('預金トークンを発行しました', `${orgOf(m.party)}　${yen(m.amount)}`); });
};
A.procOutOk = (el) => {
  const m = S.mints.find((x) => x.id === el.dataset.a); if (!m) return;
  m.status = '完了'; m.tx = m.burnTx; S.lock -= m.amount; S.acct[m.party] = (S.acct[m.party] || 0) + m.amount;
  addEvent('出金処理（普通預金へ入金・unlock）', `${orgOf(m.party)} ${yen(m.amount)}`, '成功');
  closeModal(); done('普通預金へ入金しました', `${orgOf(m.party)}　${yen(m.amount)}（勘定系のロックを解除）`);
};

/* --- 誤送金の返却（Recovery） --- */
A.inquiry = (el) => {
  const t = S.xfers.find((x) => x.id === el.dataset.a); if (!t) return;
  confirmDlg('誤送金の返却を依頼', `<p style="margin:0 0 10px">送金の返却を依頼します。Pactora 運用が調査し、△△銀行の承認後に強制移転で返却されます。</p>${kvs([['対象の送金', `${orgOf(t.to)} へ ${yen(t.amount)}（Midnight）`], ['Tx', txSpan(t.tx)]])}
    <label class="xs" style="display:block;margin-top:12px">理由</label><input class="inp" style="width:100%" data-f="inqReason" value="${esc(U().form.inqReason || '送金先の選択誤り（本来は社内の別口座）')}">`, '返却を依頼する', 'inquiryOk', t.id);
};
A.inquiryOk = (el) => {
  const t = S.xfers.find((x) => x.id === el.dataset.a); if (!t) return;
  S.seq.q++;
  S.inq.push({ id: 'Q-' + String(S.seq.q).padStart(4, '0'), xid: t.id, ts: now(), from: t.from, to: t.to, amount: t.amount, tx: t.tx, reason: U().form.inqReason || '送金先の選択誤り（本来は社内の別口座）', status: '受付' });
  addEvent('返却依頼', `${orgOf(t.to)} への送金 ${yen(t.amount)}`, '受付');
  closeModal(); done('返却を依頼しました', 'Pactora 運用が調査します。結果はお知らせします');
};
A.applyRecov = (el) => {
  const q = S.inq.find((x) => x.id === el.dataset.a); if (!q) return;
  const bal = CS ? yen(tbal(q.to)) : '—';
  confirmDlg('強制移転の申請', `<p style="margin:0 0 10px">調査結果にもとづき、強制移転を申請します。承認・実行は △△銀行（発行銀行）が行います。</p>${kvs([['移転元', `${who(q.to)}（現在の残高 ${bal}）`], ['移転先', who(q.from)], ['金額', yen(q.amount)], ['チェーン', 'Midnight'], ['調査結果', '誤送金と確認（受取人に照会済み）']])}`, '申請する', 'applyRecovOk', q.id);
};
A.applyRecovOk = (el) => {
  const q = S.inq.find((x) => x.id === el.dataset.a); if (!q) return;
  S.seq.r++;
  S.recov.push({ id: 'R-' + String(S.seq.r).padStart(4, '0'), inq: q.id, from: q.to, to: q.from, amount: q.amount, reason: q.reason, maker: me(), status: '承認待ち' });
  q.status = '申請済'; addEvent('強制移転の申請', `${orgOf(q.to)} → ${orgOf(q.from)} ${yen(q.amount)}`, '承認待ち');
  closeModal(); done('強制移転を申請しました', '△△銀行の承認待ちです');
};
A.execRecov = (el) => {
  const x = S.recov.find((r) => r.id === el.dataset.a); if (!x) return;
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  if (BigInt(x.amount) > tbal(x.from)) { toast(`移転元の残高（${yen(tbal(x.from))}）が不足しています`, 'ng'); return; }
  txSign({ op: '強制移転（forceTransfer）', rows: [['移転元', who(x.from)], ['移転先', who(x.to)], ['金額', yen(x.amount)], ['申請', `${nm(x.maker)}（Pactora運用）`]], signer: 'bank', tone: 'ng' },
    [{ label: '強制移転', run: () => API!.forceTransfer(skOf('bank'), idBytes(x.from), idBytes(x.to), BigInt(x.amount)) }],
    ([r]) => {
      x.status = '実行済'; x.tx = txOf(r);
      const q = S.inq.find((i) => i.id === x.inq); if (q) q.status = '完了';
      addEvent('強制移転の承認・実行', `${orgOf(x.from)} → ${orgOf(x.to)} ${yen(x.amount)}`, '成功', txOf(r), r.blockHeight);
      done('強制移転を実行しました', `${orgOf(x.to)} へ ${yen(x.amount)} を返却しました`);
    });
};
A.forceRedeem = () => {
  const e = needChain(); if (e) { toast(e, 'ng'); return; }
  const f = U().form, h = (f.frTarget as Holder) || 'invB', a = digits(f.frAmt);
  if (!(a > 0) || BigInt(a) > tbal(h)) { toast('金額を確認してください（対象口座の残高を超えています）', 'ng'); return; }
  txSign({ op: '強制償還（forceRedeem）', rows: [['対象', who(h)], ['金額', yen(a)], ['勘定系', '償還額の支払いは別途処理']], signer: 'bank', tone: 'ng' },
    [{ label: '強制償還', run: () => API!.forceRedeem(skOf('bank'), idBytes(h), BigInt(a)) }],
    ([r]) => { S.lock -= a; delete f.frAmt; addEvent('強制償還', `${orgOf(h)} ${yen(a)}（勘定系で別途処理）`, '成功', txOf(r), r.blockHeight); done('強制償還しました', `${orgOf(h)}　${yen(a)}`); });
};

/* --- 照合・監査 --- */
A.recon = () => {
  if (!CS) return;
  const chain = supply(), diff = S.lock - chain, pi = pendIn(), po = pendOut(), ok = diff - pi + po === 0;
  S.recon = { ts: now(), ledger: S.lock, chain, diff, pendIn: pi, pendOut: po, ok };
  addEvent('照合', '預金台帳 ⇄ トークン発行残高（Midnight）', ok ? (diff === 0 ? '一致' : '一致（処理待ちを除く）') : '差異あり');
  done(ok ? '照合が完了しました' : '説明できない差異があります', ok ? (diff === 0 ? '預金台帳とオンチェーンの発行残高は一致しています（差異 ¥0）' : `差異 ${yen(diff)} は処理待ちの入出金で説明できます`) : `差異 ${yen(diff - pi + po)}。全体停止と原因の調査を検討してください`);
};
A.trace = (el) => {
  const e = S.events[Number(el.dataset.a)]; if (!e) return;
  S.flags.traced = true; save(); render();
  const rel = S.events.filter((x) => x.tx).slice(0, 8).reverse();
  const oc = CS ? CS.history.slice(0, 6) : [];
  modal(`<div class="dlg-h">取引の経緯 ― ${esc(e.op)}<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">${kvs([['対象', e.target], ['Tx ハッシュ', `<span class="mono" style="word-break:break-all">${esc(e.tx)}</span>`], ['ブロック', e.block ? esc(e.block) : '—'], ['チェーン', `Midnight ${esc(NETWORK_ID)}（コントラクト <span class="mono">${esc(short(S.contract || '', 6))}</span>）`]])}
    <h4 style="margin:14px 0 6px;font-size:calc(12.5px + var(--fs));color:var(--navy)">関連する操作（時系列・Tx のあるもの）</h4><ul class="tl">${rel.map((x) => `<li><span class="d n">${x.ts.slice(5, 16)}</span><span><b>${x.user ? nm(x.user) : '—'}</b>：${esc(x.op)} ／ ${x.target} ${bd(esc(x.result), 'ok')}</span></li>`).join('')}</ul>
    <h4 style="margin:14px 0 6px;font-size:calc(12.5px + var(--fs));color:var(--navy)">オンチェーンの記録（コントラクトの history・新しい順）</h4>${tbl(['#', '種別', 'From', 'To', '>金額'], histRows(oc), '—')}
    <p class="xs" style="margin:8px 0 0">オンチェーンの history には日時や Tx ハッシュは記録されません（Midnight にはイベントログがないため）。日時・Tx はこのブラウザの操作ログと突き合わせています（課題 M6）。</p></div>
    <div class="dlg-f"><button class="btn" data-act="closeModal">閉じる</button></div>`, true);
};

/* --- 初期化 --- */
A.resetAsk = () => modal(`<div class="dlg-h">初期化<button class="x" data-act="closeModal">×</button></div><div class="dlg-b">
    <p style="margin:0 0 10px">ブロックチェーン上の記録は消せないため、次のどちらかを選んでください。口座鍵はどちらでも残ります。</p>
    ${kvs([['業務データだけ初期化', '同じコントラクトを使い続けます。申込・依頼・照合・操作ログ・普通預金（模擬）を最初に戻します。オンチェーンの残高・登録・凍結はそのままです'], ['新しいコントラクトで最初から', 'コントラクトの設定を外し、ガイドの最初（提供開始＝デプロイ）からやり直します']])}</div>
    <div class="dlg-f"><button class="btn gh" data-act="closeModal">キャンセル</button><button class="btn sec" data-act="resetData">業務データだけ初期化</button><button class="btn ng" data-act="resetAll">新しいコントラクトで最初から</button></div>`, true);
A.resetData = () => { const c = S.contract, ui = S.ui, tk = S.token; S = defaultState(); S.contract = c; S.ui = ui; S.token = tk; save(); closeModal(); render(); toast('業務データを初期化しました'); };
A.resetAll = () => { SUB?.unsubscribe(); API = undefined; CS = undefined; const ui = S.ui; S = defaultState(); S.ui = { ...ui, page: 'home' }; save(); closeModal(); if (ui.screen === 'app') openStep(0); else render(); toast('新しいコントラクトで最初から始めます'); };

/* =====================================================================
 * 描画・イベント
 * ===================================================================== */
function urlOf() {
  const u = U();
  if (u.screen === 'usecase') return '/start';
  if (u.screen === 'provision') return '/start/dep/setup';
  if (u.screen === 'login') return '/login?usecase=dep';
  return `/dep/${u.page}`;
}
function render() {
  const u = U(), root = document.getElementById('root')!;
  if (u.screen === 'app' && !u.user) u.screen = 'login';
  // 入力中の欄（data-f）とカーソル位置を保持する（オンチェーン状態の更新で再描画されても入力が途切れないように）
  const act = document.activeElement as HTMLInputElement | null;
  const focusF = act && root.contains(act) ? act.dataset?.f : undefined;
  const selS = focusF ? act!.selectionStart : null, selE = focusF ? act!.selectionEnd : null;
  const prevBody = document.querySelector('.sbody'), prevScroll = prevBody ? prevBody.scrollTop : 0;
  root.innerHTML = u.screen === 'usecase' ? vUsecase() : u.screen === 'provision' ? vProvision() : u.screen === 'login' ? vLogin() : vApp();
  const ch = document.querySelector('.chrome') as HTMLElement;
  document.documentElement.style.setProperty('--chromeH', ch.offsetHeight + 'px');
  document.documentElement.style.setProperty('--stick', ch.offsetHeight + 56 + 'px');
  const sb = document.querySelector('.sbody'); if (sb) sb.scrollTop = prevScroll;
  if (focusF) {
    const el = root.querySelector(`[data-f="${focusF}"]`) as HTMLInputElement | null;
    if (el) { el.focus(); try { if (selS !== null && selE !== null) el.setSelectionRange(selS, selE); } catch { /* select 要素など */ } }
  }
  document.getElementById('url')!.textContent = 'https://app.pactora-bc.com' + urlOf();
  save();
}
export function start() {
  document.body.classList.add('heroC', 'fs2', 'roleC');
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'ov') { closeModal(); return; }
    const el = target.closest('[data-act]') as HTMLElement | null;
    if (!el) { if (U().pop && !target.closest('.dd')) { U().pop = null; render(); } return; }
    if (target.closest('.dd') && el.dataset.act === 'pop') return;
    if ((el as HTMLButtonElement).disabled) return;
    const fn = A[el.dataset.act!]; if (fn) { e.preventDefault(); e.stopPropagation(); fn(el); }
  });
  document.addEventListener('input', (e) => { const t = e.target as HTMLInputElement, f = t.dataset?.f; if (f) { U().form[f] = t.value; save(); } });
  document.addEventListener('change', (e) => { const t = e.target as HTMLInputElement, f = t.dataset?.f; if (!f) return; U().form[f] = t.value; save(); if (t.tagName === 'SELECT') render(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    const t = e.target as HTMLElement;
    if (e.key === 'Enter' && U().screen === 'login' && (t.id === 'lgEmail' || t.id === 'lgPw')) A.loginForm(t);
  });
  U().pop = null;
  render();
  // ログイン後の画面で再読み込みした場合は、Lace とコントラクトに自動で再接続する
  if (U().screen === 'app') autoConnect();
}
