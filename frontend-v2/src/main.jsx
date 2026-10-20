import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import AppProviders from "./app/providers";
import { startSessionRenewal } from "./services/auth/refresh";

import "./styles/global.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found.");
}

startSessionRenewal();

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <AppProviders>
      <App />
    </AppProviders>
  </BrowserRouter>
);