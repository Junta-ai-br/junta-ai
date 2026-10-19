import { StrictMode, Suspense } from "react";
import { AxiosError } from "axios";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProvider } from "./UserContext";
import { ThemeProvider } from "./ThemeContext";
import { FinanceProvider } from "./FinanceContext";
import useCanonicalFinance from "./useCanonicalFinance";
import { useUser } from "./useUser";
import { clearSession, getSessionSnapshot, saveSession } from "@/services/auth/session";
import AuthHeader from "@/components/navigation/AuthHeader/AuthHeader";

const period = { from: "2026-10-01", to: "2026-10-31" };
const previous = { from: "2026-09-01", to: "2026-09-30" };
const tokens = { accessToken: "access-A", refreshToken: "refresh-A", expiresInSeconds: 900 };
const category = { id: "e71a8f14-a7e5-41e2-b0ac-1c5398f949a3", name: " \u00a0Educação 💜\u2003 ", type: "BOTH", createdAt: "2026-10-18T12:00:00Z" };
const dto = { id: "76870c4b-f8df-4eab-b3c2-de1738a07a4e", categoryId: category.id,
  categoryName: category.name, type: "EXPENSE", amount: "0.01", description: "Conta A", transactionDate: "2026-10-18", createdAt: category.createdAt };
const page = (content = []) => ({ content, number: 0, size: 100, totalElements: content.length, totalPages: content.length ? 1 : 0,
  numberOfElements: content.length, first: true, last: true, empty: !content.length });
const wire = (body) => JSON.stringify(body).replace(/"amount":"(\d+\.\d{2})"/g, '"amount":$1');
const deferred = () => { let resolve; const promise = new Promise((yes) => { resolve = yes; }); return { promise, resolve }; };
let CanonicalFinanceProvider, api, requests, categories, transactions;
const response = (config, body, status = 200) => ({ config, status, headers: {}, data: wire(body) });

