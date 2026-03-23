const IMAGE_FILE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jfif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
]);

function resolveSrcExtension(src: string) {
  const trimmedSrc = src.trim();
  if (!trimmedSrc) {
    return "";
  }

  const resolvePathname = () => {
    try {
      return new URL(trimmedSrc).pathname;
    } catch {
      return trimmedSrc;
    }
  };

  const pathname = resolvePathname().toLowerCase();
  const extension = pathname.split(".").pop()?.split("?")[0]?.split("#")[0];

  if (!extension || extension === pathname) {
    return "";
  }

  return extension;
}

export function canRenderImagePreview(src: string) {
  const trimmedSrc = src.trim();
  if (!trimmedSrc) {
    return false;
  }

  const normalizedSrc = trimmedSrc.toLowerCase();
  if (normalizedSrc.startsWith("data:image/")) {
    return true;
  }

  if (normalizedSrc.startsWith("blob:")) {
    return true;
  }

  const extension = resolveSrcExtension(trimmedSrc);

  if (!extension) {
    return true;
  }

  return IMAGE_FILE_EXTENSIONS.has(extension);
}

export function canRenderPdfPreview(src: string) {
  const trimmedSrc = src.trim();
  if (!trimmedSrc) {
    return false;
  }

  const normalizedSrc = trimmedSrc.toLowerCase();
  if (normalizedSrc.startsWith("data:application/pdf")) {
    return true;
  }

  return resolveSrcExtension(trimmedSrc) === "pdf";
}
