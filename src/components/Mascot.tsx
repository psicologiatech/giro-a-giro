/**
 * Pingo, o mascote. Ilustrações geradas com o Gemini a partir da ideia da Karol (public/pingo/).
 * Cada pose tem um papel:
 *  oi       boas-vindas, conversa normal
 *  aponta   dicas e instruções ("olha aqui")
 *  pensando lendo o cubo, pensando junto
 *  hmm      conferindo, algo não bateu
 *  festa    acertou, cubo montado
 *  trofeu   etapa concluída, conquista
 *  cronometro, estudando, camera, cubo, melhor, sequencia, travei, dormindo, presente, nuvem (conta), magico (cubo montado): telas específicas
 */
export type Mood = 'oi' | 'aponta' | 'pensando' | 'hmm' | 'festa' | 'trofeu'
  | 'cronometro' | 'estudando' | 'camera' | 'cubo' | 'melhor' | 'sequencia' | 'travei' | 'dormindo' | 'presente' | 'nuvem' | 'magico';

const ALT: Record<Mood, string> = {
  oi: 'Pingo acenando', aponta: 'Pingo apontando', pensando: 'Pingo pensando com um cubo na mão',
  hmm: 'Pingo desconfiado, conferindo', festa: 'Pingo comemorando com o cubo', trofeu: 'Pingo com um troféu',
  cronometro: 'Pingo segurando um cronômetro', estudando: 'Pingo de óculos lendo o caderno de fórmulas', camera: 'Pingo fotografando o cubo com o celular',
  cubo: 'Pingo ao lado de um cubo mágico', melhor: 'Pingo com medalha no pódio', sequencia: 'Pingo pulando com uma chama',
  travei: 'Pingo preocupado segurando o cubo bagunçado', dormindo: 'Pingo dormindo abraçado ao cubo', presente: 'Pingo segurando um presente',
  nuvem: 'Pingo abraçando uma nuvem com um cadeado', magico: 'Pingo mágico com varinha e cartola',
};

export function Mascot({ mood = 'oi', size = 96 }: { mood?: Mood; size?: number }) {
  return (
    <img className={`mascot mood-${mood}`} src={`${import.meta.env.BASE_URL}pingo/${mood}.webp`} alt={ALT[mood]}
      width={size} height={size} style={{ objectFit: 'contain' }} draggable={false} />
  );
}

export function Speech({ children, mood = 'oi' }: { children: React.ReactNode; mood?: Mood }) {
  return (
    <div className="speech">
      <Mascot mood={mood} size={92} />
      <p className="bubble">{children}</p>
    </div>
  );
}
