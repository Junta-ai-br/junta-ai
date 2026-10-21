import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowUp, Check, MessageCircle } from "lucide-react";

import logoIcon from "@/assets/logos/logo-icon.svg";
import { DEMO_PHASE_MS, DEMO_SCENES } from "./demo-scenes";
import "./DesktopChatPreview.css";

function DemoConversation({ scene, phase, staticPreview, visible }) {
  const reveal = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 },
    transition: { duration: staticPreview || !visible ? 0 : 0.3 } };

  return (
    <motion.div
      className="desktop-chat-preview__scene"
      initial={false}
      animate={{ opacity: phase === 5 && !staticPreview ? 0 : 1 }}
      transition={{ duration: staticPreview || !visible ? 0 : 0.3 }}
    >
      <p className="desktop-chat-preview__scene-label">{scene.label}</p>
      {(staticPreview || phase >= 1) && (
        <motion.div {...reveal} className="desktop-chat-preview__message desktop-chat-preview__message--user">
          <p>{scene.user}</p>
        </motion.div>
      )}
      {!staticPreview && phase === 2 && (
        <div className="desktop-chat-preview__typing" data-testid="preview-typing">
          <img src={logoIcon} alt="" width="20" height="20" />
          <span>Digitando</span>
          {[0, 1, 2].map((dot) => (
            <motion.span key={dot} className="desktop-chat-preview__dot"
              animate={{ opacity: visible ? [0.3, 1, 0.3] : 0.5 }}
              transition={{ duration: 1, delay: dot * 0.15, repeat: visible ? Infinity : 0 }}
            />
          ))}
        </div>
      )}
      {(staticPreview || phase >= 3) && (
        <motion.div {...reveal} className="desktop-chat-preview__message desktop-chat-preview__message--assistant">
          <span className="desktop-chat-preview__assistant-label"><img src={logoIcon} alt="" width="20" height="20" /> Junta.ai</span>
          <p>{scene.assistant}</p>
        </motion.div>
      )}
      {(staticPreview || phase >= 4) && (
        <motion.div {...reveal} className="desktop-chat-preview__card">
          <Check size={16} aria-hidden="true" />
          <p>{scene.card}</p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function DesktopChatPreview() {
  const previewRef = useRef(null);
  const visible = useInView(previewRef, { amount: 0.2 });
  const reduceMotion = useReducedMotion();
  const [cursor, setCursor] = useState(0);
  const remaining = useRef(null);
  const phase = cursor % DEMO_PHASE_MS.length;
  const sceneIndex = Math.floor(cursor / DEMO_PHASE_MS.length);

  useEffect(() => {
    if (!visible || reduceMotion) return undefined;
    const delay = remaining.current?.cursor === cursor
      ? remaining.current.ms : DEMO_PHASE_MS[phase];
    const deadline = Date.now() + delay;
    const timer = window.setTimeout(() => {
      setCursor((current) => (current + 1) % (DEMO_SCENES.length * DEMO_PHASE_MS.length));
    }, delay);
    return () => {
      window.clearTimeout(timer);
      remaining.current = { cursor, ms: Math.max(0, deadline - Date.now()) };
    };
  }, [cursor, phase, visible, reduceMotion]);

  return (
    <figure ref={previewRef} className="desktop-chat-preview" aria-label="Demonstração do assistente Junta.ai">
      <figcaption className="desktop-chat-preview__caption">Demonstração ilustrativa · Dados fictícios</figcaption>

      {/* A stable transcript avoids announcing every animation frame or loop. */}
      <div className="desktop-chat-preview__transcript">
        {DEMO_SCENES.map((scene) => (
          <section key={scene.id} aria-label={scene.label}>
            <h2>{scene.label}</h2>
            <p>Você: {scene.user}</p><p>Junta.ai: {scene.assistant}</p><p>{scene.card}</p>
          </section>
        ))}
      </div>

      <motion.div className="desktop-chat-preview__window" aria-hidden="true"
        initial={false} animate={{ opacity: visible || reduceMotion ? 1 : 0.8, y: visible || reduceMotion ? 0 : 8 }}
        transition={{ duration: reduceMotion ? 0 : 0.4 }}
      >
        <div className="desktop-chat-preview__browser">
          <span className="desktop-chat-preview__traffic"><i /><i /><i /></span>
          <span className="desktop-chat-preview__address">Junta.ai / Assistente</span>
          <MessageCircle size={15} />
        </div>
        <div className="desktop-chat-preview__toolbar">
          <img src={logoIcon} alt="" width="28" height="28" />
          <div><strong>Seu espaço de conversa</strong><span>Entender é um bom começo.</span></div>
          <span className="desktop-chat-preview__demo-tag">PRÉVIA</span>
        </div>
        <div className={`desktop-chat-preview__conversation${reduceMotion ? " desktop-chat-preview__conversation--static" : ""}`}>
          {reduceMotion
            ? DEMO_SCENES.map((scene) => <DemoConversation key={scene.id} scene={scene} phase={4} staticPreview visible={visible} />)
            : <DemoConversation key={DEMO_SCENES[sceneIndex].id} scene={DEMO_SCENES[sceneIndex]} phase={phase} visible={visible} />}
        </div>
        <div className="desktop-chat-preview__composer">
          <span>Converse com o Junta.ai…</span><span className="desktop-chat-preview__send"><ArrowUp size={18} /></span>
        </div>
      </motion.div>
    </figure>
  );
}
