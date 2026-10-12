import { Speech } from '../components/Mascot';

export function MeuCubo() {
  return (
    <div className="screen meucubo">
      <Speech mood="pensando">Em breve você vai me mostrar o seu cubo pela câmera, e eu ensino a partir dele.</Speech>
      <ol className="howto">
        <li><b>Aponte a câmera</b> para cada face do seu cubo.</li>
        <li><b>Confira as cores.</b> Se alguma vier errada, toque para trocar.</li>
        <li><b>Pronto:</b> o cubo da tela fica igual ao da sua mão, e eu mostro o próximo giro.</li>
      </ol>
    </div>
  );
}
