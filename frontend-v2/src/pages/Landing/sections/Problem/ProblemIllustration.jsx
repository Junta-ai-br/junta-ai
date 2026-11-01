import { useEffect, useRef, useSyncExternalStore } from "react";
import { motion, useAnimationControls, useInView, useScroll, useTransform } from "motion/react";
import person from "./assets/personagem.png";
import sheet from "./assets/planilha.png";
import bars from "./assets/grafico_barras.webp";
import pie from "./assets/grafico_pizza.png";
import calculator from "./assets/calculadora.png";
import receipt from "./assets/recibo.webp";
import accounts from "./assets/postit_contas.png";
import goals from "./assets/postit_metas.webp";
import questions from "./assets/interrogacoes.webp";

const objects = [
  { id: "sheet", src: sheet, width: 384, height: 273, duration: 8.2, drift: 10, tilt: 1.8, depth: true },
  { id: "bars", src: bars, width: 397, height: 255, duration: 9.7, drift: -9, tilt: -1.6, depth: true },
  { id: "pie", src: pie, width: 320, height: 251, duration: 10.4, drift: 7, tilt: 1.3, depth: true },
  { id: "accounts", src: accounts, width: 188, height: 169, duration: 7.4, drift: -7, tilt: 2.2 },
  { id: "goals", src: goals, width: 175, height: 163, duration: 8.9, drift: 8, tilt: -2 },
  { id: "calculator", src: calculator, width: 284, height: 282, duration: 10.8, drift: -6, tilt: 1.4 },
  { id: "receipt", src: receipt, width: 233, height: 221, duration: 7.8, drift: 9, tilt: -1.4 },
  { id: "questions", src: questions, width: 367, height: 223, duration: 6.8, drift: -6, tilt: 0, expressive: true },
];
const subscribeVisibility = (notify) => {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
};
const visibleSnapshot = () => document.visibilityState !== "hidden";
const serverVisibility = () => true;
const supportsMediaQueries = () => typeof window !== "undefined" && typeof window.matchMedia === "function";
const subscribeLayout = (notify) => {
  if (!supportsMediaQueries()) return () => {};
  const queries = [window.matchMedia("(max-width: 767px)"), window.matchMedia("(max-width: 992px)")];
  queries.forEach((query) => query.addEventListener("change", notify));
  return () => queries.forEach((query) => query.removeEventListener("change", notify));
};
const layoutSnapshot = () => !supportsMediaQueries() ? "desktop" : window.matchMedia("(max-width: 767px)").matches ? "mobile"
  : window.matchMedia("(max-width: 992px)").matches ? "tablet" : "desktop";
const desktopSnapshot = () => "desktop";
const subscribeReduced = (notify) => {
  if (!supportsMediaQueries()) return () => {};
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const reducedSnapshot = () => !supportsMediaQueries() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const staticMotion = () => true;
const hiddenOnTablet = new Set(["pie", "accounts"]);
const hiddenOnMobile = new Set(["pie", "accounts", "goals", "calculator", "receipt"]);

function IllustrationObject({ object, active, reduced, parallax, intensity }) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (reduced) {
      controls.set({ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 });
      return;
    }
    if (!active) { controls.stop(); return; }
    controls.start({
      y: [0, object.drift * intensity, 0],
      rotate: [0, object.tilt * intensity, 0],
      opacity: object.expressive ? [1, 0.86, 1] : 1,
      scale: object.expressive ? [1, 1 + 0.035 * intensity, 1] : 1,
      transition: { duration: object.duration, repeat: Infinity, ease: "easeInOut" },
    });
    return () => controls.stop();
  }, [active, reduced, object, controls, intensity]);
  return <div className={`problem__object problem__object--${object.id}`}>
    <motion.div style={object.depth ? { y: reduced ? 0 : parallax } : undefined}>
      <motion.div className="problem__object-motion" initial={false} animate={controls}>
        <img src={object.src} width={object.width} height={object.height} alt="" loading="lazy" decoding="async" draggable="false" />
      </motion.div>
    </motion.div>
  </div>;
}

export default function ProblemIllustration() {
  const scene = useRef(null);
  const inView = useInView(scene, { amount: 0.1 });
  const reduced = useSyncExternalStore(subscribeReduced, reducedSnapshot, staticMotion);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, serverVisibility);
  const layout = useSyncExternalStore(subscribeLayout, layoutSnapshot, desktopSnapshot);
  const hiddenObjects = layout === "mobile" ? hiddenOnMobile : layout === "tablet" ? hiddenOnTablet : null;
  const visibleObjects = objects.filter((object) => !hiddenObjects?.has(object.id));
  const intensity = layout === "mobile" ? 0.6 : layout === "tablet" ? 0.8 : 1;
  const { scrollYProgress } = useScroll({ target: scene, offset: ["start end", "end start"] });
  const parallax = useTransform(scrollYProgress, (progress) => (progress - 0.5) * 10);
  return <figure ref={scene} className="problem__illustration" aria-hidden="true" data-motion={reduced ? "reduced" : inView && visible ? "active" : "paused"}>
    {visibleObjects.map((object) => <IllustrationObject key={object.id} object={object}
      active={inView && visible}
      reduced={reduced} parallax={parallax} intensity={intensity} />)}
    <img className="problem__person" src={person} width="612" height="748" alt="" loading="lazy" decoding="async" draggable="false" />
  </figure>;
}
