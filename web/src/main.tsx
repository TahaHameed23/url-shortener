import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { installClientErrorLogging } from "./lib/error-logging";
import "./styles.css";

installClientErrorLogging();

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);



