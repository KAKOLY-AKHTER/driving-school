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

const BlogIcon = ({ name }) => {
  const paths = {
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
        <path d="M8 8h8M8 12h6" />
      </>
    ),
    permit: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    road: <path d="M9 22 11 2M15 22 13 2M12 6v3M12 13v3" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

const ResourceCard = ({ icon, number, title, description, to }) => (
  <Link to={to} className="blog-resource-card">
    <span className="blog-resource-icon"><BlogIcon name={icon} /></span>
    <span className="blog-resource-number">{number}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <strong>Explore guide <span aria-hidden="true">→</span></strong>
  </Link>
);

const BlogCard = ({ post, large = false }) => (
  <article className={`blog-card${large ? " blog-card-large" : ""}`}>
    <Link to={`/blog/${post.slug}`} className="blog-card-link">
      <div className="blog-card-media">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="blog-card-fallback" aria-hidden="true">
            <BlogIcon name="road" />
          </div>
        )}
        {post.featured && <span className="blog-featured">Editor&apos;s pick</span>}
      </div>
      <div className="blog-card-body">
        <div className="blog-meta">
          <span>{post.category || "Driving knowledge"}</span>
          <i>·</i>
          <time>{formatDate(post.publishedAt)}</time>
          <i>·</i>
          <span>{post.readingMinutes || 1} min read</span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <strong>
          Read full article <span aria-hidden="true">→</span>
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
  const [category, setCategory] = useState("All");
  const [requestVersion, setRequestVersion] = useState(0);

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
  }, [slug, requestVersion]);

  const categories = useMemo(
    () => ["All", ...new Set(posts.map((item) => item.category).filter(Boolean))],
    [posts],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return posts.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch =
        !search ||
        [item.title, item.excerpt, item.category, item.author].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(search),
          );
      return matchesCategory && matchesSearch;
    });
  }, [posts, query, category]);

  const featuredPost =
    !query && category === "All"
      ? filtered.find((item) => item.featured) || filtered[0]
      : null;
  const gridPosts = featuredPost
    ? filtered.filter((item) => item !== featuredPost)
    : filtered;

  return (
    <>
      <style>{`
      .blog-page{background:#F8FAFD;min-height:100vh;padding-top:8rem;color:#10213A}.blog-wrap{width:min(1180px,calc(100% - 2rem));margin:0 auto}
      .blog-hero{padding:clamp(3rem,7vw,5.5rem) 0;text-align:center;background:radial-gradient(circle at 80% 10%,rgba(253,188,1,.2),transparent 16rem),linear-gradient(135deg,#071A35,#0145A8);color:#fff;overflow:hidden}
      .blog-eyebrow{font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.22em;font-size:.74rem;color:#FFD54F;font-weight:900;margin:0 0 .65rem}.blog-hero h1{font-family:var(--font-display);font-size:clamp(2.4rem,7vw,4.8rem);line-height:1.04;margin:0}.blog-hero p{max-width:680px;margin:1rem auto 0;line-height:1.7;color:rgba(255,255,255,0.88);font-size:1.08rem}
      .blog-toolbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:2.2rem 0 1.4rem}.blog-toolbar h2{font-family:var(--font-display);font-size:1.6rem;margin:0}.blog-search{width:min(100%,320px);padding:.78rem 1rem;border:1.5px solid #D8E4F2;border-radius:12px;background:#fff;font:inherit;outline:none}.blog-search:focus{border-color:#0145A8;box-shadow:0 0 0 4px rgba(1,69,168,.08)}
      .blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem;padding-bottom:6rem}.blog-card{min-width:0}.blog-card-link{height:100%;display:flex;flex-direction:column;text-decoration:none;color:inherit;background:#fff;border:1px solid #E2EBF5;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px rgba(15,35,70,.07);transition:.3s}.blog-card-link:hover{transform:translateY(-7px);box-shadow:0 22px 50px rgba(1,69,168,.14);border-color:rgba(1,69,168,.25)}
      .blog-card-media{height:220px;background:#0145A8;position:relative;overflow:hidden}.blog-card-media img{width:100%;height:100%;object-fit:cover;transition:transform .5s}.blog-card-link:hover img{transform:scale(1.04)}.blog-card-fallback{height:100%;display:grid;place-items:center;background:radial-gradient(circle at 75% 20%,rgba(253,188,1,.42),transparent 8rem),linear-gradient(135deg,#082048,#0145A8);color:rgba(255,255,255,.16);font-family:var(--font-display);font-size:6rem;font-weight:900}.blog-featured{position:absolute;left:1rem;top:1rem;background:#FDBC01;color:#082048;border-radius:999px;padding:.35rem .6rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;font-weight:900}
      .blog-card-body{display:flex;flex-direction:column;flex:1;padding:1.25rem}.blog-meta{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;color:#334155;font-size:.76rem;font-weight:700}.blog-meta span:first-child{color:#0145A8;text-transform:uppercase;letter-spacing:.07em;font-weight:900}.blog-meta i{font-style:normal}.blog-card h2{font-family:var(--font-display);font-size:1.25rem;line-height:1.35;margin:.65rem 0 0}.blog-card p{color:#334155;line-height:1.6;margin:.65rem 0 1rem;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.blog-card strong{margin-top:auto;color:#0145A8;font-size:.85rem}
      .blog-state{padding:5rem 1rem 8rem;text-align:center;color:#334155}.blog-state h2{color:#10213A;font-family:var(--font-display)}
      .blog-article{background:#fff;padding-bottom:7rem}.blog-article-hero{padding:10rem 1rem 4rem;background:linear-gradient(135deg,#071A35,#0145A8);color:#fff}.blog-article-head{width:min(900px,100%);margin:0 auto}.blog-back{color:#FFD54F;text-decoration:none;font-weight:850}.blog-article h1{font-family:var(--font-display);font-size:clamp(2.3rem,6vw,4.5rem);line-height:1.08;margin:1.1rem 0}.blog-article-meta{display:flex;gap:.55rem;flex-wrap:wrap;color:rgba(255,255,255,0.88)}
      .blog-cover{width:min(1080px,calc(100% - 2rem));height:clamp(260px,48vw,560px);margin:2rem auto 0;border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#082048,#0145A8);box-shadow:0 24px 65px rgba(15,35,70,.18)}.blog-cover img{width:100%;height:100%;object-fit:cover}.blog-cover .blog-card-fallback{font-size:10rem}
      .blog-content{width:min(760px,calc(100% - 2rem));margin:3rem auto 0;font-size:1.08rem;line-height:1.9;color:#334155}.blog-content p{white-space:pre-wrap;margin:0 0 1.4rem}.blog-author{margin-top:2.5rem;padding:1.25rem;border:1px solid #E2EBF5;border-radius:16px;background:#F8FBFF}.blog-author strong{color:#10213A}.blog-author span{display:block;color:#334155;margin-top:.25rem}
      .blog-page{background:#f6f8fc;overflow:hidden}.blog-wrap{width:min(1240px,calc(100% - 2rem))}
      .blog-hero{position:relative;text-align:left;padding:clamp(4.5rem,8vw,7rem) 0 clamp(7rem,11vw,9rem);background:radial-gradient(circle at 78% 25%,rgba(44,125,242,.42),transparent 27rem),linear-gradient(125deg,#06172e 0%,#082d68 58%,#0758bd 100%);isolation:isolate}
      .blog-hero:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.16;background-image:linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(90deg,transparent,#000 58%,#000)}
      .blog-hero:after{content:"";position:absolute;width:440px;height:440px;border:1px solid rgba(255,210,61,.2);border-radius:50%;right:-130px;top:-160px;box-shadow:0 0 0 65px rgba(255,210,61,.03),0 0 0 130px rgba(255,210,61,.02)}
      .blog-hero-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(290px,.7fr);align-items:center;gap:clamp(2rem,6vw,6rem)}
      .blog-eyebrow{display:flex;align-items:center;gap:.7rem;margin:0 0 1.05rem}.blog-eyebrow:before{content:"";width:36px;height:2px;background:#FFD54F}.blog-hero h1{font-size:clamp(3.1rem,7vw,5.8rem);line-height:.98;letter-spacing:-.035em;max-width:820px}.blog-hero p.blog-hero-copy{max-width:730px;margin:1.4rem 0 0;line-height:1.75;font-size:clamp(1rem,1.5vw,1.16rem)}
      .blog-hero-note{position:relative;padding:1.8rem;border:1px solid rgba(255,255,255,.17);border-radius:22px;background:rgba(4,22,51,.48);box-shadow:0 24px 60px rgba(0,0,0,.2);backdrop-filter:blur(12px)}.blog-hero-note:before{content:"";position:absolute;inset:-1px auto -1px -1px;width:4px;border-radius:22px 0 0 22px;background:#FFD54F}.blog-note-icon{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:#FFD54F;color:#08234b;box-shadow:0 10px 28px rgba(255,210,61,.22)}.blog-note-icon svg{width:24px}.blog-hero-note h2{font-family:var(--font-display);font-size:1.35rem;margin:1.1rem 0 .5rem}.blog-hero-note>p{margin:0;color:rgba(255,255,255,0.88);line-height:1.65;font-size:.92rem}.blog-note-points{display:grid;gap:.72rem;margin-top:1.15rem;padding-top:1.1rem;border-top:1px solid rgba(255,255,255,.12)}.blog-note-points span{display:flex;align-items:center;gap:.65rem;font-size:.8rem;font-weight:800}.blog-note-points i{width:7px;height:7px;border-radius:50%;background:#FFD54F;box-shadow:0 0 0 5px rgba(255,213,79,.08)}
      .blog-main{position:relative;margin-top:-4.1rem;padding-bottom:5.5rem}.blog-toolbar{position:relative;z-index:2;padding:1.15rem 1.3rem;background:#fff;border:1px solid #e0e8f2;border-radius:20px;box-shadow:0 20px 55px rgba(6,28,64,.13)}.blog-toolbar-copy h2{font-size:1.35rem}.blog-search{width:min(100%,390px);padding:.9rem 1.05rem;background:#f8fafd}.blog-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:1rem;margin:3.3rem 0 1.4rem}.blog-section-head h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,2.7rem);line-height:1;margin:0}.blog-section-head p{color:#334155;margin:.55rem 0 0}.blog-categories{display:flex;gap:.5rem;flex-wrap:wrap;justify-content:flex-end}.blog-category-button{padding:.6rem .82rem;border:1px solid #d8e3ef;border-radius:999px;background:#fff;color:#334155;font:inherit;font-size:.76rem;font-weight:800;cursor:pointer;transition:.2s}.blog-category-button:hover,.blog-category-button.active{border-color:#0758bd;background:#0758bd;color:#fff;box-shadow:0 8px 20px rgba(7,88,189,.16)}
      .blog-grid{padding-bottom:0}.blog-feature-layout{margin-bottom:1.25rem}.blog-card-large .blog-card-link{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(320px,.8fr);min-height:390px}.blog-card-large .blog-card-media{height:100%}.blog-card-large .blog-card-body{padding:clamp(1.8rem,4vw,3rem);justify-content:center}.blog-card-large h2{font-size:clamp(1.8rem,3vw,2.7rem)}.blog-card-large p{font-size:1.02rem;-webkit-line-clamp:4}.blog-card-large strong{margin-top:1rem}.blog-card-fallback svg{width:88px;height:88px}.blog-card strong{display:flex;align-items:center;gap:.4rem}.blog-card strong span{transition:transform .2s}.blog-card-link:hover strong span{transform:translateX(4px)}
      .blog-empty{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(280px,.75fr);gap:1.3rem}.blog-empty-main{position:relative;padding:clamp(2rem,5vw,3.5rem);border-radius:24px;background:linear-gradient(135deg,#fff,#f3f7fd);border:1px solid #dfe8f3;box-shadow:0 18px 50px rgba(11,31,63,.08);overflow:hidden}.blog-empty-main:after{content:"A";position:absolute;right:-8px;bottom:-90px;font-family:var(--font-display);font-size:17rem;font-weight:900;color:rgba(7,88,189,.045)}.blog-empty-main h2{position:relative;z-index:1;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);margin:1.2rem 0 .7rem}.blog-empty-main p{position:relative;z-index:1;color:#334155;line-height:1.75;max-width:650px}.blog-empty-actions{position:relative;z-index:1;display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.35rem}.blog-primary,.blog-secondary{display:inline-flex;align-items:center;padding:.8rem 1.05rem;border-radius:11px;text-decoration:none;font-weight:900;font-size:.84rem}.blog-primary{background:#0758bd;color:#fff;box-shadow:0 10px 24px rgba(7,88,189,.2)}.blog-secondary{background:#fff;color:#17365f;border:1px solid #d5e0ed}.blog-empty-side{padding:2rem;border-radius:24px;background:#071a35;color:#fff;box-shadow:0 18px 50px rgba(11,31,63,.12)}.blog-empty-side>p{font-family:var(--font-mono);color:#FFD54F;text-transform:uppercase;letter-spacing:.17em;font-size:.7rem;font-weight:900}.blog-empty-side h3{font-family:var(--font-display);font-size:1.65rem;line-height:1.25;margin:.8rem 0}.blog-empty-side span{color:rgba(255,255,255,0.88);line-height:1.65;font-size:.92rem}
      .blog-resources{padding:5.5rem 0;background:#fff;border-top:1px solid #e6edf5}.blog-resource-head{text-align:center;max-width:690px;margin:0 auto 2rem}.blog-resource-head .blog-eyebrow{justify-content:center;color:#aa7e00}.blog-resource-head .blog-eyebrow:before{background:#e8af00}.blog-resource-head h2{font-family:var(--font-display);font-size:clamp(2.2rem,5vw,3.5rem);margin:0}.blog-resource-head>p:last-child{color:#334155;line-height:1.65}.blog-resource-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.blog-resource-card{position:relative;display:flex;flex-direction:column;min-height:255px;padding:1.55rem;border:1px solid #e0e8f2;border-radius:18px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 10px 30px rgba(11,31,63,.055);transition:.28s;overflow:hidden}.blog-resource-card:after{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,#0758bd,#FFD54F);transform:scaleX(0);transform-origin:left;transition:.28s}.blog-resource-card:hover{transform:translateY(-6px);box-shadow:0 20px 42px rgba(7,56,120,.12)}.blog-resource-card:hover:after{transform:scaleX(1)}.blog-resource-icon{position:relative;z-index:1;width:48px;height:48px;display:grid;place-items:center;border-radius:13px;background:#eaf3ff;color:#0758bd}.blog-resource-icon svg{width:24px}.blog-resource-number{position:absolute;right:1.3rem;top:1.3rem;color:#aebac9;font-family:var(--font-mono);font-size:.68rem;font-weight:900;letter-spacing:.12em}.blog-resource-card h3{font-family:var(--font-display);font-size:1.35rem;margin:1.15rem 0 .5rem}.blog-resource-card p{color:#334155;line-height:1.6;margin:0 0 1rem}.blog-resource-card strong{margin-top:auto;color:#0758bd;font-size:.82rem}
      .blog-cta{padding:0 0 6.5rem;background:#fff}.blog-cta-inner{position:relative;display:grid;grid-template-columns:1fr auto;align-items:center;gap:2rem;padding:clamp(2rem,5vw,3.5rem);border-radius:26px;background:radial-gradient(circle at 90% 10%,rgba(255,213,79,.24),transparent 15rem),linear-gradient(125deg,#06172e,#0a4292);color:#fff;overflow:hidden}.blog-cta-inner:before{content:"";position:absolute;width:250px;height:250px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-60px;bottom:-150px}.blog-cta h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.15rem);margin:0}.blog-cta p{color:rgba(255,255,255,0.88);line-height:1.65;margin:.65rem 0 0;max-width:700px}.blog-cta .blog-primary{background:#FFD54F;color:#081c38;white-space:nowrap}
      .blog-article-hero{position:relative;padding:13rem 1rem 6.5rem;background:radial-gradient(circle at 82% 15%,rgba(38,114,224,.42),transparent 25rem),linear-gradient(125deg,#06172e,#0758bd);overflow:hidden}.blog-article-hero:after{content:"";position:absolute;inset:0;opacity:.12;background-image:linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px);background-size:54px 54px}.blog-article-head{position:relative;z-index:1}.blog-cover{position:relative;margin:-3.2rem auto 0;border:9px solid #fff;border-radius:28px}.blog-content>p:first-child:first-letter{float:left;font-family:var(--font-display);font-size:4.6rem;line-height:.8;padding:.18rem .55rem 0 0;color:#0758bd}
      @media(max-width:900px){.blog-hero-grid{grid-template-columns:1fr}.blog-hero-note{display:none}.blog-grid,.blog-resource-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.blog-resource-card:last-child{grid-column:1/-1}.blog-card-large .blog-card-link{grid-template-columns:1fr}.blog-card-large .blog-card-media{height:320px}.blog-empty{grid-template-columns:1fr}.blog-cta-inner{grid-template-columns:1fr;justify-items:start}}
      @media(max-width:620px){.blog-grid,.blog-resource-grid{grid-template-columns:1fr}.blog-resource-card:last-child{grid-column:auto}.blog-toolbar{align-items:stretch;flex-direction:column}.blog-search{width:100%;box-sizing:border-box}.blog-page{padding-top:6rem}.blog-hero{padding-top:4rem}.blog-section-head{align-items:flex-start;flex-direction:column}.blog-categories{justify-content:flex-start}.blog-card-large .blog-card-media{height:225px}.blog-empty-side{display:none}.blog-article-hero{padding-top:10rem}.blog-cta-inner{border-radius:20px}}
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
              {error && <button type="button" className="public-retry-button" onClick={() => setRequestVersion(value => value + 1)}>Retry</button>}
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
            <div className="blog-wrap blog-hero-grid">
              <div>
                <p className="blog-eyebrow">Knowledge for every mile</p>
                <h1>
                  Smarter drivers.
                  <br />
                  Safer roads.
                </h1>
                <p className="blog-hero-copy">
                  Practical California driving guidance for learners, parents,
                  and experienced drivers—from the first permit question to
                  confident everyday driving.
                </p>
              </div>
              <aside className="blog-hero-note" aria-label="What you will find">
                <span className="blog-note-icon">
                  <BlogIcon name="book" />
                </span>
                <h2>Road-ready knowledge</h2>
                <p>
                  Clear guidance prepared around the questions California
                  students ask most.
                </p>
                <div className="blog-note-points">
                  <span><i /> Permit &amp; license guidance</span>
                  <span><i /> Behind-the-wheel skills</span>
                  <span><i /> Safety &amp; confidence</span>
                </div>
              </aside>
            </div>
          </section>

          <div className="blog-main">
            <div className="blog-wrap">
              <div className="blog-toolbar">
                <div className="blog-toolbar-copy">
                  <h2>Find the guidance you need</h2>
                  <p style={{ color: "#334155", margin: ".25rem 0 0" }}>
                    {posts.length} published {posts.length === 1 ? "article" : "articles"}
                  </p>
                </div>
                <input
                  type="search"
                  className="blog-search"
                  aria-label="Search blog articles"
                  placeholder="Search driving guides…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="blog-section-head">
                <div>
                  <h2>Latest insights</h2>
                  <p>Professional advice for a safer, more confident drive.</p>
                </div>
                {categories.length > 1 && (
                  <div className="blog-categories" aria-label="Filter articles by category">
                    {categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`blog-category-button${category === item ? " active" : ""}`}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="blog-state" role="status">Loading articles…</div>
              ) : error ? (
                <div className="blog-state">
                  <h2>Articles unavailable</h2>
                  <p>{error}</p>
                  <button type="button" className="public-retry-button" onClick={() => setRequestVersion(value => value + 1)}>Retry articles</button>
                </div>
              ) : filtered.length ? (
                <>
                  {featuredPost && (
                    <div className="blog-feature-layout">
                      <BlogCard post={featuredPost} large />
                    </div>
                  )}
                  {gridPosts.length > 0 && (
                    <div className="blog-grid">
                      {gridPosts.map((item) => (
                        <BlogCard key={item._id || item.slug} post={item} />
                      ))}
                    </div>
                  )}
                </>
              ) : posts.length ? (
                <div className="blog-state">
                  <h2>No matching articles</h2>
                  <p>Try another search term or category.</p>
                  <button type="button" className="public-retry-button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>
                </div>
              ) : (
                <div className="blog-empty">
                  <section className="blog-empty-main">
                    <span className="blog-resource-icon"><BlogIcon name="book" /></span>
                    <h2>Fresh driving resources are on the way.</h2>
                    <p>
                      Our instructors are preparing practical, easy-to-follow
                      guides for California learners and families. In the
                      meantime, explore our trusted course and licensing resources.
                    </p>
                    <div className="blog-empty-actions">
                      <Link to="/pricing" className="blog-primary">View lesson plans&nbsp; →</Link>
                      <Link to="/contact" className="blog-secondary">Ask our school</Link>
                    </div>
                  </section>
                  <aside className="blog-empty-side">
                    <p>Coming soon</p>
                    <h3>Instructor-backed advice, without the guesswork.</h3>
                    <span>
                      Permit preparation, safer driving habits, test-day
                      guidance, and confidence-building tips—all in one place.
                    </span>
                  </aside>
                </div>
              )}
            </div>
          </div>

          <section className="blog-resources">
            <div className="blog-wrap">
              <div className="blog-resource-head">
                <p className="blog-eyebrow">Start here</p>
                <h2>Trusted driver resources</h2>
                <p>
                  Follow the California licensing journey with clear next steps
                  and professional guidance.
                </p>
              </div>
              <div className="blog-resource-grid">
                <ResourceCard
                  icon="permit"
                  number="01 / PERMIT"
                  title="Prepare for your permit"
                  description="Understand the essential steps, age requirements, documents, and written-test process."
                  to="/online-drivers-ed/permit"
                />
                <ResourceCard
                  icon="shield"
                  number="02 / LICENSE"
                  title="Driver license checklist"
                  description="Review training requirements and what to complete before scheduling your road test."
                  to="/online-drivers-ed/driver-license"
                />
                <ResourceCard
                  icon="road"
                  number="03 / LESSONS"
                  title="Build real confidence"
                  description="Compare professional lesson plans designed around your experience and driving goals."
                  to="/pricing"
                />
              </div>
            </div>
          </section>

          <section className="blog-cta">
            <div className="blog-wrap blog-cta-inner">
              <div>
                <h2>Ready to get behind the wheel?</h2>
                <p>
                  Learn with patient, professional instructors focused on safe,
                  confident driving.
                </p>
              </div>
              <Link to="/pricing" className="blog-primary">Explore lesson plans&nbsp; →</Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
