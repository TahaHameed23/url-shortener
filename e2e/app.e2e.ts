import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("a user can register, create a short link, and follow its redirect", async ({
    page,
}) => {
    const name = "E2E Tester";
    const destination = "https://destination.example/e2e-flow";
    const email = `e2e-${randomUUID()}@example.test`;
    const clientIp = `2001:db8:${randomUUID()
        .replaceAll("-", "")
        .match(/.{1,4}/g)!
        .slice(0, 6)
        .join(":")}`;

    await page.setExtraHTTPHeaders({ "cf-connecting-ip": clientIp });
    await page.goto("/register");
    await expect(
        page.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();

    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill("e2e-password-123");
    await page.getByLabel("Confirm password").fill("e2e-password-123");
    await page.getByRole("button", { name: "Create account", exact: true }).click();

    await expect(
        page.getByRole("heading", { name: `Hey there, ${name}` }),
    ).toBeVisible();
    await page.getByRole("textbox", { name: "Long URL to shorten" }).fill(destination);
    await page.getByRole("button", { name: "Shorten URL" }).click();

    await expect(page.getByText("Your short link is ready")).toBeVisible();
    await expect(page.getByText(destination)).toBeVisible();

    const shortLink = page.getByRole("link", {
        name: /^127\.0\.0\.1:8788\/l\//,
    });
    await expect(shortLink).toBeVisible();
    const shortUrl = await shortLink.getAttribute("href");
    expect(shortUrl).toBeTruthy();

    const redirect = await page.request.get(shortUrl!, { maxRedirects: 0 });
    expect(redirect.status()).toBe(302);
    expect(redirect.headers().location).toBe(destination);

    await page.reload();
    await expect(
        page.getByRole("heading", { name: `Hey there, ${name}` }),
    ).toBeVisible();
    await expect(
        page.getByText("Total clicks").locator("..").getByText("1"),
    ).toBeVisible();
});
