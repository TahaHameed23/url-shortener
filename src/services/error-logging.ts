type RequestLogContext = {
    requestId?: string;
    method?: string;
    path?: string;
};

function errorDetails(error: unknown): { name: string; message: string } {
    const details =
        error instanceof Error
            ? { name: error.name, message: error.message }
            : { name: "UnknownError", message: String(error) };

    return {
        name: details.name.slice(0, 100),
        message: details.message
            .replace(
                /\b(password|token|cookie|authorization|secret)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/gi,
                "$1=[REDACTED]",
            )
            .replace(/\burlz_(access|refresh)=[^;\s]+/gi, "urlz_$1=[REDACTED]")
            .replace(/\bBearer\s+\S+/gi, "Bearer [REDACTED]")
            .replace(
                /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
                "[JWT REDACTED]",
            )
            .slice(0, 500),
    };
}

export function logServerError(
    event: string,
    error: unknown,
    context: RequestLogContext,
): void {
    console.error(
        JSON.stringify({
            level: "error",
            source: "worker",
            event,
            ...context,
            error: errorDetails(error),
        }),
    );
}

export function logHttpFailure(
    context: RequestLogContext & { status: number; durationMs: number },
): void {
    const level = context.status >= 500 ? "error" : "warn";
    const write = context.status >= 500 ? console.error : console.warn;

    write(
        JSON.stringify({
            level,
            source: "worker",
            event: "http.request.failed",
            ...context,
        }),
    );
}
