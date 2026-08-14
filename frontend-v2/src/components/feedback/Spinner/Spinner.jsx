import "./Spinner.css";

export default function Spinner({
  size = "md",
  variant = "primary",
  className = "",
  ...props
}) {
  const classes = [
    "spinner",
    `spinner--${size}`,
    `spinner--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      role="status"
      aria-label="Carregando"
      {...props}
    />
  );
}