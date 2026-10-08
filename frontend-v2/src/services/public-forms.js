import { api, API_URL } from "./api";

export const FORM_LIMITS = { name: 120, email: 254, subject: 32, subjectOther: 160, message: 10000 };
const subjects = {
  contact: ["faq", "junta", "sugestao", "parceria", "imprensa", "outro"],
  feedback: ["experiencia", "sugestao", "problema", "duvida", "privacidade", "financeiro", "assistente", "outro"],
};
// Character.isWhitespace / String.strip in Java (NBSP is intentionally excluded).
// eslint-disable-next-line no-control-regex -- Java strip includes these control whitespace characters.
const edgeWhitespace = /^[\u0009-\u000d\u001c-\u0020\u1680\u2000-\u2006\u2008-\u200a\u2028\u2029\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u1680\u2000-\u2006\u2008-\u200a\u2028\u2029\u205f\u3000]+$/g;
const invalidHeader = /[\p{Cc}\u2028\u2029]/u;
const emailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export function validatePublicForm(form, kind) {
  const payload = Object.fromEntries(Object.keys(FORM_LIMITS).map((key) => [key, (form[key] ?? "").replace(edgeWhitespace, "")]));
  if (payload.subject !== "outro") payload.subjectOther = "";
  const fields = {};
  for (const [key, limit] of Object.entries(FORM_LIMITS)) {
    if (key === "subjectOther" && payload.subject !== "outro") continue;
    if (!payload[key]) fields[key] = "Preencha este campo.";
    else if (payload[key].length > limit) fields[key] = `Use no máximo ${limit} unidades de texto (UTF-16).`;
    else if (key !== "message" && invalidHeader.test(form[key] ?? "")) fields[key] = "Remova caracteres de controle e quebras de linha deste campo.";
  }
  const localPart = payload.email.split("@")[0];
  if (!fields.email && (!emailFormat.test(payload.email) || localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes(".."))) fields.email = "Informe um e-mail válido.";
  if (!fields.subject && !subjects[kind]?.includes(payload.subject)) fields.subject = "Selecione um assunto válido.";
  return { payload, fields };
}

export async function sendPublicForm(kind, payload) {
  if (!API_URL?.trim()) throw Object.assign(new Error("API not configured"), { code: "API_UNAVAILABLE" });
  if (!subjects[kind]) throw new Error("Unknown public form");
  // Send only the public contract fields; no session, recipient or SMTP data.
  const body = Object.fromEntries(Object.keys(FORM_LIMITS).map((key) => [key, payload[key] ?? ""]));
  if (body.subject !== "outro") body.subjectOther = "";
  const response = await api.post(`/${kind}`, body, { withCredentials: false, headers: { Authorization: null } });
  if (response.status !== 200 || response.data?.status !== "sent") {
    throw Object.assign(new Error("Unexpected public form response"), { code: "UNCONFIRMED" });
  }
}

export function publicFormError(error) {
  if (error.code === "API_UNAVAILABLE" || error.response?.status === 503) return "O envio está temporariamente indisponível. Tente novamente mais tarde.";
  if (error.response?.status === 400) return "Não foi possível validar os dados. Revise os campos antes de tentar novamente.";
  if (error.response?.status === 429) return "Muitas tentativas de envio. Aguarde alguns minutos antes de tentar novamente.";
  if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code)) return "O tempo de espera terminou e não conseguimos confirmar o envio. A mensagem pode ter sido enviada. Aguarde antes de tentar novamente para evitar duplicidade.";
  if (!error.response || error.code === "UNCONFIRMED") return "Não conseguimos confirmar o envio. A mensagem pode ter sido enviada. Verifique sua conexão e aguarde antes de tentar novamente para evitar duplicidade.";
  return "Não conseguimos confirmar o envio agora. Tente novamente mais tarde.";
}
