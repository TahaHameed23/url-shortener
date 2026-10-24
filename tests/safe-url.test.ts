import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getSafeExternalUrl } from "../src/services/safe-url";

describe("getSafeExternalUrl", () => {
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
