"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { useRef, useState } from "react";

type RichTextEditorProps = {
  // Initial HTML content. The editor is uncontrolled after mount — it owns its
  // own state and reports changes via onChange. Changing this prop later does
  // NOT reset the editor (that would fight the user's cursor).
  initialHTML: string;
  onChange: (html: string) => void;
};

export function RichTextEditor({ initialHTML, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    // Required for Next.js / SSR — avoids a hydration mismatch on first render.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener", target: "_blank" },
        },
      }),
      Highlight,
      Image.configure({
        HTMLAttributes: { class: "article-inline-image" },
      }),
    ],
    content: initialHTML,
    editorProps: {
      attributes: {
        // Reuse the live-site classes so the editor is true WYSIWYG.
        class:
          "prose-editorial article-body text-ink/85 min-h-[28rem] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="border-stone text-ink/40 mt-2 rounded-xl border p-4 text-sm">
        Loading editor…
      </div>
    );
  }

  function toggleLink() {
    if (editor!.isActive("link")) {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL:", previous ?? "https://");
    if (url === null) return; // cancelled
    if (url.trim() === "") {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    editor!
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/articles/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        window.alert(data.error || "Image upload failed. Try again.");
        return;
      }
      editor!.chain().focus().setImage({ src: data.url }).run();
    } catch {
      window.alert("Couldn't reach the server. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  const menuClass =
    "border-stone z-50 flex flex-wrap items-center gap-0.5 rounded-lg border bg-white p-1 shadow-lg";

  return (
    <div className="border-stone mt-2 rounded-xl border bg-white px-4 py-4">
      <EditorContent editor={editor} />

      {/* Selection bubble — formatting for the text you've highlighted */}
      <BubbleMenu
        editor={editor}
        className={menuClass}
        shouldShow={({ editor, state }) => {
          const { from, to } = state.selection;
          return from !== to && editor.isEditable && !editor.isActive("image");
        }}
      >
        <MenuButton
          label="H2"
          title="Headline"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <MenuButton
          label="H3"
          title="Subheadline"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <Divider />
        <MenuButton
          label="B"
          title="Bold"
          className="font-bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <MenuButton
          label="I"
          title="Italic"
          className="italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <MenuButton
          label="U"
          title="Underline"
          className="underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <MenuButton
          label="Highlight"
          title="Highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        />
        <Divider />
        <MenuButton
          label="🔗 Link"
          title="Add or remove link"
          active={editor.isActive("link")}
          onClick={toggleLink}
        />
      </BubbleMenu>

      {/* Inline insert menu — appears on an empty line */}
      <FloatingMenu
        editor={editor}
        className={menuClass}
        shouldShow={({ editor, state }) => {
          const { $from, empty } = state.selection;
          return (
            editor.isEditable &&
            empty &&
            $from.parent.type.name === "paragraph" &&
            $from.parent.content.size === 0
          );
        }}
      >
        <MenuButton
          label="H2"
          title="Headline"
          active={false}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <MenuButton
          label="H3"
          title="Subheadline"
          active={false}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        />
        <Divider />
        <MenuButton
          label="• List"
          title="Bullet list"
          active={false}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <MenuButton
          label="1. List"
          title="Numbered list"
          active={false}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <MenuButton
          label="❝ Quote"
          title="Block quote"
          active={false}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <Divider />
        <MenuButton
          label={uploading ? "Uploading…" : "🖼 Image"}
          title="Insert image"
          active={false}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        />
      </FloatingMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
    </div>
  );
}

function MenuButton({
  label,
  title,
  active,
  onClick,
  className = "",
  disabled = false,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2.5 py-1.5 text-sm transition ${
        active
          ? "bg-sage text-white"
          : "text-ink/70 hover:bg-stone/40 hover:text-ink"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${className}`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="bg-stone mx-0.5 h-5 w-px" aria-hidden />;
}
