import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

import "./Toast.css";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

export default function Toast({ variant = "success", children, onDismiss }) {
  const Icon = ICONS[variant] || CheckCircle2;

  return (
    <div className={`toast toast--${variant}`} role="status" aria-live="polite">
      <Icon size={18} strokeWidth={2} className="toast__icon" />

      <span className="toast__message">{children}</span>

      {onDismiss && (
        <button
          type="button"
          className="toast__dismiss"
          onClick={onDismiss}
          aria-label="Fechar aviso"
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
