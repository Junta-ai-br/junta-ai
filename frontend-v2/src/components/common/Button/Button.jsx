import "./Button.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Carregando...",
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const isDisabled = disabled || loading;

  const classes = [
    "button",
    `button--${variant}`,
    `button--${size}`,
    loading && "button--loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
}