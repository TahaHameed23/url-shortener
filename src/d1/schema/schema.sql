CREATE TABLE
    links (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        clicks INTEGER DEFAULT 0
);
--

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

--

CREATE TABLE clicks (
    id TEXT PRIMARY KEY,
    link_id TEXT,
    timestamp DATETIME,
    country TEXT,
    city TEXT,
    referer TEXT,
    user_agent TEXT
);