type ChromeTab = { url?: string };

declare const chrome: {
    tabs: {
        query(queryInfo: {
            active: boolean;
            currentWindow: boolean;
        }): Promise<ChromeTab[]>;
        create(createProperties: { url: string }): Promise<ChromeTab>;
    };
    storage: {
        local: {
            get(key: string): Promise<Record<string, unknown>>;
            set(items: Record<string, string>): Promise<void>;
        };
    };
    runtime: {
        openOptionsPage(): Promise<void>;
    };
};
