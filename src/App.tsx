import { useCallback, useEffect, useMemo, useState } from 'react';
import { fromHex } from '@midnight-ntwrk/compact-runtime';
import type { Subscription } from 'rxjs';
import { OpKind } from './contract';
import { connectWallet, NETWORK_ID, readWalletStatus, type Session } from './midnight/wallet';
import { TDepositAPI, type TDepositState, type TxResult } from './midnight/tdepositApi';
import {
  type Identity,
  isHex32,
  loadIdentities,
  makeIdentity,
  normalizeHex,
  saveIdentities,
  secretKeyOf,
} from './midnight/identities';

const ADDRESS_KEY = 'tdeposit.contractAddress.v1';

type LogLine = { at: string; level: 'info' | 'ok' | 'error'; msg: string };

const OP_LABEL: Record<OpKind, string> = {
  [OpKind.REGISTER]: '口座登録',
  [OpKind.ISSUE]: '発行',
  [OpKind.TRANSFER]: '移転',
  [OpKind.REDEEM]: '償還',
  [OpKind.FORCE_TRANSFER]: '強制移転',
  [OpKind.FORCE_REDEEM]: '強制償還',
  [OpKind.FREEZE]: '凍結',
  [OpKind.UNFREEZE]: '凍結解除',
  [OpKind.PAUSE]: '全体停止',
  [OpKind.UNPAUSE]: '停止解除',
};

const fmt = (v: bigint | undefined) => (v === undefined ? '-' : v.toLocaleString('ja-JP'));
const short = (h: string, n = 8) => (h.length > n * 2 ? `${h.slice(0, n)}…${h.slice(-6)}` : h);

