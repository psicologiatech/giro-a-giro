import { useState } from 'react';
import { Mascot } from './Mascot';
import type { useConta } from '../nuvem/conta';

type Conta = ReturnType<typeof useConta>;
const POLITICA = `${import.meta.env.BASE_URL}privacidade.html`;

/** cartão do início: convite para guardar o progresso, ou aviso de que está salvo */
export function CartaoConta({ conta, onAbrir }: { conta: Conta; onAbrir: () => void }) {
  if (conta.estado === 'sem-nuvem') return null;
  if (conta.estado === 'dentro' && conta.usuario) return (
    <button className="conta-linha" onClick={onAbrir}>
      <span className="conta-avatar" aria-hidden="true">{(conta.usuario.nome || conta.usuario.email || '?')[0].toUpperCase()}</span>
      <span><b>Progresso salvo na nuvem</b><small>{conta.usuario.nome || conta.usuario.email} · Minha conta</small></span>
    </button>
  );
  return (
    <section className="card conta-card">
      <Mascot mood="cubo" size={64} />
      <div>
        <h3>Guardar meu progresso</h3>
        <p>Entre com o Google para não perder seus passos e tempos se trocar de celular. É opcional.</p>
      </div>
      {conta.erro && <p className="warn-msg">{conta.erro}</p>}
      <button className="btn btn-google" onClick={conta.entrar} disabled={conta.estado === 'carregando'}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {conta.estado === 'carregando' ? 'Entrando…' : 'Entrar com Google'}
      </button>
      <a className="link-btn conta-politica" href={POLITICA} target="_blank" rel="noopener">Como cuidamos dos seus dados</a>
    </section>
  );
}

/** janela "Minha conta": quem está conectado, sair e apagar */
export function JanelaConta({ conta, onFechar }: { conta: Conta; onFechar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const u = conta.usuario;
  if (!u) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Minha conta" onClick={onFechar}>
      <div className="sheet conta-sheet" onClick={e => e.stopPropagation()}>
        <span className="conta-avatar conta-avatar-g" aria-hidden="true">{(u.nome || u.email || '?')[0].toUpperCase()}</span>
        <h2>{u.nome || 'Minha conta'}</h2>
        <p>{u.email}</p>
        <p className="conta-ok">Seus passos, tempos e pontos estão salvos na nuvem. Entre com a mesma conta em outro aparelho para continuar de onde parou.</p>
        {!confirmar ? (
          <>
            <button className="btn btn-big" onClick={async () => { setOcupado(true); await conta.sair(); setOcupado(false); onFechar(); }} disabled={ocupado}>Sair da conta</button>
            <button className="link-btn" onClick={() => setConfirmar(true)}>Apagar minha conta e meus dados da nuvem</button>
          </>
        ) : (
          <div className="conta-apagar">
            <p><b>Tem certeza?</b> Isso apaga sua conta e tudo o que está na nuvem. O progresso continua só neste aparelho.</p>
            <div className="row">
              <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>
              <button className="btn btn-perigo" disabled={ocupado} onClick={async () => { setOcupado(true); try { await conta.apagar(); onFechar(); } catch { setOcupado(false); } }}>Apagar</button>
            </div>
          </div>
        )}
        <a className="link-btn" href={POLITICA} target="_blank" rel="noopener">Política de privacidade</a>
      </div>
    </div>
  );
}
