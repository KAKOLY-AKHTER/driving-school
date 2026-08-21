import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { usePageMeta } from "../usePageMeta";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
};

const BlogCard = ({ post }) => (
  <article className="blog-card">
    <Link to={`/blog/${post.slug}`} className="blog-card-link">
      <div className="blog-card-media">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="blog-card-fallback" aria-hidden="true">
            A
          </div>
        )}
        {post.featured && <span className="blog-featured">Featured</span>}
      </div>
      <div className="blog-card-body">
        <div className="blog-meta">
          <span>{post.category}</span>
          <i>·</i>
          <time>{formatDate(post.publishedAt)}</time>
          <i>·</i>
          <span>{post.readingMinutes || 1} min read</span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <strong>
          Read article <span aria-hidden="true">→</span>
        </strong>
      </div>
    </Link>
  </article>
);

export default function BlogPage() {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  usePageMeta(
    post
      ? `${post.title} — A Precision Driving School`
      : "Driving Tips & Resources — A Precision Driving School",
    post?.excerpt ||
      "California driving tips, permit guidance, road-safety advice, and driving lesson resources from A Precision Driving School.",
    { image: post?.imageUrl || undefined },
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const request = slug ? api.getBlog(slug) : api.getBlogs();
    request
      .then((data) => {
        if (!active) return;
        if (slug) setPost(data || null);
        else setPosts(Array.isArray(data) ? data : []);
      })
      .catch((loadError) => {
        if (active)
          setError(
            loadError?.status === 404
              ? "This article could not be found."
              : loadError?.message || "Blog articles could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return !search
      ? posts
      : posts.filter((item) =>
          [item.title, item.excerpt, item.category, item.author].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search),
          ),
        );
  }, [posts, query]);

  return (
    <>
      <style>{`
      .blog-page{background:#F8FAFD;min-height:100vh;padding-top:8rem;color:#10213A}.blog-wrap{width:min(1180px,calc(100% - 2rem));margin:0 auto}
      .blog-hero{padding:clamp(3rem,7vw,5.5rem) 0;text-align:center;background:radial-gradient(circle at 80% 10%,rgba(253,188,1,.2),transparent 16rem),linear-gradient(135deg,#071A35,#0145A8);color:#fff;overflow:hidden}
      .blog-eyebrow{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.22em;font-size:.74rem;color:#FFD54F;font-weight:900;margin:0 0 .65rem}.blog-hero h1{font-family:var(--font-display);font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.04;margin:0}.blog-hero p{max-width:680px;margin:1rem auto 0;line-height:1.7;color:rgba(255,255,255,.78);font-size:1.08rem}
      .blog-toolbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:2.2rem 0 1.4rem}.blog-toolbar h2{font-family:var(--font-display);font-size:1.6rem;margin:0}.blog-search{width:min(100%,320px);padding:.78rem 1rem;border:1.5px solid #D8E4F2;border-radius:12px;background:#fff;font:inherit;outline:none}.blog-search:focus{border-color:#0145A8;box-shadow:0 0 0 4px rgba(1,69,168,.08)}
      .blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;padding-bottom:6rem}.blog-card{min-width:0}.blog-card-link{height:100%;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:#fff;border:1px solid #E2EBF5;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(15,35,70,.07);transition:.3s}.blog-card-link:hover{transform:translateY(-7px);box-shadow:0 22px 50px rgba(1,69,168,.14);border-color:rgba(1,69,168,.25)}
      .blog-card-media{height:220px;background:#0145A8;position:relative;overflow:hidden}.blog-card-media img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.blog-card-link:hover img{transform:scale(1.04)}.blog-card-fallback{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 75% 20%,rgba(253,188,1,.42),transparent 8rem),linear-gradient(135deg,#082048,#0145A8);color:rgba(255,255,255,.16);font-family:var(--font-display);font-size:6rem;font-weight:900}.blog-featured{position:absolute;left:1rem;top:1rem;background:#FDBC01;color:#082048;border-radius:999px;padding:.35rem .6rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:900}
      .blog-card-body{display:flex;flex-direction:column;flex:1;padding:1.25rem}.blog-meta{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;color:#64748B;font-size:.76rem;font-weight:700}.blog-meta span:first-child{color:#0145A8;text-transform:uppercase;letter-spacing:.07em;font-weight:900}.blog-meta i{font-style:normal}.blog-card h2{font-family:var(--font-display);font-size:1.25rem;line-height:1.35;margin:.65rem 0 0}.blog-card p{color:#64748B;line-height:1.6;margin:.65rem 0 1rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.blog-card strong{margin-top:auto;color:#0145A8;font-size:.85rem}
      .blog-state{padding:5rem 1rem 8rem;text-align:center;color:#64748B}.blog-state h2{color:#10213A;font-family:var(--font-display)}
      .blog-article{background:#fff;padding-bottom:7rem}.blog-article-hero{padding:10rem 1rem 4rem;background:linear-gradient(135deg,#071A35,#0145A8);color:#fff}.blog-article-head{width:min(900px,100%);margin:0 auto}.blog-back{color:#FFD54F;text-decoration:none;font-weight:850}.blog-article h1{font-family:var(--font-display);font-size:clamp(2.3rem,6vw,4.5rem);line-height:1.08;margin:1.1rem 0}.blog-article-meta{display:flex;gap:.55rem;flex-wrap:wrap;color:rgba(255,255,255,.75)}
      .blog-cover{width:min(1080px,calc(100% - 2rem));height:clamp(260px,48vw,560px);margin:2rem auto 0;border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#082048,#0145A8);box-shadow:0 24px 65px rgba(15,35,70,.18)}.blog-cover img{width:100%;height:100%;object-fit:cover}.blog-cover .blog-card-fallback{font-size:10rem}
      .blog-content{width:min(760px,calc(100% - 2rem));margin:3rem auto 0;font-size:1.08rem;line-height:1.9;color:#334155}.blog-content p{white-space:pre-wrap;margin:0 0 1.4rem}.blog-author{margin-top:2.5rem;padding:1.25rem;border:1px solid #E2EBF5;border-radius:16px;background:#F8FBFF}.blog-author strong{color:#10213A}.blog-author span{display:block;color:#64748B;margin-top:.25rem}
      @media(max-width:900px){.blog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){.blog-grid{grid-template-columns:1fr}.blog-toolbar{align-items:stretch;flex-direction:column}.blog-search{width:100%;box-sizing:border-box}.blog-page{padding-top:6rem}.blog-article-hero{padding-top:8rem}}
    `}</style>
      {slug ? (
        <article className="blog-article">
          {loading ? (
            <div className="blog-state" role="status">
              Loading article…
            </div>
          ) : error || !post ? (
            <div className="blog-state">
              <h2>Article not found</h2>
              <p>{error}</p>
              <Link to="/blog">Back to all articles</Link>
            </div>
          ) : (
            <>
              <header className="blog-article-hero">
                <div className="blog-article-head">
                  <Link to="/blog" className="blog-back">
                    ← All articles
                  </Link>
                  <p className="blog-eyebrow" style={{ marginTop: "1.4rem" }}>
                    {post.category}
                  </p>
                  <h1>{post.title}</h1>
                  <div className="blog-article-meta">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <span>{post.readingMinutes || 1} min read</span>
                  </div>
                </div>
              </header>
              <div className="blog-cover">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} />
                ) : (
                  <div className="blog-card-fallback" aria-hidden="true">
                    A
                  </div>
                )}
              </div>
              <div className="blog-content">
                {String(post.content || "")
                  .split(/\n\s*\n/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                <div className="blog-author">
                  <strong>
                    Written by {post.author || "A Precision Driving School"}
                  </strong>
                  <span>
                    Professional driving education and safer-road guidance.
                  </span>
                </div>
              </div>
            </>
          )}
        </article>
      ) : (
        <div className="blog-page">
          <section className="blog-hero">
            <div className="blog-wrap">
              <p className="blog-eyebrow">Knowledge on the road</p>
              <h1>Driving Tips & Resources</h1>
              <p>
                Clear, practical guidance for California learners, parents, and
                licensed drivers—from permits to confident everyday driving.
              </p>
            </div>
          </section>
          <div className="blog-wrap">
            <div className="blog-toolbar">
              <div>
                <h2>Latest articles</h2>
                <p style={{ color: "#64748B", margin: ".35rem 0 0" }}>
                  {posts.length} published{" "}
                  {posts.length === 1 ? "article" : "articles"}
                </p>
              </div>
              <input
                type="search"
                className="blog-search"
                aria-label="Search blog articles"
                placeholder="Search articles…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {loading ? (
              <div className="blog-state" role="status">
                Loading articles…
              </div>
            ) : error ? (
              <div className="blog-state">
                <h2>Articles unavailable</h2>
                <p>{error}</p>
              </div>
            ) : filtered.length ? (
              <div className="blog-grid">
                {filtered.map((item) => (
                  <BlogCard key={item._id || item.slug} post={item} />
                ))}
              </div>
            ) : (
              <div className="blog-state">
                <h2>
                  {posts.length
                    ? "No matching articles"
                    : "Articles coming soon"}
                </h2>
                <p>
                  {posts.length
                    ? "Try a different search term."
                    : "Our school team is preparing helpful driving resources."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