beforeEach(async () => {
  vi.stubEnv("VITE_API_URL", "https://backend.example.test");
  sessionStorage.clear(); localStorage.clear(); clearSession();
  ({ api } = await import("@/services/api"));
  ({ CanonicalFinanceProvider } = await import("./CanonicalFinanceProvider"));
  requests = []; categories = [category]; transactions = [dto];
  api.defaults.adapter = vi.fn(async (config) => {
    requests.push(config);
    return response(config, config.url === "/categories" ? categories : page(transactions));
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); clearSession(); vi.unstubAllEnvs(); vi.useRealTimers(); });

function mount({ strict = false, initialPeriod = period } = {}) {
  function Wrapper({ children }) {
    const tree = <UserProvider><CanonicalFinanceProvider initialPeriod={initialPeriod}>{children}</CanonicalFinanceProvider></UserProvider>;
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  }
  return renderHook(() => ({ finance: useCanonicalFinance(), user: useUser() }), { wrapper: Wrapper });
}
const loaded = async (hook) => waitFor(() => expect(hook.result.current.finance.status).toBe("success"));

describe("candidate canonical financial provider", () => {
  it("does not read legacy finance storage, return seeds or send requests while unauthenticated", () => {
    localStorage.setItem("junta_transactions", JSON.stringify([dto]));
    localStorage.setItem("junta_categories", JSON.stringify(["Fake"]));
    const original = Storage.prototype.getItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (key) {
      if (this === localStorage && ["junta_transactions", "junta_categories", "junta_goals"].includes(key)) throw new Error("Legacy read forbidden");
      return original.call(this, key);
    });
    const hook = mount();
    expect(hook.result.current.finance).toMatchObject({ sessionStatus: "unauthenticated", transactions: [], categories: [], summary: null, coverage: null });
    expect(requests).toEqual([]);
  });

  it("loads through authenticated HTTP after login and exposes exact immutable models", async () => {
    transactions = [{ ...dto, amount: "99999999999999999.99" }, { ...dto, id: category.id, type: "INCOME" }];
    const hook = mount();
    act(() => hook.result.current.user.establishSession(tokens));
    await loaded(hook);
    const finance = hook.result.current.finance;
    expect(finance.summary.balance).toBe("-99999999999999999.98");
    expect(finance.transactions[0].signedCents).toBe(-9999999999999999999n);
    expect(finance.categories[0]).toEqual(category);
    expect(finance.coverage).toEqual({ ...period, complete: true, scope: "period" });
    expect(Object.isFrozen(finance.transactions)).toBe(true);
    expect(Object.isFrozen(finance.transactions[0])).toBe(true);
    expect(Object.isFrozen(finance.categories)).toBe(true);
    expect(Object.isFrozen(finance.summary)).toBe(true);
    expect(Object.keys(finance.getSnapshot()).join(" ")).not.toMatch(/token|generation/i);
    expect(requests).toHaveLength(2);
    expect(requests.every((request) => request.headers.get("Authorization") === "Bearer access-A")).toBe(true);
  });

  it("clears on logout synchronously, before another render or cleanup effect", async () => {
    saveSession(tokens);
    const hook = mount(); await loaded(hook);
    const read = hook.result.current.finance.getSnapshot;
    act(() => {
      clearSession();
      expect(read()).toMatchObject({ sessionStatus: "unauthenticated", transactions: [], categories: [], summary: null });
    });
    expect(hook.result.current.finance.transactions).toEqual([]);
  });

  it("guards synchronous reads when storage changes without any session notification", async () => {
    saveSession(tokens);
    const hook = mount(); await loaded(hook);
    const raw = JSON.parse(sessionStorage.getItem("junta_auth_session"));
    act(() => {
      sessionStorage.setItem("junta_auth_session", JSON.stringify({ ...raw, accessToken: "account-B" }));
      expect(hook.result.current.finance.getSnapshot()).toMatchObject({ transactions: [], summary: null });
    });
  });

  it("clears expired data synchronously and propagates expiration without a new load", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    saveSession({ ...tokens, expiresInSeconds: 1 });
    const hook = mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(hook.result.current.finance.status).toBe("success");
    act(() => {
      vi.setSystemTime(new Date("2026-10-18T12:00:01Z"));
      expect(hook.result.current.finance.getSnapshot()).toMatchObject({ transactions: [], categories: [], summary: null });
      vi.advanceTimersByTime(1000);
    });
    expect(hook.result.current.finance.sessionStatus).toBe("unauthenticated");
    expect(requests).toHaveLength(2);
  });

  it.each(["different account", "identical token", "logout/login"])("reloads and isolates a %s generation", async (transition) => {
    saveSession(tokens);
    const hook = mount(); await loaded(hook);
    const generationA = getSessionSnapshot().generation;
    transactions = [{ ...dto, description: "Conta B", amount: "2.00" }];
    act(() => {
      if (transition === "logout/login") clearSession();
      saveSession(transition === "different account" ? { ...tokens, accessToken: "account-B" } : tokens);
      expect(hook.result.current.finance.getSnapshot().transactions).toEqual([]);
    });
    expect(getSessionSnapshot().generation).not.toBe(generationA);
    await waitFor(() => expect(hook.result.current.finance.transactions[0]?.description).toBe("Conta B"));
    expect(hook.result.current.finance.summary.balance).toBe("-2.00");
    expect(requests).toHaveLength(4);
  });

  it("does not apply an old HTTP 200 after logout and login B", async () => {
    saveSession(tokens);
    const held = deferred(); let oldConfig;
    const normal = api.defaults.adapter;
    api.defaults.adapter = async (config) => {
      if (config.url === "/transactions" && !oldConfig) { oldConfig = config; return held.promise; }
      return normal(config);
    };
    const hook = mount();
    await waitFor(() => expect(oldConfig).toBeDefined());
    transactions = [{ ...dto, description: "B confirmed" }];
    act(() => { clearSession(); saveSession({ ...tokens, accessToken: "B" }); });
    await loaded(hook);
    await act(async () => { held.resolve(response(oldConfig, page([dto]))); await held.promise; });
    expect(hook.result.current.finance.transactions[0].description).toBe("B confirmed");
    expect(oldConfig.signal.aborted).toBe(true);
  });

  it("has one active owner in StrictMode, no duplicate HTTP and no mutations on mount", async () => {
    saveSession(tokens);
    const hook = mount({ strict: true }); await loaded(hook);
    expect(requests).toHaveLength(2);
    expect(requests.every((request) => request.method === "get")).toBe(true);
    const firstGetter = hook.result.current.finance.getSnapshot;
    hook.unmount();
    expect(firstGetter()).toMatchObject({ transactions: [], categories: [], summary: null });
    act(() => saveSession(tokens));
    await Promise.resolve();
    expect(requests).toHaveLength(2);
    const remount = mount({ strict: true }); await loaded(remount);
    expect(requests).toHaveLength(4);
  });

  it("starts no resources for a discarded suspended render", async () => {
    saveSession(tokens);
    const never = new Promise(() => {});
    function Suspended() { throw never; }
    const view = render(<UserProvider><Suspense fallback={<p>waiting</p>}>
      <CanonicalFinanceProvider initialPeriod={period}><Suspended /></CanonicalFinanceProvider>
    </Suspense></UserProvider>);
    await act(async () => { await Promise.resolve(); });
    expect(requests).toEqual([]);
    view.unmount();
  });

  it("aborts a pending request on unmount and exposes no data afterward", async () => {
    saveSession(tokens);
    const held = deferred(); let config;
    api.defaults.adapter = (request) => { config = request; return held.promise; };
    const hook = mount();
    await waitFor(() => expect(config).toBeDefined());
    const read = hook.result.current.finance.getSnapshot;
    hook.unmount();
    expect(config.signal.aborted).toBe(true);
    expect(read()).toMatchObject({ transactions: [], categories: [], summary: null });
    await act(async () => { held.resolve(response(config, [category])); await held.promise; });
    expect(read().transactions).toEqual([]);
  });

  it("disposes bridge resources even if a cleanup subscriber throws a programming error", async () => {
    saveSession(tokens);
    const { createFinanceProviderStore } = await import("@/services/finance/finance-provider-store");
    const held = deferred(); let config;
    api.defaults.adapter = (request) => { config = request; return held.promise; };
    const store = createFinanceProviderStore(period);
    const detach = store.mount();
    await waitFor(() => expect(config).toBeDefined());
    const bug = new Error("Subscriber bug");
    const off = store.subscribe(() => { throw bug; });
    expect(() => detach()).toThrow(bug);
    expect(config.signal.aborted).toBe(true);
    expect(store.getSnapshot().transactions).toEqual([]);
    off();
    held.resolve(response(config, [category]));
    await held.promise;
  });

  it("keeps snapshots and action references stable across unrelated renders", async () => {
    saveSession(tokens);
    const hook = mount(); await loaded(hook);
    const before = hook.result.current.finance;
    expect(before.getSnapshot()).toBe(before.getSnapshot());
    hook.rerender();
    expect(hook.result.current.finance).toBe(before);
    expect(requests).toHaveLength(2);
  });

  it("publishes a truly empty month only after both HTTP responses", async () => {
    categories = []; transactions = []; saveSession(tokens);
    const hook = mount();
    await waitFor(() => expect(hook.result.current.finance.status).toBe("empty"));
    expect(hook.result.current.finance.summary.balance).toBe("0.00");
    expect(hook.result.current.finance.coverage.complete).toBe(true);
    expect(requests).toHaveLength(2);
  });

  it.each([401, 403, 500])("handles HTTP %s without seeds or false empty state", async (status) => {
    saveSession(tokens);
    api.defaults.adapter = async (config) => { throw new AxiosError("Rejected", "ERR_BAD_REQUEST", config, {}, { status, config, data: '{"mensagem":"failure"}' }); };
    const hook = mount();
    await waitFor(() => expect(hook.result.current.finance.status).toBe(status === 401 ? "stale" : "error"));
    expect(hook.result.current.finance).toMatchObject({ transactions: [], categories: [], summary: null, coverage: null });
    expect(!!getSessionSnapshot()).toBe(status !== 401);
  });

  it.each(["duplicate UUID", "unresolved category"])("exposes COVERAGE_UNKNOWN for %s", async (kind) => {
    saveSession(tokens);
    if (kind === "duplicate UUID") transactions = [dto, { ...dto }];
    else categories = [];
    const hook = mount();
    await waitFor(() => expect(hook.result.current.finance.error?.code).toBe("COVERAGE_UNKNOWN"));
    expect(hook.result.current.finance).toMatchObject({ transactions: [], summary: null, coverage: null });
  });

  it("changes period during a load without exposing either partial or old data", async () => {
    saveSession(tokens);
    const held = deferred(); let october;
    api.defaults.adapter = async (config) => {
      if (config.url === "/categories") return response(config, [category]);
      if (config.params.from === period.from) { october = config; return held.promise; }
      return response(config, page([{ ...dto, description: "September", transactionDate: "2026-09-15" }]));
    };
    const hook = mount(); await waitFor(() => expect(october).toBeDefined());
    let fresh;
    await act(async () => { fresh = await hook.result.current.finance.load(previous); });
    expect(fresh.status).toBe("success");
    await act(async () => { held.resolve(response(october, page([dto]))); await held.promise; });
    expect(hook.result.current.finance.period).toEqual(previous);
    expect(hook.result.current.finance.transactions[0].description).toBe("September");
  });

  it.each([null, {}, { from: "2026-02-30", to: "2026-10-31" }, { from: period.to, to: period.from }])(
    "rejects invalid or unknown periods %j without HTTP or data relabeling", async (invalid) => {
      saveSession(tokens); const hook = mount(); await loaded(hook);
      const before = hook.result.current.finance.getSnapshot();
      await act(async () => { await expect(hook.result.current.finance.load(invalid)).rejects.toBeDefined(); });
      expect(hook.result.current.finance.getSnapshot()).toBe(before);
      expect(requests).toHaveLength(2);
    },
  );

  describe("rejected load intentions", () => {
    async function pendingLoad({ strict = false, empty = false } = {}) {
      saveSession(tokens);
      const hook = mount({ strict }); await loaded(hook);
      if (empty) categories = [];
      const held = deferred(); let config;
      const normal = api.defaults.adapter;
      api.defaults.adapter = (request) => {
        if (request.url === "/transactions" && !config) { config = request; return held.promise; }
        return normal(request);
      };
      let pending;
      act(() => { pending = hook.result.current.finance.reload(); });
      await waitFor(() => expect(config).toBeDefined());
      return { hook, held, config, pending };
    }

    it.each([
      [null, "COVERAGE_UNKNOWN", [dto]],
      [null, "COVERAGE_UNKNOWN", []],
      [{ from: period.to, to: period.from }, "INVALID_PERIOD", [dto]],
      [{ from: period.to, to: period.from }, "INVALID_PERIOD", []],
    ])("preserves a pending valid load after rejecting %j (%s), content %j", async (invalid, code, content) => {
      const { hook, held, config, pending } = await pendingLoad({ empty: !content.length });
      const before = hook.result.current.finance.getSnapshot();
      const requestCount = requests.length;
      await act(async () => {
        await expect(hook.result.current.finance.load(invalid)).rejects.toMatchObject({ code });
      });
      expect(hook.result.current.finance.getSnapshot()).toBe(before);
      expect(config.signal.aborted).toBe(false);
      expect(requests).toHaveLength(requestCount);
      let result;
      await act(async () => { held.resolve(response(config, page(content))); result = await pending; });
      const snapshot = hook.result.current.finance.getSnapshot();
      expect(result.status).toBe(content.length ? "success" : "empty");
      expect(snapshot.status).toBe(result.status);
      expect(snapshot.transactions).toBe(result.data.transactions);
      expect(snapshot.summary).toBe(result.data.summary);
      expect(snapshot.period).toEqual(result.period);
    });

    it("does not restore an older intent over a valid load started by an invalid period getter", async () => {
      const { hook, held, config, pending } = await pendingLoad();
      transactions = [{ ...dto, description: "September", transactionDate: "2026-09-15" }];
      let newer;
      const invalid = { get from() { newer = hook.result.current.finance.load(previous); return undefined; }, to: previous.to };
      let fresh;
      await act(async () => {
        await expect(hook.result.current.finance.load(invalid)).rejects.toMatchObject({ code: "COVERAGE_UNKNOWN" });
        fresh = await newer;
      });
      expect(fresh.status).toBe("success");
      let old;
      await act(async () => { held.resolve(response(config, page([dto]))); old = await pending; });
      expect(old).toMatchObject({ status: "stale", data: null });
      expect(config.signal.aborted).toBe(true);
      expect(hook.result.current.finance.getSnapshot()).toMatchObject({ period: previous, status: fresh.status });
      expect(hook.result.current.finance.transactions).toBe(fresh.data.transactions);
    });

    it("keeps a newer valid load authoritative after a subsequent invalid attempt", async () => {
      const { hook, held, config, pending } = await pendingLoad();
      transactions = [{ ...dto, transactionDate: "2026-09-15" }];
      let fresh;
      await act(async () => {
        const newer = hook.result.current.finance.load(previous);
        await expect(hook.result.current.finance.load(null)).rejects.toMatchObject({ code: "COVERAGE_UNKNOWN" });
        fresh = await newer;
      });
      expect(fresh.status).toBe("success");
      let old;
      await act(async () => { held.resolve(response(config, page([dto]))); old = await pending; });
      expect(old).toMatchObject({ status: "stale", data: null });
      expect(hook.result.current.finance.period).toEqual(previous);
      expect(hook.result.current.finance.transactions).toBe(fresh.data.transactions);
    });

    it("does not restore session A when invalid validation establishes a new generation with identical tokens", async () => {
      const { hook, held, config, pending } = await pendingLoad();
      const generation = getSessionSnapshot().generation;
      transactions = [{ ...dto, description: "New generation" }];
      const invalid = { get from() { saveSession(tokens); return undefined; }, to: period.to };
      await act(async () => {
        await expect(hook.result.current.finance.load(invalid)).rejects.toMatchObject({ code: "COVERAGE_UNKNOWN" });
        expect(hook.result.current.finance.getSnapshot().transactions).toEqual([]);
      });
      expect(getSessionSnapshot().generation).not.toBe(generation);
      await loaded(hook);
      let old;
      await act(async () => { held.resolve(response(config, page([dto]))); old = await pending; });
      expect(old).toMatchObject({ status: "stale", data: null });
      expect(hook.result.current.finance.transactions[0].description).toBe("New generation");
    });

    it("does not restore disposed data when invalid validation unmounts a StrictMode owner", async () => {
      const { hook, held, config, pending } = await pendingLoad({ strict: true });
      const { load, getSnapshot } = hook.result.current.finance;
      const invalid = { get from() { hook.unmount(); return undefined; }, to: period.to };
      await act(async () => {
        await expect(load(invalid)).rejects.toMatchObject({ code: "COVERAGE_UNKNOWN" });
      });
      expect(config.signal.aborted).toBe(true);
      let old;
      await act(async () => { held.resolve(response(config, page([dto]))); old = await pending; });
      expect(old).toMatchObject({ status: "cancelled", data: null });
      expect(getSnapshot()).toMatchObject({ transactions: [], categories: [], summary: null });
      await expect(load(period)).resolves.toMatchObject({ status: "cancelled", data: null });
      expect(getSnapshot().transactions).toEqual([]);
    });
  });

  it("does not write financial data in localStorage and exposes asynchronous command outcomes", async () => {
    saveSession(tokens);
    const write = vi.spyOn(Storage.prototype, "setItem");
    const hook = mount(); await loaded(hook);
    const base = api.defaults.adapter;
    api.defaults.adapter = async (config) => {
      if (config.method === "post") throw Object.assign(new Error("Network"), { code: "ERR_NETWORK" });
      return base(config);
    };
    let completed;
    await act(async () => { completed = await hook.result.current.finance.createTransaction({ categoryId: category.id,
      type: "EXPENSE", description: null, amount: "0.01", transactionDate: "2026-10-18" }); });
    expect(completed.status).toBe("indeterminate");
    expect(hook.result.current.finance).toMatchObject({ refreshRequired: true, lastResult: completed, pending: 0 });
    expect(write.mock.calls.filter(([key]) => ["junta_transactions", "junta_categories", "junta_goals"].includes(key))).toEqual([]);
  });

  it("returns a confirmed write only after HTTP and obtains collections through the full refresh", async () => {
    saveSession(tokens);
    const hook = mount(); await loaded(hook);
    const base = api.defaults.adapter;
    const held = deferred(); let writeConfig;
    api.defaults.adapter = (config) => {
      if (config.method === "put") { writeConfig = config; return held.promise; }
      return base(config);
    };
    let pending;
    act(() => { pending = hook.result.current.finance.updateTransaction(dto.id, {
      categoryId: category.id, type: "EXPENSE", amount: "0.02", description: "updated", transactionDate: dto.transactionDate,
    }); });
    await waitFor(() => expect(writeConfig).toBeDefined());
    expect(hook.result.current.finance.pending).toBe(1);
    expect(hook.result.current.finance.lastResult).toBeNull();
    expect(hook.result.current.finance.transactions[0].amount).toBe("0.01");
    transactions = [{ ...dto, amount: "0.02", description: "updated" }];
    let completed;
    await act(async () => { held.resolve(response(writeConfig, transactions[0])); completed = await pending; });
    expect(completed).toMatchObject({ status: "confirmed", id: dto.id, refresh: { status: "synced" } });
    expect(hook.result.current.finance).toMatchObject({ pending: 0, refreshRequired: false, lastResult: completed });
    expect(hook.result.current.finance.summary.balance).toBe("-0.02");
    expect(writeConfig.data).not.toContain("signedCents");
  });

  it("defaults to the UTC civil month without using the historical legacy range", async () => {
    saveSession(tokens); categories = []; transactions = [];
    const now = new Date();
    const expected = { from: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`,
      to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).toISOString().slice(0, 10) };
    function Wrapper({ children }) { return <UserProvider><CanonicalFinanceProvider>{children}</CanonicalFinanceProvider></UserProvider>; }
    const hook = renderHook(() => useCanonicalFinance(), { wrapper: Wrapper });
    await waitFor(() => expect(hook.result.current.status).toBe("empty"));
    expect(hook.result.current.period).toEqual(expected);
  });

  it.each(["legacy parent", "canonical parent"])("rejects competing financial providers with %s", (kind) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const tree = kind === "legacy parent"
      ? <FinanceProvider><CanonicalFinanceProvider initialPeriod={period}><p>invalid</p></CanonicalFinanceProvider></FinanceProvider>
      : <CanonicalFinanceProvider initialPeriod={period}><FinanceProvider><p>invalid</p></FinanceProvider></CanonicalFinanceProvider>;
    expect(() => render(<UserProvider>{tree}</UserProvider>)).toThrow("cannot be nested");
    expect(requests).toEqual([]);
  });

  it("requires the authentication provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CanonicalFinanceProvider><p>invalid</p></CanonicalFinanceProvider>)).toThrow("requires UserProvider");
    expect(requests).toEqual([]);
  });

  it.each(["legacy first", "canonical first"])("rejects competing sibling providers with %s", (order) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const legacy = <FinanceProvider key="legacy"><p>legacy</p></FinanceProvider>;
    const canonical = <CanonicalFinanceProvider key="canonical" initialPeriod={period}><p>canonical</p></CanonicalFinanceProvider>;
    expect(() => render(<UserProvider>{order === "legacy first" ? [legacy, canonical] : [canonical, legacy]}</UserProvider>))
      .toThrow("Only one financial provider");
    expect(requests).toEqual([]);
  });
});

function SessionProbe() {
  const finance = useCanonicalFinance();
  const user = useUser();
  const location = useLocation();
  return <p data-testid="session-state">{`${user.isAuthenticated}|${finance.transactions.length}|${location.pathname}`}</p>;
}

it("visual logout ends authentication, clears candidate data and allows login B", async () => {
  saveSession(tokens);
  render(<MemoryRouter initialEntries={["/dashboard"]}><ThemeProvider><UserProvider>
    <CanonicalFinanceProvider initialPeriod={period}><AuthHeader /><SessionProbe /></CanonicalFinanceProvider>
  </UserProvider></ThemeProvider></MemoryRouter>);
  await waitFor(() => expect(screen.getByTestId("session-state")).toHaveTextContent("true|1|/dashboard"));
  fireEvent.click(screen.getByRole("button", { name: "Menu de Usuário" }));
  fireEvent.click(screen.getByRole("menuitem", { name: "Sair" }));
  expect(getSessionSnapshot()).toBeNull();
  expect(screen.getByTestId("session-state")).toHaveTextContent("false|0|/");
  transactions = [];
  act(() => saveSession({ ...tokens, accessToken: "B" }));
  await waitFor(() => expect(requests).toHaveLength(4));
  expect(screen.getByTestId("session-state")).toHaveTextContent("true|0|/");
});
