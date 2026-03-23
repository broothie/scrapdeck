import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
  type LucideIcon,
} from "lucide-react";
import { Card, XStack, YStack, useTheme } from "tamagui";
import { useAppStore, type TextNote } from "@plumboard/core";

type TextNoteCardProps = {
  boardId: string;
  note: TextNote;
  onAutoGrowHeight: (nextHeight: number) => void;
};

const NOTE_OUTER_PADDING_TOP_REM = 0.1;
const NOTE_OUTER_PADDING_BOTTOM_REM = 0.65;
const NOTE_INNER_PADDING_TOP_REM = 0.28;
const NOTE_INNER_PADDING_SIDE_REM = 0.55;
const NOTE_INNER_PADDING_BOTTOM_REM = 0.5;

type ToolbarAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
};

export function TextNoteCard({ boardId, note, onAutoGrowHeight }: TextNoteCardProps) {
  const theme = useTheme();
  const updateTextNote = useAppStore((state) => state.updateTextNote);
  const [isEditing, setIsEditing] = useState(false);
  const [toolbarOffsetX, setToolbarOffsetX] = useState(0);
  const readBodyRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const autoGrowFrameRef = useRef<number | null>(null);
  const normalizedBody = normalizeNoteBodyForEditor(note.body);

  const autoGrowIfNeeded = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return;
    }

    const rootFontSize = typeof window !== "undefined"
      ? Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
      : 16;
    const remSize = Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16;
    const shellVerticalPadding = (NOTE_OUTER_PADDING_TOP_REM + NOTE_OUTER_PADDING_BOTTOM_REM) * remSize;
    const cardBorderThickness = 2;
    const nextHeight = Math.ceil(element.scrollHeight + shellVerticalPadding + cardBorderThickness);

    if (nextHeight <= note.height + 2) {
      return;
    }

    onAutoGrowHeight(nextHeight);
  }, [onAutoGrowHeight, note.height]);
  const scheduleAutoGrow = useCallback((element: HTMLElement | null) => {
    if (autoGrowFrameRef.current !== null) {
      cancelAnimationFrame(autoGrowFrameRef.current);
    }

    autoGrowFrameRef.current = requestAnimationFrame(() => {
      autoGrowIfNeeded(element);
    });
  }, [autoGrowIfNeeded]);
  const recalculateToolbarOffset = useCallback(() => {
    if (!isEditing || !toolbarRef.current) {
      return;
    }

    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    const flowPane = toolbarRef.current.closest(".plumboard-flow");

    if (!(flowPane instanceof HTMLElement)) {
      return;
    }

    const paneRect = flowPane.getBoundingClientRect();
    const inset = 8;
    let delta = 0;

    if (toolbarRect.left < paneRect.left + inset) {
      delta = paneRect.left + inset - toolbarRect.left;
    } else if (toolbarRect.right > paneRect.right - inset) {
      delta = paneRect.right - inset - toolbarRect.right;
    }

    if (Math.abs(delta) < 0.5) {
      return;
    }

    setToolbarOffsetX((previousOffset) => previousOffset + delta);
  }, [isEditing]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        horizontalRule: false,
      }),
    ],
    content: normalizedBody,
    onUpdate({ editor: currentEditor }) {
      const nextBody = currentEditor.getHTML();
      scheduleAutoGrow(currentEditor.view.dom as HTMLElement | null);

      if (nextBody === note.body) {
        return;
      }

      updateTextNote(boardId, note.id, {
        body: nextBody,
      });
    },
    editorProps: {
      attributes: {
        class: "nodrag nopan plumboard-note-prose",
        style: [
          "height:100%",
          "min-height:0",
          `padding:${NOTE_INNER_PADDING_TOP_REM}rem ${NOTE_INNER_PADDING_SIDE_REM}rem ${NOTE_INNER_PADDING_BOTTOM_REM}rem`,
          "outline:none",
          "border:none",
          "border-radius:0",
          "background:transparent",
          `color:${theme.textPrimary.val}`,
          "font:inherit",
          "line-height:1.35",
          "overflow:auto",
          "white-space:pre-wrap",
          "word-break:break-word",
        ].join(";"),
      },
    },
    immediatelyRender: false,
    editable: false,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (editor.getHTML() !== normalizedBody) {
      editor.commands.setContent(normalizedBody, { emitUpdate: false });
    }
  }, [editor, normalizedBody]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(isEditing);

    if (isEditing) {
      requestAnimationFrame(() => {
        editor.commands.focus("end");
      });
    }
  }, [editor, isEditing]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handleBlur = () => {
      setIsEditing(false);
    };

    editor.on("blur", handleBlur);

    return () => {
      editor.off("blur", handleBlur);
    };
  }, [editor]);

  useEffect(() => {
    const target =
      isEditing
        ? (editor?.view.dom as HTMLElement | null)
        : readBodyRef.current;

    scheduleAutoGrow(target);

    return () => {
      if (autoGrowFrameRef.current !== null) {
        cancelAnimationFrame(autoGrowFrameRef.current);
      }
    };
  }, [editor, isEditing, normalizedBody, scheduleAutoGrow, note.body]);

  useEffect(() => {
    if (!editor || !isEditing) {
      return;
    }

    const handleEditorUpdate = () => {
      scheduleAutoGrow(editor.view.dom as HTMLElement | null);
    };

    editor.on("update", handleEditorUpdate);

    return () => {
      editor.off("update", handleEditorUpdate);
    };
  }, [editor, isEditing, scheduleAutoGrow]);

  useEffect(() => {
    if (!isEditing) {
      setToolbarOffsetX(0);
      return;
    }

    const frame = requestAnimationFrame(() => {
      recalculateToolbarOffset();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    editor,
    isEditing,
    normalizedBody,
    recalculateToolbarOffset,
    note.height,
    note.width,
    note.x,
    note.y,
  ]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const handleResize = () => {
      recalculateToolbarOffset();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isEditing, recalculateToolbarOffset]);

  const toolbarActions: ToolbarAction[] = [
    {
      key: "title",
      label: "Title",
      icon: Heading1,
      isActive: editor?.isActive("heading", { level: 1 }) ?? false,
      onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      key: "heading",
      label: "Heading",
      icon: Heading2,
      isActive: editor?.isActive("heading", { level: 2 }) ?? false,
      onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "subheading",
      label: "Subheading",
      icon: Heading3,
      isActive: editor?.isActive("heading", { level: 3 }) ?? false,
      onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: "bold",
      label: "Bold",
      icon: Bold,
      isActive: editor?.isActive("bold") ?? false,
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      label: "Italic",
      icon: Italic,
      isActive: editor?.isActive("italic") ?? false,
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "code",
      label: "Inline code",
      icon: Code,
      isActive: editor?.isActive("code") ?? false,
      onClick: () => editor?.chain().focus().toggleCode().run(),
    },
    {
      key: "code-block",
      label: "Code block",
      icon: FileCode2,
      isActive: editor?.isActive("codeBlock") ?? false,
      onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      key: "bullets",
      label: "Bullets",
      icon: List,
      isActive: editor?.isActive("bulletList") ?? false,
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      key: "numbered",
      label: "Numbered list",
      icon: ListOrdered,
      isActive: editor?.isActive("orderedList") ?? false,
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "strike",
      label: "Strikethrough",
      icon: Strikethrough,
      isActive: editor?.isActive("strike") ?? false,
      onClick: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      key: "quote",
      label: "Quote",
      icon: TextQuote,
      isActive: editor?.isActive("blockquote") ?? false,
      onClick: () => editor?.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "visible",
      }}
    >
      <Card
        height="100%"
        style={{ borderRadius: 9, borderWidth: 1, borderColor: theme.borderSubtle.val }}
      >
        <YStack
          gap="$0"
          height="100%"
          style={{
            padding: `${NOTE_OUTER_PADDING_TOP_REM}rem 0.7rem ${NOTE_OUTER_PADDING_BOTTOM_REM}rem`,
          }}
        >
          {isEditing ? (
            <div
              className="nodrag nopan"
              style={{ flex: 1, minHeight: 0 }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <EditorContent editor={editor} />
            </div>
          ) : (
            <div
              ref={readBodyRef}
              className="plumboard-note-prose"
              style={{
                flex: 1,
                minHeight: 0,
                padding: `${NOTE_INNER_PADDING_TOP_REM}rem ${NOTE_INNER_PADDING_SIDE_REM}rem ${NOTE_INNER_PADDING_BOTTOM_REM}rem`,
                color: theme.textPrimary.val,
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                wordBreak: "break-word",
                cursor: "grab",
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: normalizedBody }}
            />
          )}
        </YStack>
      </Card>
      {isEditing ? (
        <div
          ref={toolbarRef}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "calc(100% + 8px)",
            transform: `translateX(calc(-50% + ${toolbarOffsetX}px))`,
            zIndex: 4,
            maxWidth: "min(calc(100vw - 24px), 40rem)",
            width: "max-content",
          }}
        >
        <XStack
          className="nodrag nopan"
          style={{
            gap: "0.35rem",
            flexWrap: "nowrap",
            alignItems: "center",
            padding: "0.3rem 0.35rem",
            borderRadius: 8,
            border: `1px solid ${theme.borderDefault.val}`,
            backgroundColor: theme.surface.val,
            boxShadow: "0 6px 18px rgba(5, 8, 14, 0.16)",
            maxWidth: "min(calc(100vw - 24px), 40rem)",
            width: "max-content",
            overflowX: "auto",
            overflowY: "hidden",
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {toolbarActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.key}
                type="button"
                className="nodrag nopan"
                aria-label={action.label}
                title={action.label}
                style={toolbarButtonStyle({
                  isActive: action.isActive,
                  activeBackground: theme.accentSubtle.val,
                  background: theme.surface.val,
                  border: theme.borderDefault.val,
                  color: theme.textPrimary.val,
                })}
                onMouseDown={(event) => event.preventDefault()}
                onClick={action.onClick}
              >
                <Icon size={14} strokeWidth={2.2} />
              </button>
            );
          })}
        </XStack>
        </div>
      ) : null}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeNoteBodyForEditor(body: string) {
  if (!body.trim()) {
    return "<p></p>";
  }

  if (/<\/?[a-z][\s\S]*>/i.test(body)) {
    return body;
  }

  return `<p>${escapeHtml(body).replace(/\n/g, "<br/>")}</p>`;
}

function toolbarButtonStyle(options: {
  isActive: boolean;
  activeBackground: string;
  background: string;
  border: string;
  color: string;
}) {
  return {
    width: 30,
    height: 30,
    padding: 0,
    borderRadius: 4,
    border: `1px solid ${options.border}`,
    backgroundColor: options.isActive ? options.activeBackground : options.background,
    color: options.color,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    lineHeight: 1,
    flexShrink: 0,
  } as const;
}