export default function App() {
  const [session, setSession] = useState<Session>();
  const [api, setApi] = useState<TDepositAPI>();
  const [state, setState] = useState<TDepositState>();
  const [identities, setIdentities] = useState<Identity[]>(() => loadIdentities());
  const [actorIdx, setActorIdx] = useState(0);
  const [busy, setBusy] = useState<string>();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [tab, setTab] = useState<'bank' | 'customer'>('bank');

  const log = useCallback((msg: string, level: LogLine['level'] = 'info') => {
    setLogs((l) => [{ at: new Date().toLocaleTimeString('ja-JP'), level, msg }, ...l].slice(0, 200));
  }, []);

  const actor = identities[actorIdx] ?? identities[0];

  // 口座ID → 表示名
  const nameOf = useCallback(
    (hex: string) => {
      const i = identities.find((x) => x.accountIdHex === hex);
      if (i) return i.label;
      if (state && hex === state.issuerHex) return '発行体（銀行）';
      return short(hex);
    },
    [identities, state],
  );

  // 状態購読
  useEffect(() => {
    if (!api) return;
    const sub: Subscription = api.state$.subscribe({
      next: setState,
      error: (e) => log(`状態購読エラー: ${String(e)}`, 'error'),
    });
    return () => sub.unsubscribe();
  }, [api, log]);

  const exec = async (label: string, fn: () => Promise<TxResult | void>, isTx = true) => {
    if (busy) return;
    setBusy(label);
    log(isTx ? `${label}: 回路をローカル実行し、ZK 証明を生成しています…（数十秒〜数分）` : `${label}…`);
    const t0 = Date.now();
    try {
      const r = await fn();
      const sec = ((Date.now() - t0) / 1000).toFixed(1);
      log(r ? `${label} 完了 (${sec}s) tx=${short(r.txHash, 10)} block=${String(r.blockHeight)}` : `${label} 完了 (${sec}s)`, 'ok');
    } catch (e) {
      log(`${label} 失敗: ${e instanceof Error ? e.message : String(e)}`, 'error');
      console.error(e);
    } finally {
      setBusy(undefined);
    }
  };

  const onConnect = () =>
    exec('ウォレット接続', async () => {
      const s = await connectWallet(log);
      setSession(s);
      log(`接続: ${s.info.name} / network=${s.info.networkId} / 証明: ${s.info.proofMode}`, 'ok');
    }, false);

  const onDeploy = (name: string, symbol: string) =>
    exec('コントラクトデプロイ', async () => {
      const bank = identities.find((i) => i.role === 'bank') ?? actor;
      const a = await TDepositAPI.deploy(session!.providers, secretKeyOf(bank), name, symbol);
      localStorage.setItem(ADDRESS_KEY, a.address);
      setApi(a);
      log(`デプロイ完了: ${a.address}（発行体: ${bank.label}）`, 'ok');
    });

  const onJoin = (address: string) =>
    exec('コントラクト接続', async () => {
      const a = await TDepositAPI.join(session!.providers, address.trim(), secretKeyOf(actor));
      localStorage.setItem(ADDRESS_KEY, a.address);
      setApi(a);
      log(`コントラクトに接続: ${a.address}`, 'ok');
    });

  const updateIdentities = (list: Identity[]) => {
    setIdentities(list);
    saveIdentities(list);
  };

  const isIssuer = !!state && !!actor && state.issuerHex === actor.accountIdHex;
  const myAccount = state?.accounts.find((a) => a.accountIdHex === actor?.accountIdHex);

  return (
    <div className="app">
      <header>
        <div>
          <h1>トークン化預金デモ</h1>
          <div className="sub">Midnight Network ({NETWORK_ID}) × Lace Wallet</div>
        </div>
        <WalletBadge
          session={session}
          onConnect={onConnect}
          busy={!!busy}
          onRefresh={async () => {
            if (!session) return;
            const st = await readWalletStatus(session.api, log);
            setSession({ ...session, info: { ...session.info, ...st } });
          }}
        />
      </header>

      {busy && (
        <div className="busy">
          <span className="spinner" /> 処理中: {busy}
        </div>
      )}

      {!session ? (
        <section className="card intro">
          <h2>はじめに</h2>
          <ol>
            <li>Docker（Rancher Desktop）を起動し「Running」になってから Proof Server を起動（<code>docker compose -f proof-server.yml up -d</code>）</li>
            <li>Lace（Midnight 対応版）のネットワークを <b>Preview</b>、証明サーバーを <code>http://localhost:6300</code> に設定</li>
            <li>Faucet で tNIGHT を取得し、DUST を用意（Lace で生成できない場合は <code>tools/dust</code> を使用）</li>
            <li>右上の「Lace に接続」を押し、右上の DUST が 0 より大きいことを確認してからデプロイ</li>
          </ol>
        </section>
      ) : !api ? (
        <ContractSetup onDeploy={onDeploy} onJoin={onJoin} busy={!!busy} identities={identities} />
      ) : (
        <>
          <section className="card">
            <div className="row between">
              <div>
                <div className="muted">コントラクトアドレス</div>
                <code className="addr">{api.address}</code>
                <button className="link" onClick={() => navigator.clipboard.writeText(api.address)}>
                  コピー
                </button>
              </div>
              <button
                className="secondary"
                onClick={() => {
                  setApi(undefined);
                  setState(undefined);
                }}
              >
                切断
              </button>
            </div>
          </section>

          <Dashboard state={state} />

          <ActorPanel
            identities={identities}
            actorIdx={actorIdx}
            setActorIdx={setActorIdx}
            update={updateIdentities}
            state={state}
          />

          <section className="card">
            <div className="tabs">
              <button className={tab === 'bank' ? 'active' : ''} onClick={() => setTab('bank')}>
                🏦 銀行（発行体）オペレーション
              </button>
              <button className={tab === 'customer' ? 'active' : ''} onClick={() => setTab('customer')}>
                👤 利用者オペレーション
              </button>
            </div>
            <div className="actor-line">
              操作者: <b>{actor?.label}</b>{' '}
              {isIssuer ? <span className="tag ok">発行体権限あり</span> : <span className="tag">発行体権限なし</span>}
              {myAccount ? (
                <span className="tag">
                  残高 {fmt(myAccount.balance)} {state?.tokenSymbol}
                  {myAccount.frozen ? '（凍結中）' : ''}
                </span>
              ) : (
                <span className="tag warn">未登録口座</span>
              )}
            </div>
            {tab === 'bank' ? (
              <BankOps
                api={api}
                sk={secretKeyOf(actor)}
                exec={exec}
                busy={!!busy}
                state={state}
                identities={identities}
                nameOf={nameOf}
                isIssuer={isIssuer}
              />
            ) : (
              <CustomerOps
                api={api}
                sk={secretKeyOf(actor)}
                exec={exec}
                busy={!!busy}
                state={state}
                identities={identities}
                nameOf={nameOf}
                self={actor.accountIdHex}
              />
            )}
          </section>

          <AccountsTable state={state} nameOf={nameOf} />
          <HistoryTable state={state} nameOf={nameOf} />
        </>
      )}

      <section className="card">
        <h2>実行ログ</h2>
        <div className="logs">
          {logs.length === 0 && <div className="muted">まだログはありません</div>}
          {logs.map((l, i) => (
            <div key={i} className={`log ${l.level}`}>
              <span className="at">{l.at}</span> {l.msg}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function WalletBadge({
  session,
  onConnect,
  busy,
  onRefresh,
}: {
  session?: Session;
  onConnect: () => void;
  busy: boolean;
  onRefresh: () => void;
}) {
  if (!session)
    return (
      <button onClick={onConnect} disabled={busy}>
        Lace に接続
      </button>
    );
  const i = session.info;
  const noDust = i.dustBalance !== undefined && i.dustBalance === 0n;
  return (
    <div className="wallet">
      <div>
        <span className="dot" /> {i.name} <span className="tag">{i.networkId}</span>
      </div>
      <div className="muted" title={i.unshieldedAddress}>
        {short(i.unshieldedAddress, 12)}
      </div>
      <div className={noDust ? 'dust-warn' : 'muted'}>
        DUST: {fmt(i.dustBalance)}
        {i.dustCap !== undefined && ` / 上限 ${fmt(i.dustCap)}`}
        <button className="link" onClick={onRefresh}>
          再取得
        </button>
      </div>
      {i.dustAddress && (
        <div className="muted" title={i.dustAddress}>
          DUST アドレス: {short(i.dustAddress, 10)}
          <button className="link" onClick={() => navigator.clipboard.writeText(i.dustAddress!)}>
            コピー
          </button>
        </div>
      )}
      {noDust && <div className="dust-warn">DUST が 0 のため手数料を支払えません</div>}
      <div className="muted">証明: {i.proofMode}</div>
    </div>
  );
}

function ContractSetup({
  onDeploy,
  onJoin,
  busy,
  identities,
}: {
  onDeploy: (n: string, s: string) => void;
  onJoin: (a: string) => void;
  busy: boolean;
  identities: Identity[];
}) {
  const [name, setName] = useState('デモ銀行 預金トークン');
  const [symbol, setSymbol] = useState('DJPY');
  const [addr, setAddr] = useState(localStorage.getItem(ADDRESS_KEY) ?? '');
  const bank = identities.find((i) => i.role === 'bank');
  return (
    <div className="grid2">
      <section className="card">
        <h2>新規デプロイ（銀行）</h2>
        <p className="muted">
          「{bank?.label}」の口座鍵が発行体として登録されます。
        </p>
        <label>トークン名</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
        <label>シンボル</label>
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <button disabled={busy || !name || !symbol} onClick={() => onDeploy(name, symbol)}>
          デプロイ
        </button>
      </section>
      <section className="card">
        <h2>既存コントラクトに接続</h2>
        <label>コントラクトアドレス</label>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0200…" />
        <button disabled={busy || !addr} onClick={() => onJoin(addr)}>
          接続
        </button>
      </section>
    </div>
  );
}

function Dashboard({ state }: { state?: TDepositState }) {
  if (!state)
    return (
      <section className="card">
        <span className="spinner" /> レジャー状態を取得中…
      </section>
    );
  const tiles = [
    ['発行残高', `${fmt(state.totalSupply)}`],
    ['累計発行', `${fmt(state.totalIssued)}`],
    ['累計償還', `${fmt(state.totalRedeemed)}`],
    ['登録口座数', `${state.accounts.length}`],
  ];
  return (
    <section className="card">
      <div className="row between">
        <h2>
          {state.tokenName} <span className="muted">({state.tokenSymbol})</span>
        </h2>
        {state.paused ? <span className="tag error">全体停止中</span> : <span className="tag ok">稼働中</span>}
      </div>
      <div className="tiles">
        {tiles.map(([k, v]) => (
          <div className="tile" key={k}>
            <div className="muted">{k}</div>
            <div className="big">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActorPanel({
  identities,
  actorIdx,
  setActorIdx,
  update,
  state,
}: {
  identities: Identity[];
  actorIdx: number;
  setActorIdx: (i: number) => void;
  update: (l: Identity[]) => void;
  state?: TDepositState;
}) {
  const [newLabel, setNewLabel] = useState('');
  return (
    <section className="card">
      <h2>操作者（口座鍵）の選択</h2>
      <p className="muted small">
        口座鍵（秘密鍵）はこのブラウザ内にのみ保存され、チェーン上には口座ID（ハッシュ）だけが記録されます。手数料はすべて接続中の Lace
        ウォレットが支払います。
      </p>
      <div className="actors">
        {identities.map((i, idx) => {
          const acct = state?.accounts.find((a) => a.accountIdHex === i.accountIdHex);
          const issuer = state?.issuerHex === i.accountIdHex;
          return (
            <div key={i.accountIdHex} className={`actor ${idx === actorIdx ? 'selected' : ''}`} onClick={() => setActorIdx(idx)}>
              <div className="row between">
                <b>{i.label}</b>
                {issuer ? <span className="tag ok">発行体</span> : acct ? <span className="tag">登録済</span> : <span className="tag warn">未登録</span>}
              </div>
              <code className="small" title={i.accountIdHex}>
                {short(i.accountIdHex, 10)}
              </code>
              <button
                className="link"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(i.accountIdHex);
                }}
              >
                ID コピー
              </button>
              {acct && (
                <div>
                  残高 <b>{fmt(acct.balance)}</b> {acct.frozen && <span className="tag error">凍結</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="row">
        <input placeholder="新しい口座の名前（例: 利用者C）" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
        <button
          className="secondary"
          disabled={!newLabel}
          onClick={() => {
            update([...identities, makeIdentity(newLabel, 'customer')]);
            setNewLabel('');
          }}
        >
          口座鍵を追加
        </button>
      </div>
    </section>
  );
}

/** 口座選択（ローカル口座 + レジャー上の口座 + 手入力） */
function AccountPicker({
  value,
  onChange,
  identities,
  state,
  nameOf,
  label,
  onlyRegistered = true,
  exclude,
}: {
  value: string;
  onChange: (h: string) => void;
  identities: Identity[];
  state?: TDepositState;
  nameOf: (h: string) => string;
  label: string;
  onlyRegistered?: boolean;
  exclude?: string;
}) {
  const options = useMemo(() => {
    const set = new Map<string, string>();
    if (!onlyRegistered) identities.forEach((i) => set.set(i.accountIdHex, i.label));
    state?.accounts.forEach((a) => set.set(a.accountIdHex, nameOf(a.accountIdHex)));
    if (exclude) set.delete(exclude);
    return [...set.entries()];
  }, [identities, state, nameOf, onlyRegistered, exclude]);
  const isCustom = value !== '' && !options.some(([h]) => h === value);
  return (
    <div className="field">
      <label>{label}</label>
      <select value={isCustom ? '__custom' : value} onChange={(e) => onChange(e.target.value === '__custom' ? ' ' : e.target.value)}>
        <option value="">— 選択 —</option>
        {options.map(([h, n]) => (
          <option key={h} value={h}>
            {n} ({short(h, 6)})
          </option>
        ))}
        <option value="__custom">口座IDを直接入力…</option>
      </select>
      {isCustom && <input placeholder="口座ID (64桁の16進)" value={value.trim()} onChange={(e) => onChange(e.target.value || ' ')} />}
    </div>
  );
}

type OpsProps = {
  api: TDepositAPI;
  sk: Uint8Array;
  exec: (label: string, fn: () => Promise<TxResult | void>) => void;
  busy: boolean;
  state?: TDepositState;
  identities: Identity[];
  nameOf: (h: string) => string;
};

const toId = (h: string) => {
  if (!isHex32(h)) throw new Error('口座IDが不正です（64桁の16進数）');
  return fromHex(normalizeHex(h));
};
const toAmount = (s: string) => {
  if (!/^\d+$/.test(s) || BigInt(s) <= 0n) throw new Error('金額は正の整数で入力してください');
  return BigInt(s);
};

function BankOps({ api, sk, exec, busy, state, identities, nameOf, isIssuer }: OpsProps & { isIssuer: boolean }) {
  const [reg, setReg] = useState('');
  const [issueTo, setIssueTo] = useState('');
  const [issueAmt, setIssueAmt] = useState('10000');
  const [ftFrom, setFtFrom] = useState('');
  const [ftTo, setFtTo] = useState('');
  const [ftAmt, setFtAmt] = useState('');
  const [frFrom, setFrFrom] = useState('');
  const [frAmt, setFrAmt] = useState('');
  const [frz, setFrz] = useState('');
  const p = { identities, state, nameOf };
  const frozen = state?.accounts.find((a) => a.accountIdHex === normalizeHex(frz))?.frozen;

  return (
    <div>
      {!isIssuer && (
        <div className="notice">
          現在の操作者は発行体ではありません。実行すると回路内の権限チェック（<code>assertIssuer</code>）で拒否されることを確認できます。
        </div>
      )}
      <div className="ops">
        <div className="op">
          <h3>口座登録（KYC 完了）</h3>
          <AccountPicker label="登録する口座" value={reg} onChange={setReg} onlyRegistered={false} {...p} />
          <button disabled={busy || !reg.trim()} onClick={() => exec('口座登録', () => api.registerAccount(sk, toId(reg)))}>
            登録
          </button>
        </div>

        <div className="op">
          <h3>発行（入金→トークン発行）</h3>
          <AccountPicker label="発行先" value={issueTo} onChange={setIssueTo} {...p} />
          <label>金額</label>
          <input value={issueAmt} onChange={(e) => setIssueAmt(e.target.value)} inputMode="numeric" />
          <button
            disabled={busy || !issueTo.trim()}
            onClick={() => exec('発行', () => api.issue(sk, toId(issueTo), toAmount(issueAmt)))}
          >
            発行
          </button>
        </div>

        <div className="op">
          <h3>強制移転</h3>
          <p className="muted small">裁判所命令・誤送金訂正等を想定。凍結口座・停止中でも実行可能。</p>
          <AccountPicker label="移転元" value={ftFrom} onChange={setFtFrom} {...p} />
          <AccountPicker label="移転先" value={ftTo} onChange={setFtTo} exclude={ftFrom} {...p} />
          <label>金額</label>
          <input value={ftAmt} onChange={(e) => setFtAmt(e.target.value)} inputMode="numeric" />
          <button
            className="danger"
            disabled={busy || !ftFrom.trim() || !ftTo.trim()}
            onClick={() => exec('強制移転', () => api.forceTransfer(sk, toId(ftFrom), toId(ftTo), toAmount(ftAmt)))}
          >
            強制移転
          </button>
        </div>

        <div className="op">
          <h3>強制償還</h3>
          <p className="muted small">口座解約・差押え等に伴うトークン消却。</p>
          <AccountPicker label="対象口座" value={frFrom} onChange={setFrFrom} {...p} />
          <label>金額</label>
          <input value={frAmt} onChange={(e) => setFrAmt(e.target.value)} inputMode="numeric" />
          <button
            className="danger"
            disabled={busy || !frFrom.trim()}
            onClick={() => exec('強制償還', () => api.forceRedeem(sk, toId(frFrom), toAmount(frAmt)))}
          >
            強制償還
          </button>
        </div>

        <div className="op">
          <h3>口座凍結 / 解除</h3>
          <AccountPicker label="対象口座" value={frz} onChange={setFrz} {...p} />
          <div className="row">
            <button
              className="danger"
              disabled={busy || !frz.trim() || frozen === true}
              onClick={() => exec('口座凍結', () => api.freezeAccount(sk, toId(frz)))}
            >
              凍結
            </button>
            <button
              className="secondary"
              disabled={busy || !frz.trim() || frozen === false}
              onClick={() => exec('凍結解除', () => api.unfreezeAccount(sk, toId(frz)))}
            >
              解除
            </button>
          </div>
        </div>

        <div className="op">
          <h3>全体停止（緊急停止）</h3>
          <p className="muted small">停止中は利用者の移転・償還、および新規発行を停止します。</p>
          {state?.paused ? (
            <button className="secondary" disabled={busy} onClick={() => exec('停止解除', () => api.unpause(sk))}>
              停止解除
            </button>
          ) : (
            <button className="danger" disabled={busy} onClick={() => exec('全体停止', () => api.pause(sk))}>
              全体停止
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerOps({ api, sk, exec, busy, state, identities, nameOf, self }: OpsProps & { self: string }) {
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const [rAmt, setRAmt] = useState('');
  return (
    <div className="ops">
      <div className="op">
        <h3>移転（送金）</h3>
        <p className="muted small">秘密鍵を保有していることをゼロ知識証明し、自分の口座から送金します。</p>
        <AccountPicker label="送金先" value={to} onChange={setTo} exclude={self} identities={identities} state={state} nameOf={nameOf} />
        <label>金額</label>
        <input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="numeric" />
        <button disabled={busy || !to.trim()} onClick={() => exec('移転', () => api.transfer(sk, toId(to), toAmount(amt)))}>
          送金
        </button>
      </div>
      <div className="op">
        <h3>償還（払戻し）</h3>
        <p className="muted small">トークンを消却し、銀行預金口座への払戻しを請求します（法定通貨の払戻しはオフチェーン）。</p>
        <label>金額</label>
        <input value={rAmt} onChange={(e) => setRAmt(e.target.value)} inputMode="numeric" />
        <button disabled={busy} onClick={() => exec('償還', () => api.redeem(sk, toAmount(rAmt)))}>
          償還
        </button>
      </div>
    </div>
  );
}

function AccountsTable({ state, nameOf }: { state?: TDepositState; nameOf: (h: string) => string }) {
  if (!state) return null;
  return (
    <section className="card">
      <h2>口座一覧（公開レジャー）</h2>
      <table>
        <thead>
          <tr>
            <th>名称（ローカル）</th>
            <th>口座ID</th>
            <th className="num">残高</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {state.accounts.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                登録口座はありません
              </td>
            </tr>
          )}
          {state.accounts.map((a) => (
            <tr key={a.accountIdHex}>
              <td>{nameOf(a.accountIdHex)}</td>
              <td>
                <code title={a.accountIdHex}>{short(a.accountIdHex, 10)}</code>
              </td>
              <td className="num">{fmt(a.balance)}</td>
              <td>{a.frozen ? <span className="tag error">凍結</span> : <span className="tag ok">正常</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function HistoryTable({ state, nameOf }: { state?: TDepositState; nameOf: (h: string) => string }) {
  if (!state) return null;
  return (
    <section className="card">
      <h2>操作履歴（オンチェーン）</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>種別</th>
            <th>From</th>
            <th>To</th>
            <th className="num">金額</th>
          </tr>
        </thead>
        <tbody>
          {state.history.map((h) => (
            <tr key={String(h.seq)}>
              <td>{String(h.seq)}</td>
              <td>
                <span className={`tag k${h.kind}`}>{OP_LABEL[h.kind]}</span>
              </td>
              <td>{nameOf(h.senderHex)}</td>
              <td>{nameOf(h.receiverHex)}</td>
              <td className="num">{h.amount === 0n ? '' : fmt(h.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
