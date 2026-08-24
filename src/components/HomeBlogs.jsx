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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .getBlogs({ limit: 3 })
      .then((data) => {
        if (active) setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setError("Articles could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [request]);

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
        .home-blog-state{grid-column:1/-1;min-height:180px;display:grid;place-items:center;text-align:center;padding:2rem;border:1px solid #E2EBF5;border-radius:20px;background:#fff;color:#334155}
        .home-blog-empty{position:relative;isolation:isolate;min-height:285px;padding:clamp(2rem,5vw,3.25rem);overflow:hidden;border-color:rgba(1,69,168,.16);background:radial-gradient(circle at 8% 15%,rgba(253,188,1,.2),transparent 12rem),radial-gradient(circle at 92% 85%,rgba(54,133,245,.18),transparent 15rem),linear-gradient(125deg,#071a35 0%,#0a3475 58%,#0758bd 100%);box-shadow:0 22px 55px rgba(8,32,72,.16);color:#fff}
        .home-blog-empty:before{content:"";position:absolute;inset:0;z-index:-1;opacity:.12;background-image:linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(110deg,#000,transparent 70%)}
        .home-blog-empty:after{content:"A";position:absolute;right:-.4rem;bottom:-6.8rem;z-index:-1;color:rgba(255,255,255,.055);font-family:var(--font-display);font-size:19rem;font-weight:900;line-height:1}
        .home-blog-empty-inner{width:min(700px,100%)}
        .home-blog-empty-icon{width:68px;height:68px;margin:0 auto 1.15rem;display:grid;place-items:center;border:1px solid rgba(255,255,255,.25);border-radius:19px;background:linear-gradient(135deg,#FDBC01,#FFD54F);color:#082048;box-shadow:0 12px 32px rgba(253,188,1,.25);transform:rotate(-3deg)}
        .home-blog-empty-icon svg{width:34px;height:34px}
        .home-blog-empty-label{display:inline-flex;padding:.38rem .72rem;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.09);color:#FFD54F;font-family:var(--font-mono);font-size:.66rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
        .home-blog-empty h3{margin:.9rem 0 .55rem;color:#fff;font-family:var(--font-display);font-size:clamp(1.65rem,4vw,2.35rem);line-height:1.15}
        .home-blog-empty p{max-width:570px;margin:0 auto;color:rgba(255,255,255,.82);font-size:.96rem;line-height:1.7}
        .home-blog-empty-actions{display:flex;justify-content:center;gap:.7rem;flex-wrap:wrap;margin-top:1.4rem}
        .home-blog-empty-action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.72rem 1rem;border-radius:11px;text-decoration:none;font-size:.82rem;font-weight:850}
        .home-blog-empty-action.primary{background:linear-gradient(135deg,#FDBC01,#FFD54F);color:#082048;box-shadow:0 10px 25px rgba(253,188,1,.22)}
        .home-blog-empty-action.secondary{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;backdrop-filter:blur(8px)}
        .home-blog-empty-action:hover{transform:translateY(-2px)}
        .home-blog-retry{margin-top:1rem;padding:.72rem 1.1rem;border:0;border-radius:10px;background:#0145A8;color:#fff;font:inherit;font-weight:850;cursor:pointer}
        .home-blog-skeleton{height:360px;border-radius:20px;background:linear-gradient(100deg,#edf2f7 30%,#f8fafc 45%,#edf2f7 60%);background-size:220% 100%;animation:home-blog-loading 1.3s ease-in-out infinite}
        @keyframes home-blog-loading{to{background-position-x:-220%}}
        @media(max-width:900px){.home-blog-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-blog-card:last-child{display:none}}
        @media(max-width:620px){.home-blog-head{align-items:flex-start;flex-direction:column}.home-blog-grid{grid-template-columns:1fr}.home-blog-card:last-child{display:flex}.home-blog-media{height:200px}.home-blog-empty{min-height:340px;padding:2rem 1.2rem}.home-blog-empty:after{right:-2rem}.home-blog-empty-actions{flex-direction:column}.home-blog-empty-action{width:100%}}
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
          {loading ? [0, 1, 2].map(item => (
            <div key={item} className="home-blog-skeleton" aria-hidden="true" />
          )) : error ? (
            <div className="home-blog-state" role="alert">
              <div><strong>{error}</strong><br />Please try again.
                <div><button type="button" className="home-blog-retry" onClick={() => setRequest(value => value + 1)}>Retry</button></div>
              </div>
            </div>
          ) : !posts.length ? (
            <div className="home-blog-state home-blog-empty">
              <div className="home-blog-empty-inner">
                <div className="home-blog-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
                    <path d="M8 8h8M8 12h6" />
                  </svg>
                </div>
                <span className="home-blog-empty-label">Fresh insights are on the way</span>
                <h3>Our next driving guide is being prepared.</h3>
                <p>While our instructors finish the latest article, explore our online driver education program or reserve your next behind-the-wheel lesson.</p>
                <div className="home-blog-empty-actions">
                  <Link to="/online-drivers-ed" className="home-blog-empty-action primary">Explore driver education</Link>
                  <Link to="/schedule" className="home-blog-empty-action secondary">Book a driving lesson</Link>
                </div>
              </div>
            </div>
          ) : posts.map((post) => (
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
