import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportToCSV, exportToExcel, exportToPDF } from "./report-exporters";

const report = {
  period: 'Agosto "2026"',
  summary: {
    income: 2000,
    expenses: 350,
    balance: 1650,
    incomeChange: "+10,0%",
    expensesChange: "-5,0%",
    balanceChange: "+12,0%",
  },
  chart: [{ label: "Semana 1", income: 2000, expenses: 350 }],
};

let createObjectURL;
let revokeObjectURL;
let clickSpy;

beforeEach(() => {
  createObjectURL = vi.fn(() => "blob:test-report");
  revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("report exports", () => {
  it("creates a UTF-8 CSV with escaped fields and a BOM", async () => {
    exportToCSV(report);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    const [blob] = createObjectURL.mock.calls[0];
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const csv = await blob.text();
    expect(blob.type).toBe("text/csv;charset=utf-8");
    expect(Array.from(bytes.slice(0, 3))).toEqual([239, 187, 191]);
    expect(csv).toContain("\"Período\";\"Agosto \"\"2026\"\"\"");
    expect(csv).toContain("\"Semana 1\";\"2000\";\"350\"");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-report");
  });

  it("uses a custom CSV filename", () => {
    exportToCSV(report, "custom.csv");

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
  });

  it("creates an Excel-compatible HTML workbook", async () => {
    exportToExcel(report);

    const [blob] = createObjectURL.mock.calls[0];
    const html = await blob.text();
    expect(blob.type).toBe("application/vnd.ms-excel;charset=utf-8");
    expect(html).toContain("Relatório financeiro - Agosto \"2026\"");
    expect(html).toContain("<td>Semana 1</td><td>2000</td><td>350</td>");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test-report");
  });

  it("returns safely when the PDF popup is blocked", () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    expect(() => exportToPDF(report)).not.toThrow();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("writes and prints a PDF report in a new window", () => {
    const document = { write: vi.fn(), close: vi.fn() };
    const printWindow = { document, focus: vi.fn(), print: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue(printWindow);

    exportToPDF(report, "August report.pdf");

    expect(window.open).toHaveBeenCalledWith("", "_blank", "width=900,height=700");
    expect(document.write).toHaveBeenCalledOnce();
    expect(document.write.mock.calls[0][0]).toContain("August report.pdf");
    expect(document.write.mock.calls[0][0]).toContain("Semana 1");
    expect(document.close).toHaveBeenCalledOnce();
    expect(printWindow.focus).toHaveBeenCalledOnce();
    expect(printWindow.print).toHaveBeenCalledOnce();
  });
});