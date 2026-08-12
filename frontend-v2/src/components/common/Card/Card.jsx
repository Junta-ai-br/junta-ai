import "./Card.css";

export default function Card({
  as: Component = "div",
  children,
  variant = "default",
  padding = "md",
  interactive = false,
  className = "",
  ...props
}) {
  const classes = [
    "card",
    `card--${variant}`,
    `card--padding-${padding}`,
    interactive && "card--interactive",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}