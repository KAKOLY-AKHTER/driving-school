import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import AdminDeleteIconButton from "./AdminDeleteIconButton";
import AdminRichTextEditor from "./AdminRichTextEditor";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Driving Tips",
  author: "A Precision Driving School",
  imageUrl: "",
  imagePublicId: "",
  published: false,
  featured: false,
  publishedAt: "",
  order: 0,
};

const MAX_BLOG_IMAGE_BYTES = 4 * 1024 * 1024;
const BLOG_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const localDateTimeValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const displayDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not scheduled"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const publicationState = (post) => {
  if (!post?.published) {
    return { label: "Draft", live: false, background: "#F1F5F9", color: "#64748B" };
  }
  const publicationTime = Date.parse(post.publishedAt);
  if (Number.isFinite(publicationTime) && publicationTime > Date.now()) {
    return { label: "Scheduled", live: false, background: "#FEF3C7", color: "#A16207" };
  }
  return { label: "Live", live: true, background: "#DCFCE7", color: "#15803D" };
};

export default function AdminBlogPanel({
  cardStyle,
  inputStyle,
  labelStyle,
  thStyle,
  tdStyle,
  requestConfirmation,
  setMessage,
}) {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .adminBlogs()
      .then((data) => {
        if (active) setPosts(Array.isArray(data) ? data : []);
      })
      .catch((loadError) => {
        if (active)
          setError(loadError?.message || "Blog posts could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesSearch =
        !query ||
        [post.title, post.slug, post.category, post.author, post.excerpt].some(
          (value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
        );
      const matchesVisibility =
        visibility === "all" ||
        (visibility === "published" ? post.published : !post.published);
      return matchesSearch && matchesVisibility;
    });
  }, [posts, search, visibility]);
  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const safePage = Math.min(page, pages);
  const visiblePosts = filtered.slice((safePage - 1) * limit, safePage * limit);

  const reset = () => {
    setEditingId("");
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setImageInputKey((current) => current + 1);
    setError("");
  };

  const selectImage = (file) => {
    if (!file) return;
    if (!BLOG_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      setImageInputKey((current) => current + 1);
      return;
    }
    if (file.size > MAX_BLOG_IMAGE_BYTES) {
      setError("The blog image must be 4 MB or smaller.");
      setImageInputKey((current) => current + 1);
      return;
    }
    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setImageInputKey((current) => current + 1);
    setForm((current) => ({ ...current, imageUrl: "", imagePublicId: "" }));
  };

  const editPost = (post) => {
    setEditingId(String(post._id || ""));
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "Driving Tips",
      author: post.author || "A Precision Driving School",
      imageUrl: post.imageUrl || "",
      imagePublicId: post.imagePublicId || "",
      published: Boolean(post.published),
      featured: Boolean(post.featured),
      publishedAt: localDateTimeValue(post.publishedAt),
      order: Number(post.order) || 0,
    });
    setImageFile(null);
    setImagePreview(post.imageUrl || "");
    setImageInputKey((current) => current + 1);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const savePost = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Blog title and content are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let imageUrl = form.imageUrl.trim();
      let imagePublicId = form.imagePublicId.trim();
      if (imageFile) {
        setUploadingImage(true);
        const uploaded = await api.adminUploadBlogImage(imageFile);
        imageUrl = uploaded?.imageUrl || "";
        imagePublicId = uploaded?.imagePublicId || "";
        if (!imageUrl || !imagePublicId) throw new Error("The image upload did not return a usable image.");
      }
      const payload = {
        ...form,
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        category: form.category.trim(),
        author: form.author.trim(),
        imageUrl,
        imagePublicId,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : "",
        order: Number(form.order) || 0,
      };
      if (editingId) await api.adminUpdateBlog(editingId, payload);
      else await api.adminAddBlog(payload);
      setMessage(editingId ? "Blog post updated." : "Blog post created.");
      reset();
      setVersion((current) => current + 1);
    } catch (saveError) {
      setError(saveError?.message || "Blog post could not be saved.");
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  const deletePost = (post) =>
    requestConfirmation(
      "Delete Blog Post",
      `Delete “${post.title || "this post"}”? This cannot be undone.`,
      async () => {
        try {
          await api.adminDeleteBlog(post._id);
          setPosts((current) =>
            current.filter((item) => item._id !== post._id),
          );
          if (editingId === String(post._id)) reset();
          setMessage("Blog post deleted.");
        } catch (deleteError) {
          setError(deleteError?.message || "Blog post could not be deleted.");
        }
      },
      { confirmLabel: "Delete post", danger: true },
    );

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <form onSubmit={savePost} style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: "1.4rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                color: "#0A1628",
                fontSize: "1.35rem",
                margin: 0,
              }}
            >
              {editingId ? "Edit Blog Post" : "Create Blog Post"}
            </h2>
            <p style={{ color: "#334155", margin: ".35rem 0 0" }}>
              Published posts appear automatically on the Blog page and Home
              page.
            </p>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              style={{
                padding: ".58rem .8rem",
                border: "1px solid #CBD5E1",
                borderRadius: "9px",
                background: "#fff",
                color: "#475569",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Cancel editing
            </button>
          )}
        </div>
        {error && (
          <div
            role="alert"
            style={{
              marginBottom: "1rem",
              padding: ".8rem 1rem",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              color: "#B91C1C",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}
        <div
          className="admin-grid-responsive"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1rem",
          }}
        >
          <div>
            <label htmlFor="blog-title" style={labelStyle}>
              Post title *
            </label>
            <input
              id="blog-title"
              style={inputStyle}
              maxLength={180}
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="Example: How to Prepare for Your California Driving Test"
              required
            />
          </div>
          <div>
            <label htmlFor="blog-slug" style={labelStyle}>
              URL slug
            </label>
            <input
              id="blog-slug"
              style={inputStyle}
              maxLength={160}
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="Generated from title"
            />
          </div>
        </div>
        <div
          className="admin-grid-responsive"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <div>
            <label htmlFor="blog-category" style={labelStyle}>
              Category
            </label>
            <input
              id="blog-category"
              style={inputStyle}
              maxLength={80}
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              placeholder="Driving Tips"
            />
          </div>
          <div>
            <label htmlFor="blog-author" style={labelStyle}>
              Author
            </label>
            <input
              id="blog-author"
              style={inputStyle}
              maxLength={120}
              value={form.author}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  author: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label htmlFor="blog-order" style={labelStyle}>
              Display order
            </label>
            <input
              id="blog-order"
              type="number"
              min="0"
              max="10000"
              style={inputStyle}
              value={form.order}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  order: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <span style={labelStyle}>Featured image</span>
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectImage(event.dataTransfer.files?.[0]);
            }}
            style={{
              marginTop: ".45rem",
              display: "grid",
              gridTemplateColumns: imagePreview ? "minmax(180px, 300px) 1fr" : "1fr",
              gap: "1rem",
              alignItems: "center",
              padding: "1rem",
              border: "1.5px dashed #9DB8D8",
              borderRadius: 14,
              background: "linear-gradient(135deg,#F8FBFF,#FFFFFF 65%,#FFFBEB)",
            }}
          >
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Selected blog preview"
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  display: "block",
                  objectFit: "cover",
                  borderRadius: 11,
                  border: "1px solid #D7E3F0",
                  background: "#E2E8F0",
                }}
              />
            )}
            <div>
              <input
                key={imageInputKey}
                id="blog-image"
                type="file"
                disabled={saving}
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => selectImage(event.target.files?.[0])}
                style={{
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0, 0, 0, 0)",
                  whiteSpace: "nowrap",
                  border: 0,
                }}
              />
              <p style={{ margin: "0 0 .7rem", color: "#1E3A5F", fontWeight: 800 }}>
                {imageFile ? imageFile.name : imagePreview ? "Current blog image" : "Upload a landscape image"}
              </p>
              <p style={{ margin: "0 0 .85rem", color: "#52677F", fontSize: ".88rem", lineHeight: 1.5 }}>
                JPG, PNG or WebP · maximum 4 MB · 16:9 landscape recommended. You may also drag and drop the file here.
              </p>
              <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
                <label
                  htmlFor="blog-image"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 42,
                    padding: ".6rem .9rem",
                    borderRadius: 9,
                    background: "#0145A8",
                    color: "#fff",
                    fontWeight: 850,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {imagePreview ? "Replace image" : "Choose image"}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={removeImage}
                    style={{
                      minHeight: 42,
                      padding: ".6rem .9rem",
                      border: "1px solid #CBD5E1",
                      borderRadius: 9,
                      background: "#fff",
                      color: "#475569",
                      fontWeight: 800,
                      cursor: saving ? "wait" : "pointer",
                    }}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="blog-excerpt" style={labelStyle}>
            Short summary
          </label>
          <textarea
            id="blog-excerpt"
            rows="3"
            maxLength={420}
            style={{ ...inputStyle, resize: "vertical" }}
            value={form.excerpt}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                excerpt: event.target.value,
              }))
            }
            placeholder="A short description for article cards. If empty, it will be generated from the article."
          />
        </div>
        <div style={{ marginTop: "1rem" }}>
          <label htmlFor="blog-content" style={labelStyle}>
            Article content *
          </label>
          <AdminRichTextEditor
            id="blog-content"
            value={form.content}
            onChange={(content) =>
              setForm((current) => ({
                ...current,
                content,
              }))
            }
            required
          />
        </div>
        <div
          className="admin-grid-responsive"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1rem",
          }}
        >
          <div>
            <label htmlFor="blog-published-at" style={labelStyle}>
              Publication date
            </label>
            <input
              id="blog-published-at"
              type="datetime-local"
              style={inputStyle}
              value={form.publishedAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  publishedAt: event.target.value,
                }))
              }
            />
            <small
              style={{
                display: "block",
                marginTop: ".35rem",
                color: "#334155",
              }}
            >
              Leave empty to publish immediately.
            </small>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
              paddingTop: "1.4rem",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".55rem",
                color: "#334155",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    published: event.target.checked,
                  }))
                }
              />{" "}
              Published
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".55rem",
                color: "#334155",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    featured: event.target.checked,
                  }))
                }
              />{" "}
              Featured post
            </label>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: ".65rem",
            marginTop: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: ".75rem 1.15rem",
              border: 0,
              borderRadius: 10,
              background: "#0145A8",
              color: "#fff",
              fontWeight: 900,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.65 : 1,
            }}
          >
            {uploadingImage ? "Uploading image…" : saving ? "Saving…" : editingId ? "Update post" : "Create post"}
          </button>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: ".75rem 1rem",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              background: "#fff",
              color: "#475569",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <section style={cardStyle}>
        <div
          className="admin-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "1.2rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                color: "#0A1628",
                fontSize: "1.25rem",
                margin: 0,
              }}
            >
              Blog Posts
            </h2>
            <p style={{ color: "#334155", margin: ".3rem 0 0" }}>
              {filtered.length} of {posts.length} posts
            </p>
          </div>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <input
              className="admin-toolbar-input"
              type="search"
              aria-label="Search blog posts"
              style={{ ...inputStyle, width: 260 }}
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search title, category…"
            />
            <select
              aria-label="Filter blog visibility"
              style={{ ...inputStyle, width: 140 }}
              value={visibility}
              onChange={(event) => { setVisibility(event.target.value); setPage(1); }}
            >
              <option value="all">All posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
            <select aria-label="Blog rows per page" style={{ ...inputStyle, width: 112 }} value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select>
          </div>
        </div>
        {loading ? (
          <p role="status" style={{ color: "#334155", padding: "2rem 0" }}>
            Loading blog posts…
          </p>
        ) : error && !posts.length ? (
          <div role="alert" style={{ color: "#B91C1C" }}>
            {error}{" "}
            <button
              type="button"
              onClick={() => setVersion((current) => current + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 900,
              }}
            >
              <thead>
                <tr>
                  <th scope="col" style={thStyle}>Blog Post</th>
                  <th scope="col" style={thStyle}>Post Category</th>
                  <th scope="col" style={thStyle}>Written By</th>
                  <th scope="col" style={thStyle}>Publication Status</th>
                  <th scope="col" style={thStyle}>Live / Scheduled Date</th>
                  <th scope="col" className="admin-actions-cell" style={thStyle}>Manage Post</th>
                </tr>
              </thead>
              <tbody>
                {visiblePosts.map((post) => {
                  const publication = publicationState(post);
                  return (
                  <tr key={post._id}>
                    <td style={{ ...tdStyle, minWidth: 260 }}>
                      <strong style={{ display: "block", color: "#10213A" }}>
                        {post.title}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          color: "#334155",
                          fontSize: ".82rem",
                          marginTop: ".2rem",
                        }}
                      >
                        /blog/{post.slug}
                      </span>
                      {post.featured && (
                        <span
                          style={{
                            display: "inline-block",
                            color: "#A16207",
                            background: "#FEF3C7",
                            borderRadius: 999,
                            padding: ".18rem .45rem",
                            fontSize: ".68rem",
                            fontWeight: 900,
                            marginTop: ".35rem",
                          }}
                        >
                          FEATURED
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{post.category}</td>
                    <td style={tdStyle}>{post.author}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: ".25rem .5rem",
                          borderRadius: 999,
                          background: publication.background,
                          color: publication.color,
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          fontSize: ".68rem",
                          fontWeight: 900,
                        }}
                      >
                        {publication.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      {displayDate(post.publishedAt)}
                    </td>
                    <td className="admin-actions-cell" style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: ".4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {publication.live ? (
                          <Link
                            to={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: ".38rem .6rem",
                              border: "1px solid #CBD5E1",
                              borderRadius: 8,
                              color: "#475569",
                              textDecoration: "none",
                              fontSize: ".75rem",
                              fontWeight: 850,
                            }}
                          >
                            View
                          </Link>
                        ) : post.published ? (
                          <button
                            type="button"
                            disabled
                            title={`This article will become public on ${displayDate(post.publishedAt)}.`}
                            style={{
                              padding: ".38rem .6rem",
                              border: "1px solid #E2E8F0",
                              borderRadius: 8,
                              background: "#F8FAFC",
                              color: "#94A3B8",
                              fontSize: ".75rem",
                              fontWeight: 850,
                              cursor: "not-allowed",
                            }}
                          >
                            Not Live Yet
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => editPost(post)}
                          style={{
                            padding: ".38rem .6rem",
                            border: "1px solid #0145A8",
                            borderRadius: 8,
                            background: "#fff",
                            color: "#0145A8",
                            fontWeight: 850,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <AdminDeleteIconButton
                          label={`Delete blog post ${post.title || ""}`.trim()}
                          title="Delete blog post"
                          onClick={() => deletePost(post)}
                        />
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        ...tdStyle,
                        textAlign: "center",
                        color: "#334155",
                        padding: "2.2rem",
                      }}
                    >
                      {posts.length
                        ? "No blog posts match the filters."
                        : "No blog posts yet. Create the first post above."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div aria-label="Blog pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: ".75rem", flexWrap: "wrap", marginTop: "1rem" }}><span style={{ color: "#334155" }}>Page {safePage} of {pages} · {filtered.length} posts</span><div style={{ display: "flex", gap: ".45rem" }}><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" disabled={safePage >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Next</button></div></div>
          </div>
        )}
      </section>
    </div>
  );
}
