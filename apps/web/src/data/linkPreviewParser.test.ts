import { describe, expect, it } from "vitest";
import {
  extractTitle,
  findMetaContent,
  sanitizeUrl,
  toAbsoluteUrl,
} from "../../../../supabase/functions/link-preview/parser";

describe("link preview parser", () => {
  it("extracts og metadata content and decodes entities", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="The &quot;Best&quot; Story" />
          <meta property="og:description" content="A &lt;great&gt; read" />
        </head>
      </html>
    `;

    expect(findMetaContent(html, ["og:title"])).toBe('The "Best" Story');
    expect(findMetaContent(html, ["og:description"])).toBe("A <great> read");
  });

  it("falls back to document title extraction", () => {
    const html = `<html><head><title>  Hello   World  </title></head></html>`;
    expect(extractTitle(html)).toBe("Hello World");
  });

  it("normalizes absolute image URLs against response URL", () => {
    const image = "/cover.png";
    expect(toAbsoluteUrl(image, "https://example.com/blog/post")).toBe("https://example.com/cover.png");
  });

  it("rejects unsupported URL protocols", () => {
    expect(() => sanitizeUrl("javascript:alert(1)")).toThrow("Only http(s) URLs are supported.");
  });
});
