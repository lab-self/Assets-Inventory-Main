import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Login } from "./App";

describe("login interface", () => {
  it("renders required credentials and local artwork without exposing the dashboard", () => {
    const html = renderToStaticMarkup(<Login onLogin={() => undefined} />);
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html.match(/required=""/g)).toHaveLength(2);
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('aria-label="Show password"');
    expect(html).toContain('src="/inventory-scene.svg"');
    expect(html).not.toContain('class="app-shell"');
    expect(
      readFileSync(
        new URL("../public/inventory-scene.svg", import.meta.url),
        "utf8",
      ),
    ).toContain("<svg");
  });
});
