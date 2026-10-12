import { useEffect, useRef } from 'react';
import { CubeScene, type SceneOptions } from '../cube/CubeScene';

/** liga o desenho 3D a um <canvas>; quem usa recebe a cena pronta em onReady */
export function Cube3D({ onReady, options, className }: {
  onReady: (scene: CubeScene) => void; options?: SceneOptions; className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const optsRef = useRef(options);
  optsRef.current = options;
  useEffect(() => {
    const scene = new CubeScene(ref.current!, {
      onMove: m => optsRef.current?.onMove?.(m),
      canTurn: () => optsRef.current?.canTurn?.() ?? false,
    });
    onReady(scene);
    return () => scene.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className={className ?? 'cube-canvas'} aria-label="Cubo mágico em 3D. Arraste uma face para girar." />;
}
