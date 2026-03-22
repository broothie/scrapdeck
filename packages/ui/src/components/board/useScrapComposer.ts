import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { createScrapId, resolveScrapDefaults, useAppStore, type Scrap } from "@scrapdeck/core";

export type PlacementIntent = {
  type: Scrap["type"];
  width: number;
  height: number;
  create: (position: { x: number; y: number }) => Scrap;
};

type UploadImageFn = (file: File) => Promise<{
  src: string;
  alt?: string;
  caption?: string;
}>;

type ResolveLinkPreviewFn = (url: string) => Promise<{
  url?: string;
  siteName?: string;
  title?: string;
  description?: string;
  previewImage?: string;
}>;

type UseScrapComposerOptions = {
  boardId: string;
  onUploadImage?: UploadImageFn;
  onResolveLinkPreview?: ResolveLinkPreviewFn;
};

function hasMeaningfulTitle(value: string) {
  const alphanumericCount = (value.match(/[A-Za-z0-9]/g) ?? []).length;
  return alphanumericCount >= 3;
}

export function useScrapComposer({
  boardId,
  onUploadImage,
  onResolveLinkPreview,
}: UseScrapComposerOptions) {
  const addScrap = useAppStore((state) => state.addScrap);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [fileUploadError, setFileUploadError] = useState("");
  const [placementIntent, setPlacementIntent] = useState<PlacementIntent | null>(null);

  const addNoteIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveScrapDefaults("note");

    return {
      type: "note",
      width,
      height,
      create: ({ x, y }: { x: number; y: number }) => ({
        id: createScrapId("note"),
        type: "note",
        x,
        y,
        width,
        height,
        body: "<p>Drop quick thoughts here and drag them into place.</p>",
      }),
    };
  }, []);

  const closeLinkComposer = () => {
    setIsAddingLink(false);
    setLinkUrl("");
    setLinkError("");
  };

  const handleAddNote = () => {
    setPlacementIntent(addNoteIntent);
  };

  const handleAddFile = () => {
    if (!imageInputRef.current) {
      return;
    }

    setFileUploadError("");
    imageInputRef.current.click();
  };

  const handleAddLink = () => {
    setIsAddingLink(true);
    setLinkError("");
  };

  const handleSaveLink = async () => {
    if (isResolvingLink) {
      return;
    }

    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      setLinkError("Enter a URL to save.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setLinkError("Enter a valid URL, including https://");
      return;
    }

    setLinkError("");
    setIsResolvingLink(true);
    try {
      let metadata:
        | {
            url?: string;
            siteName?: string;
            title?: string;
            description?: string;
            previewImage?: string;
          }
        | undefined;

      if (onResolveLinkPreview) {
        try {
          metadata = await onResolveLinkPreview(parsedUrl.toString());
        } catch {
          metadata = undefined;
        }
      }

      const resolvedUrl = metadata?.url ? metadata.url.trim() : "";
      const normalizedUrl = resolvedUrl || parsedUrl.toString();
      const safeUrl = (() => {
        try {
          return new URL(normalizedUrl).toString();
        } catch {
          return parsedUrl.toString();
        }
      })();

      const safeParsedUrl = new URL(safeUrl);
      const hostname = safeParsedUrl.hostname.replace(/^www\./, "");
      const path = safeParsedUrl.pathname === "/" ? "" : safeParsedUrl.pathname;
      const summary = [hostname, path].filter(Boolean).join("");

      const metadataTitle = metadata?.title?.trim() || "";
      const title = hasMeaningfulTitle(metadataTitle) ? metadataTitle : (summary || safeUrl);
      const description = metadata?.description?.trim() || undefined;
      const siteName = metadata?.siteName?.trim() || hostname || "Saved Link";
      const previewImage = metadata?.previewImage?.trim() || undefined;

      const { width, height } = resolveScrapDefaults("link");
      const resolvedHeight = previewImage ? height : 148;

      setPlacementIntent({
        type: "link",
        width,
        height: resolvedHeight,
        create: ({ x, y }) => ({
          id: createScrapId("link"),
          type: "link",
          x,
          y,
          width,
          height: resolvedHeight,
          url: safeUrl,
          siteName,
          title,
          description,
          previewImage,
        }),
      });

      closeLinkComposer();
    } finally {
      setIsResolvingLink(false);
    }
  };

  const handlePlaceScrap = (position: { x: number; y: number }) => {
    if (!placementIntent) {
      return;
    }

    addScrap(boardId, placementIntent.create(position));
    setPlacementIntent(null);
  };

  const handleImageFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!onUploadImage) {
      setFileUploadError("File upload is not configured.");
      return;
    }

    setIsUploadingFile(true);
    setFileUploadError("");

    try {
      const uploadedImage = await onUploadImage(file);
      const { width, height } = resolveScrapDefaults("image");

      setPlacementIntent({
        type: "image",
        width,
        height,
        create: ({ x, y }: { x: number; y: number }) => ({
          id: createScrapId("image"),
          type: "image",
          x,
          y,
          width,
          height,
          src: uploadedImage.src,
          alt: uploadedImage.alt ?? file.name ?? "Uploaded file",
          caption: uploadedImage.caption ?? file.name ?? undefined,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload file.";
      setFileUploadError(message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const clearPlacementIntent = () => {
    setPlacementIntent(null);
  };

  return {
    imageInputRef,
    isAddingLink,
    isResolvingLink,
    isUploadingFile,
    linkUrl,
    linkError,
    fileUploadError,
    placementIntent,
    setLinkUrl,
    closeLinkComposer,
    handleAddNote,
    handleAddFile,
    handleAddLink,
    handleSaveLink,
    handleImageFileChange,
    handlePlaceScrap,
    clearPlacementIntent,
  };
}
