import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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

type LinkPreviewPayload = { url?: unknown };
type LinkPreviewResult = {
  url: string;
  siteName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
};

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
      headers: {
        "user-agent": "PlumboardLinkPreviewBot/1.0",
        "accept-language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return jsonResponse(502, { error: `Could not fetch URL (${response.status}).` });
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("text/html")) {
      return jsonResponse(200, { url: response.url || requestUrl });
    }

    const html = (await response.text()).slice(0, 2_000_000);

    const siteName = findMetaContent(html, ["og:site_name"]);
    const title = findMetaContent(html, ["og:title", "twitter:title"]) || extractTitle(html);
    const description = findMetaContent(html, ["og:description", "twitter:description", "description"]);
    const image = findMetaContent(html, ["og:image", "twitter:image"]);

    const result: LinkPreviewResult = {
      url: response.url || requestUrl,
      siteName: siteName || undefined,
      title: title || undefined,
      description: description || undefined,
      previewImage: toAbsoluteUrl(image, response.url || requestUrl) || undefined,
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
