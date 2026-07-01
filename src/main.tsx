import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installNetMonitor } from "./trust/netMonitor";
import "./index.css";

// Install before anything can make a request, so every outbound call —
// including WebLLM's weight downloads — is captured by the Trust panel.
installNetMonitor();

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
