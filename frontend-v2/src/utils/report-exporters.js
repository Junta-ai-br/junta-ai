function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(data, filename = "relatorio-financeiro.csv") {
  const rows = [
    ["Período", data.period],
    ["Receitas", data.summary.income],
    ["Despesas", data.summary.expenses],
    ["Saldo", data.summary.balance],
    [],
    ["Período", "Receitas", "Despesas"],
    ...data.chart.map((item) => [item.label, item.income, item.expenses]),
  ];
  const csv = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\r\n");
  downloadBlob(`\uFEFF${csv}`, filename, "text/csv;charset=utf-8");
}

export function exportToExcel(data, filename = "relatorio-financeiro.xls") {
  const table = `
    <table border="1">
      <tr><th colspan="3">Relatório financeiro - ${data.period}</th></tr>
      <tr><th>Resumo</th><th>Valor</th><th>Variação</th></tr>
      <tr><td>Receitas</td><td>${data.summary.income}</td><td>${data.summary.incomeChange}</td></tr>
      <tr><td>Despesas</td><td>${data.summary.expenses}</td><td>${data.summary.expensesChange}</td></tr>
      <tr><td>Saldo</td><td>${data.summary.balance}</td><td>${data.summary.balanceChange}</td></tr>
      <tr><th>Período</th><th>Receitas</th><th>Despesas</th></tr>
      ${data.chart.map((item) => `<tr><td>${item.label}</td><td>${item.income}</td><td>${item.expenses}</td></tr>`).join("")}
    </table>`;
  downloadBlob(`<!doctype html><html><meta charset="utf-8"><body>${table}</body></html>`, filename, "application/vnd.ms-excel;charset=utf-8");
}

export function exportToPDF(data, filename = "relatorio-financeiro.pdf") {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  printWindow.document.write(`
    <!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${filename}</title>
    <style>body{font:14px Arial;color:#17201f;padding:40px}h1{font-size:26px}p{color:#66736f}.summary{display:flex;gap:16px;margin:28px 0}.metric{border:1px solid #d9e3df;border-radius:10px;padding:16px;min-width:150px}.metric strong{display:block;font-size:20px;margin-top:8px}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{text-align:left;padding:10px;border-bottom:1px solid #d9e3df}th{background:#f1f7f4}</style></head>
    <body><h1>Relatório financeiro</h1><p>${data.period}</p><div class="summary">
    <div class="metric">Receitas<strong>${data.summary.income}</strong></div><div class="metric">Despesas<strong>${data.summary.expenses}</strong></div><div class="metric">Saldo<strong>${data.summary.balance}</strong></div>
    </div><table><thead><tr><th>Período</th><th>Receitas</th><th>Despesas</th></tr></thead><tbody>${data.chart.map((item) => `<tr><td>${item.label}</td><td>${item.income}</td><td>${item.expenses}</td></tr>`).join("")}</tbody></table></body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
