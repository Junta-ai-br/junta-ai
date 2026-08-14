import { useId } from "react";
import "./Input.css";

export default function Input({
  label,
  helperText,
  error,
  id,
  className = "",
  disabled = false,
  required = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const inputClasses = ["input", className]
    .filter(Boolean)
    .join(" ");

  const wrapperClasses = [
    "input-wrapper",
    error && "input-wrapper--error",
    disabled && "input-wrapper--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && (
            <span className="input-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div className={wrapperClasses}>
        <input
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            helperText || error ? `${inputId}-message` : undefined
          }
          {...props}
        />
      </div>

      {(helperText || error) && (
        <p
          id={`${inputId}-message`}
          className={`input-message ${
            error ? "input-message--error" : "input-message--helper"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}