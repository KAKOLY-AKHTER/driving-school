import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import "./AdminRichTextEditor.css";

const LEGACY_HTML_TAG = /<(?:p|br|h[1-6]|strong|em|u|s|ul|ol|li|blockquote|a|hr|pre|code)\b/i;

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizeEditorHtml = (value) => {
  const content = String(value || "").trim();
  if (!content) return "";
  if (LEGACY_HTML_TAG.test(content)) return content;
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
};

const ToolbarButton = ({ label, title, active = false, disabled = false, onClick }) => (
  <button
    type="button"
    className={`admin-rich-editor__button${active ? " is-active" : ""}`}
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
  >
    {label}
  </button>
);

export default function AdminRichTextEditor({
  id = "blog-content",
  value,
  onChange,
  maxCharacters = 30_000,
  required = false,
}) {
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Placeholder.configure({
        placeholder: "Start writing the full article here…",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: normalizeEditorHtml(value),
    editorProps: {
      attributes: {
        id,
        class: "admin-rich-editor__content",
        role: "textbox",
        "aria-label": "Article content",
        "aria-multiline": "true",
        ...(required ? { "aria-required": "true" } : {}),
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      setCharacterCount(currentEditor.getText().length);
    },
    onUpdate: ({ editor: currentEditor }) => {
      const textLength = currentEditor.getText().length;
      setCharacterCount(textLength);
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextContent = normalizeEditorHtml(value);
    const currentContent = editor.isEmpty ? "" : editor.getHTML();
    if (nextContent !== currentContent) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
      setCharacterCount(editor.getText().length);
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="admin-rich-editor admin-rich-editor--loading">Loading editor…</div>;
  }

  const applyLink = () => {
    const href = linkValue.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkEditorOpen(false);
  };

  const openLinkEditor = () => {
    setLinkValue(editor.getAttributes("link").href || "");
    setLinkEditorOpen(true);
  };

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor__toolbar" role="toolbar" aria-label="Article formatting">
        <select
          className="admin-rich-editor__select"
          aria-label="Text style"
          value={editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
          onChange={(event) => {
            const style = event.target.value;
            if (style === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (style === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
            else editor.chain().focus().setParagraph().run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <span className="admin-rich-editor__group" aria-label="Text formatting">
          <ToolbarButton label={<strong>B</strong>} title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolbarButton label={<em>I</em>} title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolbarButton label={<u>U</u>} title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
          <ToolbarButton label={<s>S</s>} title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        </span>

        <span className="admin-rich-editor__group" aria-label="Lists and quote">
          <ToolbarButton label="• List" title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolbarButton label="1. List" title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolbarButton label="❝" title="Block quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        </span>

        <span className="admin-rich-editor__group" aria-label="Alignment">
          <ToolbarButton label="L" title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
          <ToolbarButton label="C" title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
          <ToolbarButton label="R" title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        </span>

        <span className="admin-rich-editor__group" aria-label="Insert">
          <ToolbarButton label="🔗" title="Add or edit link" active={editor.isActive("link")} onClick={openLinkEditor} />
          <ToolbarButton label="—" title="Insert divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        </span>

        <span className="admin-rich-editor__group" aria-label="History">
          <ToolbarButton label="↶" title="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()} />
          <ToolbarButton label="↷" title="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()} />
        </span>
      </div>

      {linkEditorOpen && (
        <div className="admin-rich-editor__link-panel">
          <label htmlFor={`${id}-link`}>Link address</label>
          <input
            id={`${id}-link`}
            type="url"
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") setLinkEditorOpen(false);
            }}
            placeholder="https://example.com"
            autoFocus
          />
          <button type="button" onClick={applyLink}>Apply link</button>
          {editor.isActive("link") && (
            <button
              type="button"
              className="admin-rich-editor__unlink"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setLinkEditorOpen(false);
              }}
            >
              Remove link
            </button>
          )}
          <button type="button" className="admin-rich-editor__link-cancel" onClick={() => setLinkEditorOpen(false)}>Cancel</button>
        </div>
      )}

      <EditorContent editor={editor} />
      <div className={`admin-rich-editor__footer${characterCount > maxCharacters ? " is-over-limit" : ""}`}>
        <span>Tip: use headings and short paragraphs to make the article easy to scan.</span>
        <strong>{characterCount.toLocaleString()} / {maxCharacters.toLocaleString()}</strong>
      </div>
    </div>
  );
}
