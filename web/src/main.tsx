import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installClientErrorLogging } from "./lib/error-logging";
import "./styles.css";

installClientErrorLogging();

if (import.meta.env.PROD && "serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch((error: unknown) => {
            console.error("Unable to register the URLZ offline worker.", error);
        });
    });
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

