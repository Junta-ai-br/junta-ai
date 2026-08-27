import {
  createContext,
  useContext,
  useMemo,
} from "react";

import {
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";

import "./SobreMotion.css";

const OrbitContext = createContext(null);

/* ==========================================================================
   Orbit Group
   ========================================================================== */

export function OrbitGroup({
  children,
  duration = 30,
  delay = 0,
  direction = "clockwise",
}) {
  const rotation = useMotionValue(0);

  const rotationValue =
    direction === "clockwise"
      ? 360
      : -360;

  const contextValue = useMemo(
    () => ({
      rotation,
    }),
    [rotation]
  );

  return (
    <OrbitContext.Provider value={contextValue}>
      <motion.div
        className="sobre-motion__orbit-group"
        style={{
          rotate: rotation,
        }}
        animate={{
          rotate: rotationValue,
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.div>
    </OrbitContext.Provider>
  );
}

/* ==========================================================================
   Orbit Avatar
   ========================================================================== */

export function OrbitAvatar({
  children,
  angle = 0,
  radius = 200,
}) {
  const { rotation } = useContext(OrbitContext);

  /*
   * O avatar precisa compensar:
   *
   * 1. a rotação dinâmica da órbita;
   * 2. o ângulo inicial usado para posicioná-lo na circunferência.
   *
   * Dessa forma, ele continua se movimentando pela órbita,
   * mas permanece sempre visualmente "em pé".
   */

  const counterRotation = useTransform(
    rotation,
    (value) => -(value + angle)
  );

  return (
    <div
      className="sobre-motion__orbit-avatar"
      style={{
        "--orbit-angle": `${angle}deg`,
        "--orbit-radius": `${radius}px`,
      }}
    >
      <div className="sobre-motion__orbit-avatar-content">
        <motion.div
          className="sobre-motion__orbit-avatar-rotation"
          style={{
            rotate: counterRotation,
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Banner Border Motion
   ========================================================================== */

export function BannerBorderMotion({ children }) {
  return (
    <div className="sobre-motion__banner">
      <motion.div
        className="sobre-motion__banner-border"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        aria-hidden="true"
      />

      <div className="sobre-motion__banner-content">
        {children}
      </div>
    </div>
  );
}