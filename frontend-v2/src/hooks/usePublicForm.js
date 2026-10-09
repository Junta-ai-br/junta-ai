import { useRef, useState } from "react";
import { publicFormError, sendPublicForm, validatePublicForm } from "@/services/public-forms";

const emptyForm = { name: "", email: "", subject: "", subjectOther: "", message: "" };

export default function usePublicForm(kind) {
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const inFlight = useRef(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const { payload, fields } = validatePublicForm(formData, kind);
    setFieldErrors(fields);
    setError("");
    if (Object.keys(fields).length) {
      setError("Revise os campos indicados antes de enviar.");
      event.currentTarget.elements.namedItem(Object.keys(fields)[0])?.focus();
      return;
    }
    inFlight.current = true;
    setIsSending(true);
    try {
      await sendPublicForm(kind, payload);
      setIsSubmitted(true);
    } catch (failure) {
      setError(publicFormError(failure));
    } finally {
      inFlight.current = false;
      setIsSending(false);
    }
  }

  function handleNewMessage() {
    setFormData({ ...emptyForm });
    setIsSubmitted(false);
    setError("");
    setFieldErrors({});
    setIsSending(false);
    inFlight.current = false;
  }

  function fieldProps(name) {
    return {
      disabled: isSending,
      "aria-invalid": Boolean(fieldErrors[name]),
      "aria-describedby": fieldErrors[name] ? `${kind}-${name}-error` : undefined,
    };
  }

  return { formData, isSubmitted, isSending, error, fieldErrors, fieldProps, handleChange, handleSubmit, handleNewMessage };
}
