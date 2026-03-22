export function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function extractAttribute(tag: string, key: string) {
  const pattern = new RegExp(`${key}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);
  const raw = match?.[2] ?? match?.[3] ?? match?.[4];

  if (!raw) {
    return "";
  }

  return decodeEntities(raw.trim());
}

export function findMetaContent(html: string, keys: string[]) {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];
  const keySet = new Set(keys.map((key) => key.toLowerCase()));

  for (const tag of metaTags) {
    const propertyValue = extractAttribute(tag, "property").toLowerCase();
    const nameValue = extractAttribute(tag, "name").toLowerCase();
    const contentValue = normalizeWhitespace(extractAttribute(tag, "content"));

    if (!contentValue) {
      continue;
    }

    if (keySet.has(propertyValue) || keySet.has(nameValue)) {
      return contentValue;
    }
  }

  return "";
}

export function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch?.[1]) {
    return "";
  }

  return normalizeWhitespace(decodeEntities(titleMatch[1]));
}

export function toAbsoluteUrl(candidateUrl: string, baseUrl: string) {
  if (!candidateUrl) {
    return "";
  }

  try {
    return new URL(candidateUrl, baseUrl).toString();
  } catch {
    return "";
  }
}

export function sanitizeUrl(input: string) {
  const parsed = new URL(input);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs are supported.");
  }

  return parsed.toString();
}
