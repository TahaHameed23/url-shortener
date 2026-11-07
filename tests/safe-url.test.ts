import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getSafeExternalUrl } from "../src/services/safe-url";

describe("getSafeExternalUrl", () => {
    test("rejects unsupported schemes, empty values, and invalid ports", () => {
        assert.equal(getSafeExternalUrl("ftp://example.com/file"), null);
        assert.equal(getSafeExternalUrl(""), null);
        assert.equal(getSafeExternalUrl("https://example.com:invalid"), null);
    });

    test("normalizes host case and preserves path, query, and fragment", () => {
        assert.equal(
            getSafeExternalUrl(" HTTPS://Example.COM/Path?q=hello#section "),
            "https://example.com/Path?q=hello#section",
        );
    });

    test("normalizes valid HTTP and HTTPS URLs", () => {
        assert.equal(
            getSafeExternalUrl("  https://example.com/path  "),
            "https://example.com/path",
        );
        assert.equal(
            getSafeExternalUrl("http://example.com"),
            "http://example.com/",
        );
    });

    test("rejects unsupported schemes, malformed values, and credentials", () => {
        assert.equal(getSafeExternalUrl("javascript:alert(1)"), null);
        assert.equal(getSafeExternalUrl("data:text/html,hi"), null);
        assert.equal(getSafeExternalUrl("not a URL"), null);
        assert.equal(getSafeExternalUrl("https://user:pass@example.com"), null);
    });
});
