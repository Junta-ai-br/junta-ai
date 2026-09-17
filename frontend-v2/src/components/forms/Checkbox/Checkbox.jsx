import { useId } from "react";
import { Check } from "lucide-react";

import "./Checkbox.css";

export default function Checkbox({
  label,
  helperText,
  error,
  id,
  className = "",
  disabled = false,
  checked = false,
  onChange,
  ...props
}) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const wrapperClasses = [
    "checkbox-wrapper",
    error && "checkbox-wrapper--error",
    disabled && "checkbox-wrapper--disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="checkbox-group">
      <label htmlFor={checkboxId} className={wrapperClasses}>
        <span className="checkbox-box" aria-hidden="true">
          <input
            id={checkboxId}
            type="checkbox"
            className="checkbox-input"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            aria-describedby={
              helperText || error ? `${checkboxId}-message` : undefined
            }
            {...props}
          />
          <Check className="checkbox-icon" size={14} strokeWidth={3} />
        </span>

        {label && <span className="checkbox-label">{label}</span>}
      </label>

      {(helperText || error) && (
        <p
          id={`${checkboxId}-message`}
          className={`checkbox-message ${
            error ? "checkbox-message--error" : "checkbox-message--helper"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}
