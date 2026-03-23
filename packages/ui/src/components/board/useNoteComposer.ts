import { useMemo, useState, type ChangeEvent } from "react";
import {
  createNoteId,
  resolveNoteDefaults,
  useAppStore,
  type ImageNote,
  type LinkNote,
  type Note,
} from "@plumboard/core";

export type PlacementIntent = {
  type: Note["type"];
  width: number;
  height: number;
  create?: (position: { x: number; y: number }) => Note;
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
  const updateImageNote = useAppStore((state) => state.updateImageNote);
  const updateLinkNote = useAppStore((state) => state.updateLinkNote);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isResolvingLink, setIsResolvingLink] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [editingFileNote, setEditingFileNote] = useState<ImageNote | null>(null);
  const [editingLinkNote, setEditingLinkNote] = useState<LinkNote | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileCaption, setFileCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [linkError, setLinkError] = useState("");
  const [fileUploadError, setFileUploadError] = useState("");
  const [placementIntent, setPlacementIntent] = useState<PlacementIntent | null>(null);
  const [autoEditTextNoteId, setAutoEditTextNoteId] = useState<string | null>(null);
  const [pendingFilePosition, setPendingFilePosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingLinkPosition, setPendingLinkPosition] = useState<{ x: number; y: number } | null>(null);

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
        body: "",
      }),
    };
  }, []);

  const addFileNoteIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveNoteDefaults("image");

    return {
      type: "image",
      width,
      height,
    };
  }, []);

  const addLinkNoteIntent = useMemo<PlacementIntent>(() => {
    const { width, height } = resolveNoteDefaults("link");

    return {
      type: "link",
      width,
      height,
    };
  }, []);

  const closeFileComposer = () => {
    setIsAddingFile(false);
    setEditingFileNote(null);
    setPendingFilePosition(null);
    setPendingFile(null);
    setFileCaption("");
    setFileUploadError("");
  };

  const openFileComposer = ({
    position,
    note,
  }: {
    position?: { x: number; y: number } | null;
    note?: ImageNote | null;
  }) => {
    setIsAddingFile(true);
    setEditingFileNote(note ?? null);
    setPendingFilePosition(position ?? null);
    setPendingFile(null);
    setPlacementIntent(null);
    setFileCaption(note?.caption ?? "");
    setFileUploadError("");
  };

  const openLinkComposer = (position: { x: number; y: number } | null) => {
    setIsAddingLink(true);
    setEditingLinkNote(null);
    setPendingLinkPosition(position);
    setPlacementIntent(null);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkError("");
  };

  const closeLinkComposer = () => {
    setIsAddingLink(false);
    setEditingLinkNote(null);
    setPendingLinkPosition(null);
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setLinkError("");
  };

  const handleAddTextNote = () => {
    setPlacementIntent(addTextNoteIntent);
  };

  const handleAddTextNoteAtPosition = (position: { x: number; y: number }) => {
    if (!addTextNoteIntent.create) {
      return;
    }

    const nextNote = addTextNoteIntent.create(position);
    addNote(boardId, nextNote);
    setAutoEditTextNoteId(nextNote.id);
    setPlacementIntent(null);
  };

  const handleAddFile = () => {
    setFileUploadError("");
    setPendingFilePosition(null);
    setPlacementIntent(addFileNoteIntent);
  };

  const handleAddFileAtPosition = (position: { x: number; y: number }) => {
    openFileComposer({ position });
  };

  const handleAddLink = () => {
    setPlacementIntent(addLinkNoteIntent);
  };

  const handleAddLinkAtPosition = (position: { x: number; y: number }) => {
    openLinkComposer(position);
  };

  const handleEditFile = (note: ImageNote) => {
    openFileComposer({ note });
  };

  const handleEditLink = (note: LinkNote) => {
    setIsAddingLink(true);
    setEditingLinkNote(note);
    setPendingLinkPosition(null);
    setPlacementIntent(null);
    setLinkUrl(note.url);
    setLinkTitle(note.title);
    setLinkDescription(note.description ?? "");
    setLinkError("");
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    setPendingFile(nextFile);

    if (nextFile && !fileCaption.trim()) {
      setFileCaption(nextFile.name);
    }

    if (!nextFile && !editingFileNote) {
      setFileCaption("");
    }
  };

  const handleSaveFile = async () => {
    if (isUploadingFile) {
      return;
    }

    setFileUploadError("");
    const normalizedCaption = fileCaption.trim() || undefined;

    if (editingFileNote) {
      if (!pendingFile) {
        updateImageNote(boardId, editingFileNote.id, {
          caption: normalizedCaption,
        });
        closeFileComposer();
        return;
      }

      if (!onUploadImage) {
        setFileUploadError("File upload is not configured.");
        return;
      }

      setIsUploadingFile(true);
      try {
        const uploadedImage = await onUploadImage(pendingFile);
        updateImageNote(boardId, editingFileNote.id, {
          src: uploadedImage.src,
          alt: uploadedImage.alt ?? pendingFile.name ?? editingFileNote.alt,
          caption: normalizedCaption ?? uploadedImage.caption ?? pendingFile.name ?? undefined,
        });
        closeFileComposer();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not upload file.";
        setFileUploadError(message);
      } finally {
        setIsUploadingFile(false);
      }
      return;
    }

    if (!pendingFile) {
      setFileUploadError("Choose a file to continue.");
      return;
    }

    if (!onUploadImage) {
      setFileUploadError("File upload is not configured.");
      return;
    }

    if (!pendingFilePosition) {
      setFileUploadError("Pick a location for the file note first.");
      return;
    }

    setIsUploadingFile(true);
    try {
      const uploadedImage = await onUploadImage(pendingFile);
      const { width, height } = resolveNoteDefaults("image");

      addNote(boardId, {
        id: createNoteId("image"),
        type: "image",
        x: pendingFilePosition.x,
        y: pendingFilePosition.y,
        width,
        height,
        src: uploadedImage.src,
        alt: uploadedImage.alt ?? pendingFile.name ?? "Uploaded file",
        caption: normalizedCaption ?? uploadedImage.caption ?? pendingFile.name ?? undefined,
      });
      closeFileComposer();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload file.";
      setFileUploadError(message);
    } finally {
      setIsUploadingFile(false);
    }
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

      if (pendingLinkPosition) {
        addNote(boardId, {
          id: createNoteId("link"),
          type: "link",
          x: pendingLinkPosition.x,
          y: pendingLinkPosition.y,
          width,
          height: resolvedHeight,
          url: resolvedLink.url,
          siteName: resolvedLink.siteName,
          title: resolvedLink.title,
          description: resolvedLink.description,
          previewImage: resolvedLink.previewImage,
        });
        closeLinkComposer();
        return;
      }

      setLinkError("Pick where to place this link note first.");
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

    if (placementIntent.type === "image") {
      openFileComposer({ position });
      return;
    }

    if (placementIntent.type === "link") {
      openLinkComposer(position);
      return;
    }

    if (placementIntent.create) {
      const nextNote = placementIntent.create(position);
      addNote(boardId, nextNote);

      if (nextNote.type === "text") {
        setAutoEditTextNoteId(nextNote.id);
      }
    }

    setPlacementIntent(null);
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

  const handleAutoEditTextNoteHandled = (noteId: string) => {
    setAutoEditTextNoteId((current) => (current === noteId ? null : current));
  };

  return {
    isAddingFile,
    isAddingLink,
    isResolvingLink,
    isUploadingFile,
    isEditingFile: Boolean(editingFileNote),
    isEditingLink: Boolean(editingLinkNote),
    fileCaption,
    pendingFileName: pendingFile?.name ?? "",
    linkUrl,
    linkTitle,
    linkDescription,
    linkError,
    fileUploadError,
    placementIntent,
    autoEditTextNoteId,
    setFileCaption,
    setLinkUrl,
    setLinkTitle,
    setLinkDescription,
    closeFileComposer,
    closeLinkComposer,
    handleAddTextNote,
    handleAddTextNoteAtPosition,
    handleAddFile,
    handleAddFileAtPosition,
    handleAddLink,
    handleAddLinkAtPosition,
    handleEditFile,
    handleEditLink,
    handleFileInputChange,
    handleSaveFile,
    handleSaveLink,
    handlePlaceNote,
    handleDropFileAtPosition,
    handleDropLinkAtPosition,
    clearPlacementIntent,
    handleAutoEditTextNoteHandled,
  };
}
