import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  createNoteId,
  resolveNoteDefaults,
  useAppStore,
  type LinkNote,
  type Note,
} from "@plumboard/core";

export type PlacementIntent = {
  type: Note["type"];
  width: number;
  height: number;
  create: (position: { x: number; y: number }) => Note;
};

type LinkDraft = {
  url: string;
  siteName: string;
  title: string;
  description?: string;
  previewImage?: string;
  height: number;
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

type UseNoteComposerOptions = {
  boardId: string;
  onUploadImage?: UploadImageFn;
  onResolveLinkPreview?: ResolveLinkPreviewFn;
};

function hasMeaningfulTitle(value: string) {
  const alphanumericCount = (value.match(/[A-Za-z0-9]/g) ?? []).length;
  return alphanumericCount >= 3;
}

export function useNoteComposer({
  boardId,
  onUploadImage,
  onResolveLinkPreview,
}: UseNoteComposerOptions) {
  const addNote = useAppStore((state) => state.addNote);
  const updateLinkNote = useAppStore((state) => state.updateLinkNote);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [editingLinkNote, setEditingLinkNote] = useState<LinkNote | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkError, setLinkError] = useState("");
  const [fileUploadError, setFileUploadError] = useState("");
  const [placementIntent, setPlacementIntent] = useState<PlacementIntent | null>(null);

  const addTextNoteIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveNoteDefaults("text");

    return {
      type: "text",
      width,
      height,
      create: ({ x, y }: { x: number; y: number }) => ({
        id: createNoteId("text"),
        type: "text",
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
    setEditingLinkNote(null);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkError("");
  };

  const handleAddTextNote = () => {
    setPlacementIntent(addTextNoteIntent);
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
    setEditingLinkNote(null);
    setPlacementIntent(null);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkError("");
  };

  const handleEditLink = (note: LinkNote) => {
    setIsAddingLink(true);
    setEditingLinkNote(note);
    setPlacementIntent(null);
    setLinkUrl(note.url);
    setLinkTitle(note.title);
    setLinkDescription(note.description ?? "");
    setLinkError("");
  };

  const handleSaveLink = async () => {
    if (isResolvingLink) {
      return;
    }

    setLinkError("");
    setIsResolvingLink(true);
    try {
      const resolvedLink = await resolveLinkDraft({
        rawUrl: linkUrl,
        titleOverride: linkTitle,
        descriptionOverride: linkDescription,
        existingNote: editingLinkNote,
      });

      if (editingLinkNote) {
        updateLinkNote(boardId, editingLinkNote.id, {
          url: resolvedLink.url,
          siteName: resolvedLink.siteName,
          title: resolvedLink.title,
          description: resolvedLink.description,
          previewImage: resolvedLink.previewImage || (resolvedLink.url === editingLinkNote.url
            ? editingLinkNote.previewImage
            : undefined),
        });
        closeLinkComposer();
        return;
      }

      const { width, height } = resolveNoteDefaults("link");
      const resolvedHeight = resolvedLink.previewImage ? height : 148;

      setPlacementIntent({
        type: "link",
        width,
        height: resolvedHeight,
        create: ({ x, y }) => ({
          id: createNoteId("link"),
          type: "link",
          x,
          y,
          width,
          height: resolvedHeight,
          url: resolvedLink.url,
          siteName: resolvedLink.siteName,
          title: resolvedLink.title,
          description: resolvedLink.description,
          previewImage: resolvedLink.previewImage,
        }),
      });

      closeLinkComposer();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save link note.";
      setLinkError(message);
    } finally {
      setIsResolvingLink(false);
    }
  };

  const handlePlaceNote = (position: { x: number; y: number }) => {
    if (!placementIntent) {
      return;
    }

    addNote(boardId, placementIntent.create(position));
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
      const { width, height } = resolveNoteDefaults("image");

      setPlacementIntent({
        type: "image",
        width,
        height,
        create: ({ x, y }: { x: number; y: number }) => ({
          id: createNoteId("image"),
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

  const resolveLinkDraft = async ({
    rawUrl,
    titleOverride,
    descriptionOverride,
    existingNote,
  }: {
    rawUrl: string;
    titleOverride?: string;
    descriptionOverride?: string;
    existingNote?: LinkNote | null;
  }): Promise<LinkDraft> => {
    const trimmedUrl = rawUrl.trim();

    if (!trimmedUrl) {
      throw new Error("Enter a URL to save.");
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      throw new Error("Enter a valid URL, including https://");
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Only http(s) URLs are supported.");
    }

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
        const url = new URL(normalizedUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return parsedUrl.toString();
        }

        return url.toString();
      } catch {
        return parsedUrl.toString();
      }
    })();

    const safeParsedUrl = new URL(safeUrl);
    const hostname = safeParsedUrl.hostname.replace(/^www\./, "");
    const path = safeParsedUrl.pathname === "/" ? "" : safeParsedUrl.pathname;
    const summary = [hostname, path].filter(Boolean).join("");

    const metadataTitle = metadata?.title?.trim() || "";
    const manualTitle = (titleOverride ?? "").trim();
    const manualDescription = (descriptionOverride ?? "").trim();
    const title = manualTitle
      || (hasMeaningfulTitle(metadataTitle) ? metadataTitle : (summary || safeUrl));
    const description = manualDescription || metadata?.description?.trim() || undefined;
    const siteName = metadata?.siteName?.trim()
      || hostname
      || existingNote?.siteName
      || "Saved Link";
    const previewImage = metadata?.previewImage?.trim() || undefined;
    const { height } = resolveNoteDefaults("link");
    const resolvedHeight = previewImage ? height : 148;

    return {
      url: safeUrl,
      siteName,
      title,
      description,
      previewImage,
      height: resolvedHeight,
    };
  };

  const handleDropFileAtPosition = async (file: File, position: { x: number; y: number }) => {
    if (!onUploadImage) {
      setFileUploadError("File upload is not configured.");
      return;
    }

    setPlacementIntent(null);
    setFileUploadError("");
    setIsUploadingFile(true);

    try {
      const uploadedImage = await onUploadImage(file);
      const { width, height } = resolveNoteDefaults("image");

      addNote(boardId, {
        id: createNoteId("image"),
        type: "image",
        x: position.x,
        y: position.y,
        width,
        height,
        src: uploadedImage.src,
        alt: uploadedImage.alt ?? file.name ?? "Uploaded file",
        caption: uploadedImage.caption ?? file.name ?? undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload file.";
      setFileUploadError(message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDropLinkAtPosition = async (url: string, position: { x: number; y: number }) => {
    setPlacementIntent(null);
    setFileUploadError("");
    setIsResolvingLink(true);

    try {
      const resolvedLink = await resolveLinkDraft({ rawUrl: url });
      const { width } = resolveNoteDefaults("link");

      addNote(boardId, {
        id: createNoteId("link"),
        type: "link",
        x: position.x,
        y: position.y,
        width,
        height: resolvedLink.height,
        url: resolvedLink.url,
        siteName: resolvedLink.siteName,
        title: resolvedLink.title,
        description: resolvedLink.description,
        previewImage: resolvedLink.previewImage,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not create link note.";
      setFileUploadError(message);
    } finally {
      setIsResolvingLink(false);
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
    isEditingLink: Boolean(editingLinkNote),
    linkUrl,
    linkTitle,
    linkDescription,
    linkError,
    fileUploadError,
    placementIntent,
    setLinkUrl,
    setLinkTitle,
    setLinkDescription,
    closeLinkComposer,
    handleAddTextNote,
    handleAddFile,
    handleAddLink,
    handleEditLink,
    handleSaveLink,
    handleImageFileChange,
    handlePlaceNote,
    handleDropFileAtPosition,
    handleDropLinkAtPosition,
    clearPlacementIntent,
  };
}
