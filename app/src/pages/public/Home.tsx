import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "../../components/ScrollReveal";

const SPECIALTIES = ["Orthopaedic", "Neuro", "Geriatric", "Post-operative", "Women's health", "General physiotherapy"];
const AREAS = [
  "Colaba", "Nariman Point", "Churchgate", "Cuffe Parade", "Fort", "Girgaon",
  "Breach Candy", "Pedder Road", "Cumballa Hill", "Malabar Hill", "Marine Lines",
  "Worli", "Lower Parel", "Mahalaxmi", "Mumbai Central",
];

export default function Home() {
  const [heroOffset, setHeroOffset] = useState(0);

  useEffect(() => {
    function onScroll() { setHeroOffset(window.scrollY * 0.25); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="container" style={{ paddingTop: 20, paddingBottom: 40 }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--color-border)", marginBottom: 40 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 19 }}>Neuro TeleRehab</span>
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 14 }}>
          <Link to="/login">Log in</Link>
          <Link to="/signup" className="btn btn-primary">Create account</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center", minHeight: "55vh" }}>
        <ScrollReveal from="left">
          <span className="badge" style={{ marginBottom: 14 }}>Home & video physiotherapy · South Mumbai</span>
          <h1 style={{ fontSize: 40, lineHeight: 1.15, marginTop: 10 }}>
            Recover with guided<br />sessions and follow-up.
          </h1>
          <p style={{ fontSize: 16, color: "var(--color-ink-muted)", maxWidth: 480, marginTop: 14 }}>
            Dr. Neha Dhanokar brings orthopaedic, neuro, geriatric, post-operative and
            women's health physiotherapy to your door, with video check-ins,
            a personalised exercise plan, and progress tracking in between visits.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: "12px 24px", fontSize: 15 }}>
              Create an account
            </Link>
            <Link to="/login" className="btn btn-outline" style={{ padding: "12px 24px", fontSize: 15 }}>
              Log in
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal from="right" delay={120}>
          <div style={{ borderRadius: 20, overflow: "hidden", aspectRatio: "4/5", transform: `translateY(${heroOffset}px)`, boxShadow: "var(--shadow-card)" }}>
            <img
              src="https://superphysio-production-physioprofilephotosbucket-ekzoxtzc.s3.us-east-1.amazonaws.com/physios/b4d8d4d8-70d1-709b-ff55-7a642b9ad658/profile/1787220859741.jpg"
              alt="Dr. Neha Dhanokar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal from="up">
        <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center", marginTop: 30 }}>
          {[["2+", "years experience"], ["15", "areas served"], ["6", "specialties"], ["7", "days a week"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--color-primary-dark)" }}>{n}</div>
              <div style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>{l}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      <section style={{ marginTop: 70 }}>
        <ScrollReveal from="up"><h2 style={{ fontSize: 26 }}>Specialties</h2></ScrollReveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginTop: 20 }}>
          {SPECIALTIES.map((s, i) => (
            <ScrollReveal key={s} from="up" delay={i * 80}>
              <div className="card" style={{ height: "100%" }}>
                <h3 style={{ fontSize: 17 }}>{s}</h3>
                <p style={{ fontSize: 13, color: "var(--color-ink-muted)", margin: 0 }}>Guided sessions, exercise plans, and progress tracking.</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 70 }}>
        <ScrollReveal from="up">
          <div className="card" style={{ background: "linear-gradient(135deg, #EDF3F1, #F7F5F0)" }}>
            <h2 style={{ fontSize: 24 }}>About Dr. Neha Dhanokar</h2>
            <p style={{ maxWidth: 640, fontSize: 15 }}>
              Dr. Neha Dhanokar is a physiotherapist specialising in Orthopaedic, Neuro,
              Geriatric, Post-operative, Women's health and General physiotherapy, with
              2+ years of experience — available for home visits and video follow-ups
              across South Mumbai, every day of the week.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <section style={{ marginTop: 70 }}>
        <ScrollReveal from="up"><h2 style={{ fontSize: 26 }}>Areas served</h2></ScrollReveal>
        <ScrollReveal from="up" delay={100}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {AREAS.map((a) => <span key={a} className="badge" style={{ fontSize: 13 }}>{a}</span>)}
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal from="up">
        <div className="card" style={{ textAlign: "center", padding: 40, marginTop: 40 }}>
          <h2 style={{ fontSize: 24 }}>Ready to get started?</h2>
          <p style={{ color: "var(--color-ink-muted)" }}>Create an account and request your first session in a couple of minutes.</p>
          <Link to="/signup" className="btn btn-primary" style={{ padding: "12px 26px", fontSize: 15, marginTop: 10 }}>
            Create account
          </Link>
        </div>
      </ScrollReveal>

      <footer style={{ marginTop: 60, padding: "24px 0", borderTop: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-ink-muted)", display: "flex", gap: 18, flexWrap: "wrap" }}>
        <span>© {new Date().getFullYear()} Neuro TeleRehab</span>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
        <Link to="/data-request">Access / correct / delete my data</Link>
      </footer>
    </div>
  );
}
