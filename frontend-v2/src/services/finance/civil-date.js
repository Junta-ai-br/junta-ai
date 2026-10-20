// Dia civil local do usuário, representado como meia-noite UTC.
// Evita que, no Brasil, o "mês atual" vire o mês seguinte a partir das 21h
// do último dia do mês (quando o relógio UTC já passou da meia-noite).
export function localCivilToday(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}