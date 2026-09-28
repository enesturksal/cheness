import { useEffect, useState } from 'react';
import {
  fetchAccount,
  looksLikeToken,
  revokeToken,
  startLogin,
  type LichessAccountInfo,
} from '../explorer/lichessAuth';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

const TOKEN_PAGE = 'https://lichess.org/account/oauth/token/create?description=Cheness';
const TOKENS_LIST = 'https://lichess.org/account/oauth/token';

/** Lichess sign-in state: OAuth login, personal token paste, account summary and logout. */
export function LichessAccount() {
  const t = useT();
  const token = useStore((s) => s.lichessToken);
  const user = useStore((s) => s.lichessUser);
  const lichessUsername = useStore((s) => s.lichessUsername);
  const set = useStore((s) => s.setSettings);
  const [draft, setDraft] = useState('');
  const [info, setInfo] = useState<LichessAccountInfo | null>(null);
  const [invalid, setInvalid] = useState(false);

  // Validate the token and pick up the account name + ratings.
  useEffect(() => {
    if (!token) return;
    const ctrl = new AbortController();
    fetchAccount(token, ctrl.signal).then((acc) => {
      if (ctrl.signal.aborted) return;
      if (!acc) {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      setInfo(acc);
      const patch: Partial<{ lichessUser: string; lichessUsername: string }> = {};
      if (acc.username !== user) patch.lichessUser = acc.username;
      if (!lichessUsername) patch.lichessUsername = acc.username;
      if (Object.keys(patch).length) set(patch);
    });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const saveToken = () => {
    const value = draft.trim();
    if (!looksLikeToken(value)) return;
    set({ lichessToken: value, lichessUser: null });
    setDraft('');
  };

  const logout = () => {
    if (token) void revokeToken(token);
    set({ lichessToken: null, lichessUser: null });
    setInfo(null);
  };

  if (token) {
    const perfs = info?.perfs ?? {};
    const show = (['bullet', 'blitz', 'rapid', 'classical'] as const).filter((k) => perfs[k]);
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {t('lichess.loggedInAs')} <strong>{user ?? '…'}</strong>
          </span>
          {invalid && <span className="chip text-danger">{t('lichess.invalid')}</span>}
          <button type="button" className="btn" onClick={logout}>
            {t('lichess.logout')}
          </button>
        </div>
        {show.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {show.map((k) => (
              <span key={k} className="chip">
                {k} {perfs[k]}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted">
          {t('lichess.revokeHint')}{' '}
          <a className="text-accent underline" href={TOKENS_LIST} target="_blank" rel="noreferrer">
            {TOKENS_LIST.replace('https://', '')}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">{t('lichess.required')}</p>
      <div>
        <button type="button" className="btn btn-primary" onClick={() => void startLogin()}>
          {t('lichess.login')}
        </button>
      </div>
      <p className="text-xs text-muted">{t('lichess.howTo')}</p>
      <div className="flex flex-wrap gap-2">
        <a className="btn" href={TOKEN_PAGE} target="_blank" rel="noreferrer">
          {t('lichess.openTokenPage')}
        </a>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="lip_…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg2 px-2 py-1.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveToken();
          }}
        />
        <button type="button" className="btn" disabled={!looksLikeToken(draft)} onClick={saveToken}>
          {t('lichess.tokenSave')}
        </button>
      </div>
      <p className="text-xs text-muted">{t('lichess.securityNote')}</p>
    </div>
  );
}
