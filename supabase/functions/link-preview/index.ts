import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import metascraper from "npm:metascraper@5";
import metascraperDescription from "npm:metascraper-description@5";
import metascraperImage from "npm:metascraper-image@5";
import metascraperPublisher from "npm:metascraper-publisher@5";
import metascraperTitle from "npm:metascraper-title@5";
import {
  extractTitle,
  findMetaContent,
  sanitizeUrl,
  toAbsoluteUrl,
} from "./parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const previewFetchHeaders = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 PlumboardLinkPreview/1.0",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
};

type LinkPreviewPayload = { url?: unknown };
type LinkPreviewResult = {
  url: string;
  siteName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
};

const scrapeMetadata = metascraper([
  metascraperTitle(),
  metascraperDescription(),
  metascraperImage(),
  metascraperPublisher(),
]);

function firstNonEmptyString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const extracted = firstNonEmptyString(candidate);
      if (extracted) {
        return extracted;
      }
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const extracted = firstNonEmptyString(record.url) ||
      firstNonEmptyString(record.secure_url);

    if (extracted) {
      return extracted;
    }
  }

  return "";
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  let payload: LinkPreviewPayload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  if (typeof payload.url !== "string") {
    return jsonResponse(400, { error: "A URL is required." });
  }

  let requestUrl = "";

  try {
    requestUrl = sanitizeUrl(payload.url.trim());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid URL.";
    return jsonResponse(400, { error: message });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => {
    abortController.abort("Request timed out.");
  }, 10_000);

  try {
    const response = await fetch(requestUrl, {
      method: "GET",
      redirect: "follow",
      signal: abortController.signal,
      headers: previewFetchHeaders,
    });

    if (!response.ok) {
      return jsonResponse(502, { error: `Could not fetch URL (${response.status}).` });
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("text/html")) {
      return jsonResponse(200, { url: response.url || requestUrl });
    }

    const html = (await response.text()).slice(0, 2_000_000);

    const parsedUrl = response.url || requestUrl;

    let scrapedMetadata: Record<string, unknown> | undefined;
    try {
      scrapedMetadata = await scrapeMetadata({ html, url: parsedUrl }) as Record<string, unknown>;
    } catch (error) {
      console.error("metascraper primary scrape failed", error);
    }

    const scrapedSiteName = firstNonEmptyString(scrapedMetadata?.publisher);
    const scrapedTitle = firstNonEmptyString(scrapedMetadata?.title);
    const scrapedDescription = firstNonEmptyString(scrapedMetadata?.description);
    const scrapedImage = firstNonEmptyString(scrapedMetadata?.image);

    const siteName = scrapedSiteName ||
      findMetaContent(html, ["og:site_name"]);
    const title = scrapedTitle ||
      findMetaContent(html, ["og:title", "twitter:title"]) ||
      extractTitle(html);
    const description = scrapedDescription ||
      findMetaContent(html, ["og:description", "twitter:description", "description"]);
    const image = scrapedImage ||
      findMetaContent(html, ["og:image", "twitter:image"]);

    const result: LinkPreviewResult = {
      url: parsedUrl,
      siteName: siteName || undefined,
      title: title || undefined,
      description: description || undefined,
      previewImage: toAbsoluteUrl(image, parsedUrl) || undefined,
    };

    return jsonResponse(200, result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch metadata.";

    return jsonResponse(502, { error: message });
  } finally {
    clearTimeout(timeout);
  }
});
