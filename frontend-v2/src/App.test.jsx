import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, useLocation } from "react-router-dom";
import App from "./App";
import { beforeSendAnalytics } from "./utils/analytics";

vi.mock("./components/navigation/ScrollToTop", () => ({ default: () => null }));
vi.mock("./app/routes", () => ({ default: function TestRoutes() {
  return <><output>{useLocation().pathname}</output><Link to="/sobre">Sobre</Link><Link to="/planos">Planos</Link></>;
} }));

beforeEach(() => {
  vi.stubEnv("PROD", true);
  vi.stubGlobal("location", new URL("https://junta-ai.com"));
});

afterEach(() => {
  cleanup();
  document.querySelectorAll('script[data-sdkn="@vercel/analytics/react"]').forEach((script) => script.remove());
  delete window.va;
  delete window.vaq;
  delete window.vam;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("App analytics integration", () => {
  it("keeps one SDK script and privacy callback across SPA navigation", () => {
    render(<MemoryRouter><App /></MemoryRouter>);
    const scripts = () => document.querySelectorAll('script[data-sdkn="@vercel/analytics/react"]');
    expect(scripts()).toHaveLength(1);
    const script = scripts()[0];
    expect(script.dataset.disableAutoTrack).toBeUndefined();
    expect(window.vaq.filter(([type]) => type === "beforeSend")).toEqual([["beforeSend", beforeSendAnalytics]]);

    fireEvent.click(screen.getByRole("link", { name: "Sobre" }));
    expect(screen.getByRole("status")).toHaveTextContent("/sobre");
    fireEvent.click(screen.getByRole("link", { name: "Planos" }));
    expect(screen.getByRole("status")).toHaveTextContent("/planos");
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]).toBe(script);
    expect(window.vaq.filter(([type]) => type === "beforeSend")).toHaveLength(1);
  });

  it.each([
    [true, "https://preview.vercel.app"], [true, "http://localhost:5173"],
    [true, "https://www.junta-ai.com"], [true, "https://other.test"],
    [false, "https://junta-ai.com"],
  ])("does not inject the SDK or initialize its queue: prod=%s origin=%s", (production, origin) => {
    vi.stubEnv("PROD", production);
    vi.stubGlobal("location", new URL(origin));
    render(<MemoryRouter><App /></MemoryRouter>);
    expect(document.querySelectorAll('script[data-sdkn="@vercel/analytics/react"]')).toHaveLength(0);
    expect(window.va).toBeUndefined();
    expect(window.vaq).toBeUndefined();
    fireEvent.click(screen.getByRole("link", { name: "Sobre" }));
    expect(screen.getByRole("status")).toHaveTextContent("/sobre");
  });
});
