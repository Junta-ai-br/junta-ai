import "./Bubble.css";
import clsx from "clsx";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import clsx from "clsx";

import "./Bubble.css";

export default function Bubble({
  children,
  size = "md",
  variant = "primary",
  align = "left",
  className,
}) {
  return (
    <article
      className={clsx(
        "bubble",
        `bubble--${size}`,
        `bubble--${variant}`,
        `bubble--align-${align}`,
        className
      )}
    >
      <p className="bubble__text">{children}</p>
    </article>
  delay = 0,
  floatDelay = 0,
}) {
  const shouldReduceMotion = useReducedMotion();

  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.2,
  });

  const [hasEntered, setHasEntered] = useState(false);

  const bubbleClasses = clsx(
    "bubble",
    `bubble--${size}`,
    `bubble--${variant}`,
    `bubble--align-${align}`,
    className
  );

  useEffect(() => {
    if (!isInView || hasEntered || shouldReduceMotion) {
      return;
    }

    const timer = setTimeout(() => {
      setHasEntered(true);
    }, (delay + 0.8) * 1000);

    return () => clearTimeout(timer);
  }, [isInView, hasEntered, shouldReduceMotion, delay]);

  if (shouldReduceMotion) {
    return (
      <article className={bubbleClasses}>
        <p className="bubble__text">{children}</p>
      </article>
    );
  }

  let animation = {
    opacity: 0,
    y: 24,
    scale: 0.97,
  };

  let transition = {};

  if (isInView && !hasEntered) {
    animation = {
      opacity: 1,
      y: 0,
      scale: 1,
    };

    transition = {
      duration: 0.8,
      delay,
      ease: "easeOut",
    };
  }

  if (hasEntered) {
    animation = {
      opacity: 1,
      scale: 1,
      y: [0, -8, 0],
    };

    transition = {
      y: {
        duration: 4.5,
        delay: floatDelay,
        repeat: Infinity,
        ease: "easeInOut",
      },
      opacity: {
        duration: 0,
      },
      scale: {
        duration: 0,
      },
    };
  }

  return (
    <motion.article
      ref={ref}
      className={bubbleClasses}
      initial={{
        opacity: 0,
        y: 24,
        scale: 0.97,
      }}
      animate={animation}
      transition={transition}
    >
      <p className="bubble__text">{children}</p>
    </motion.article>
  );
}