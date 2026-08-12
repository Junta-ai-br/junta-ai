import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
const Index = lazy(() => import("./pages/Index.jsx"));
const ExpensesCategoryPage = lazy(() => import("./pages/ExpensesCategoryPage.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const queryClient = new QueryClient();
const App = () => /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
  /* @__PURE__ */ jsx(Toaster, {}),
  /* @__PURE__ */ jsx(Sonner, {}),
  /* @__PURE__ */ jsx(BrowserRouter, { children: /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx("div", { children: "Carregando..." }), children: /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Index, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/gastos-por-categoria", element: /* @__PURE__ */ jsx(ExpensesCategoryPage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(NotFound, {}) })
  ] }) }) })
] }) });
var stdin_default = App;
export {
  stdin_default as default
};
