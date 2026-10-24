type ClientErrorDetails = Record<string, string | number | undefined>;

export function logClientError(
    event: string,
    details: ClientErrorDetails = {},
): void {
    const log = details.level === "warn" ? console.warn : console.error;
    log(
        JSON.stringify({
            level: "error",
            source: "web",
            event,
            timestamp: new Date().toISOString(),
            ...details,
        }),
    );
}

export function installClientErrorLogging(): void {
    window.addEventListener("error", (event) => {
        logClientError("window.error", {
            name: event.error instanceof Error ? event.error.name : "Error",
            line: event.lineno,
            column: event.colno,
        });
    });

    window.addEventListener("unhandledrejection", (event) => {
        logClientError("window.unhandled_rejection", {
            name:
                event.reason instanceof Error
                    ? event.reason.name
                    : "UnhandledRejection",
        });
    });
}
