import "./Bubble.css";
import clsx from "clsx";

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
  );
}