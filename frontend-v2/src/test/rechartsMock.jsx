import React from "react";

function ChartStub({ children }) {
  return React.createElement("div", { "data-testid": "chart-stub" }, children);
}

export const Bar = ChartStub;
export const BarChart = ChartStub;
export const CartesianGrid = ChartStub;
export const Cell = ChartStub;
export const Legend = ChartStub;
export const Line = ChartStub;
export const LineChart = ChartStub;
export const Pie = ChartStub;
export const PieChart = ChartStub;
export const ResponsiveContainer = ChartStub;
export const Tooltip = ChartStub;
export const XAxis = ChartStub;
export const YAxis = ChartStub;