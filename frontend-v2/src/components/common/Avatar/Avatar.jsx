import "./Avatar.css";

export default function Avatar({
  src,
  alt = "Avatar",
  fallback = "",
  size = "md",
  className = "",
  ...props
}) {
  const classes = [
    "avatar",
    `avatar--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {src ? (
        <img
          className="avatar__image"
          src={src}
          alt={alt}
        />
      ) : (
        <span className="avatar__fallback" aria-hidden="true">
          {fallback}
        </span>
      )}
    </div>
  );
}