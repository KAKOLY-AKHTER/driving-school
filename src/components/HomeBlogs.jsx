import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

export default function HomeBlogs() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let active = true;
    api
      .getBlogs({ limit: 3 })
      .then((data) => {
        if (active) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!posts.length) return null;

  return (
    <section className="home-blog-section" aria-labelledby="home-blog-title">
      <style>{`
        .home-blog-section{padding:clamp(4.5rem,8vw,7rem) 1rem;background:linear-gradient(180deg,#F8FBFF 0%,#fff 100%);position:relative;overflow:hidden}
        .home-blog-wrap{width:min(1180px,100%);margin:0 auto}
        .home-blog-head{display:flex;align-items:end;justify-content:space-between;gap:1.5rem;margin-bottom:2rem}
        .home-blog-eyebrow{margin:0 0 .55rem;color:#C8960C;font-family:var(--font-mono);font-size:.75rem;letter-spacing:.22em;text-transform:uppercase;font-weight:800}
        .home-blog-title{margin:0;color:#082048;font-family:var(--font-display);font-size:clamp(2rem,5vw,3.4rem);line-height:1.05}
        .home-blog-subtitle{margin:.7rem 0 0;color:#334155;font-size:1.05rem;line-height:1.6;max-width:650px}
        .home-blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1.25rem}
        .home-blog-card{display:flex;flex-direction:column;min-width:0;background:#fff;border:1px solid #E2EBF5;border-radius:20px;overflow:hidden;text-decoration:none;box-shadow:0 12px 34px rgba(15,35,70,.07);transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease}
        .home-blog-card:hover{transform:translateY(-7px);box-shadow:0 22px 48px rgba(1,69,168,.14);border-color:rgba(1,69,168,.22)}
        .home-blog-media{height:210px;background:linear-gradient(135deg,#082048,#0145A8);position:relative;overflow:hidden}
        .home-blog-media img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}.home-blog-card:hover img{transform:scale(1.04)}
        .home-blog-media-fallback{height:100%;display:grid;place-items:center;color:rgba(255,255,255,.15);font-family:var(--font-display);font-size:5rem;font-weight:900;background:radial-gradient(circle at 75% 20%,rgba(253,188,1,.4),transparent 8rem),linear-gradient(135deg,#082048,#0145A8)}
        .home-blog-featured{position:absolute;top:1rem;left:1rem;padding:.38rem .6rem;border-radius:999px;background:#FDBC01;color:#082048;font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;font-weight:900}
        .home-blog-body{padding:1.25rem;display:flex;flex-direction:column;flex:1}
        .home-blog-meta{display:flex;align-items:center;gap:.45rem;color:#334155;font-size:.78rem;font-weight:700;margin-bottom:.65rem;flex-wrap:wrap}
        .home-blog-category{color:#0145A8;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;font-weight:900}
        .home-blog-card h3{margin:0;color:#10213A;font-family:var(--font-display);font-size:1.18rem;line-height:1.35}
        .home-blog-card p{margin:.65rem 0 1rem;color:#334155;line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .home-blog-read{margin-top:auto;color:#0145A8;font-weight:900;font-size:.84rem}.home-blog-read span{color:#FDBC01;margin-left:.3rem}
        .home-blog-view{display:inline-flex;align-items:center;gap:.4rem;padding:.72rem 1rem;border:1px solid rgba(1,69,168,.2);border-radius:11px;color:#0145A8;text-decoration:none;font-weight:850;background:#fff;white-space:nowrap}
        @media(max-width:900px){.home-blog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-blog-card:last-child{display:none}}
        @media(max-width:620px){.home-blog-head{align-items:flex-start;flex-direction:column}.home-blog-grid{grid-template-columns:1fr}.home-blog-card:last-child{display:flex}.home-blog-media{height:200px}}
      `}</style>
      <div className="home-blog-wrap">
        <div className="home-blog-head">
          <div>
            <p className="home-blog-eyebrow">Driving Knowledge</p>
            <h2 id="home-blog-title" className="home-blog-title">
              Latest from our blog
            </h2>
            <p className="home-blog-subtitle">
              Practical California driving tips, permit guidance, and safer-road
              advice from our school team.
            </p>
          </div>
          <Link to="/blog" className="home-blog-view">
            View all articles <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="home-blog-grid">
          {posts.map((post) => (
            <Link
              key={post._id || post.slug}
              to={`/blog/${post.slug}`}
              className="home-blog-card"
            >
              <div className="home-blog-media">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="" loading="lazy" />
                ) : (
                  <div className="home-blog-media-fallback" aria-hidden="true">
                    A
                  </div>
                )}
                {post.featured && (
                  <span className="home-blog-featured">Featured</span>
                )}
              </div>
              <div className="home-blog-body">
                <div className="home-blog-meta">
                  <span className="home-blog-category">{post.category}</span>
                  <span>·</span>
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span>{post.readingMinutes || 1} min read</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="home-blog-read">
                  Read article <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
