import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollReveal from "../../components/ScrollReveal";
import ScrollProgressBar from "../../components/ScrollProgressBar";

const SPECIALTIES = [
  {
    title: "Neuro Rehabilitation",
    desc: "Targeted neuro-motor reprogramming, balance restoration, stroke recovery, and neuromuscular retraining for sustained independence.",
    tag: "Specialized Care",
  },
  {
    title: "Orthopaedic Physical Therapy",
    desc: "Pre & post-surgical joint rehabilitation, spine stabilization, muscular reconditioning, and acute pain alleviation.",
    tag: "Joint & Spine",
  },
  {
    title: "Geriatric Mobility Care",
    desc: "Fall prevention protocols, age-associated frailty management, functional gait improvement, and safe daily life adaptation.",
    tag: "Functional Longevity",
  },
  {
    title: "Post-Operative Recovery",
    desc: "Structured phased recovery protocols following arthroplasty, spinal procedures, and soft tissue reconstructions.",
    tag: "Clinical Phases",
  },
  {
    title: "Women's Health Physiotherapy",
    desc: "Pelvic health rehabilitation, pre/post-natal biomechanical alignment, and core endurance restoration.",
    tag: "Women's Wellness",
  },
  {
    title: "General Physiotherapy",
    desc: "Ergonomic strain mitigation, postural alignment, soft tissue release, and preventative biomechanical screening.",
    tag: "Everyday Health",
  },
];

const AREAS = [
  "Colaba", "Nariman Point", "Churchgate", "Cuffe Parade", "Fort", "Girgaon",
  "Breach Candy", "Pedder Road", "Cumballa Hill", "Malabar Hill", "Marine Lines",
  "Worli", "Lower Parel", "Mahalaxmi", "Mumbai Central",
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Select Your Time Slot",
    desc: "Review real-time open clinical slots and choose between an in-home South Mumbai visit or a secure TeleRehab video consultation.",
  },
  {
    step: "02",
    title: "Comprehensive Evaluation",
    desc: "Dr. Neha conducts an in-depth motor assessment, functional movement audit, and symptom analysis.",
  },
  {
    step: "03",
    title: "Personalized Digital Plan",
    desc: "Receive customized therapy exercises, daily target sets, and instructional video demos directly in your patient portal.",
  },
  {
    step: "04",
    title: "Continuous Progress Tracking",
    desc: "Log daily sessions, record pain & difficulty metrics, and stay connected via AI-guided check-ins between consultations.",
  },
];

export default function Home() {
  const [heroOffset, setHeroOffset] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      // Subtle parallax on larger displays only
      if (window.innerWidth > 768) {
        setHeroOffset(window.scrollY * 0.08);
      } else {
        setHeroOffset(0);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "hidden" }}>
      <ScrollProgressBar />

      {/* Top Navigation */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(248, 249, 250, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-border)",
          transition: "background var(--transition-base)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-teal))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFF",
                boxShadow: "0 2px 8px rgba(29, 83, 74, 0.25)",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--color-ink)",
                whiteSpace: "nowrap",
              }}
            >
              Neuro TeleRehab
            </span>
          </div>

          {/* Desktop Nav */}
          <nav
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              fontSize: 14,
            }}
            className="home-desktop-nav"
          >
            <a href="#specialties" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>Specialties</a>
            <a href="#how-it-works" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>How It Works</a>
            <a href="#about" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>About</a>
            <div style={{ height: 16, width: 1, background: "var(--color-border)" }} />
            <Link to="/login" style={{ color: "var(--color-ink)", fontWeight: 500 }}>Log in</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: "8px 16px" }}>
              Get Started
            </Link>
          </nav>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="home-mobile-toggle"
            aria-label="Toggle navigation menu"
            style={{
              display: "none",
              padding: "8px",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xs)",
              color: "var(--color-ink)",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: "16px 20px 20px",
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 0", color: "var(--color-ink)", fontWeight: 500 }}
            >
              Specialties
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 0", color: "var(--color-ink)", fontWeight: 500 }}
            >
              How It Works
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ padding: "8px 0", color: "var(--color-ink)", fontWeight: 500 }}
            >
              About Dr. Neha
            </a>
            <div style={{ height: 1, background: "var(--color-border-subtle)", margin: "4px 0" }} />
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-outline"
              style={{ justifyContent: "center", width: "100%" }}
            >
              Log in to Portal
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-primary"
              style={{ justifyContent: "center", width: "100%" }}
            >
              Get Started / Sign Up
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          paddingTop: "clamp(32px, 6vw, 64px)",
          paddingBottom: "clamp(40px, 8vw, 80px)",
          background: "radial-gradient(ellipse at 80% 20%, rgba(47, 133, 118, 0.12) 0%, transparent 60%)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              gap: "clamp(28px, 5vw, 56px)",
              alignItems: "center",
            }}
          >
            {/* Left Content */}
            <ScrollReveal from="subtle-up" duration={800}>
              <div
                className="badge"
                style={{
                  marginBottom: 16,
                  padding: "6px 12px",
                  background: "var(--color-brand-teal-glaze)",
                  color: "var(--color-brand-teal)",
                  borderColor: "rgba(36, 107, 95, 0.2)",
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: "normal",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <span className="badge-dot" style={{ background: "var(--color-brand-emerald)" }} />
                Home & Video Physiotherapy · South Mumbai
              </div>

              <h1
                style={{
                  fontSize: "clamp(28px, 4.2vw, 52px)",
                  lineHeight: 1.15,
                  marginTop: 6,
                  marginBottom: 16,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                }}
              >
                Precision Neuro & Physical Rehabilitation.
              </h1>

              <p
                style={{
                  fontSize: "clamp(15px, 1.2vw, 17px)",
                  lineHeight: 1.6,
                  color: "var(--color-ink-secondary)",
                  maxWidth: 540,
                  marginBottom: 28,
                }}
              >
                Dr. Neha Dhanokar brings orthopaedic, neuro, geriatric, post-operative, and
                women's health physiotherapy directly to your door — backed with encrypted
                telehealth follow-ups, structured daily therapy regimens, and continuous progress metrics.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  to="/signup"
                  className="btn btn-primary"
                  style={{
                    padding: "12px 24px",
                    fontSize: 15,
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
                    flex: "1 1 auto",
                    minWidth: "min(100%, 200px)",
                  }}
                >
                  Book Initial Session
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="btn btn-outline"
                  style={{
                    padding: "12px 20px",
                    fontSize: 15,
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                    flex: "1 1 auto",
                    minWidth: "min(100%, 180px)",
                  }}
                >
                  Portal Login
                </Link>
              </div>

              {/* Trust Signal Pillars */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px 20px",
                  marginTop: 32,
                  paddingTop: 20,
                  borderTop: "1px solid var(--color-border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-emerald)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--color-ink-muted)", fontWeight: 500 }}>Google Meet TeleRehab</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-teal)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--color-ink-muted)", fontWeight: 500 }}>Doorstep Home Visits</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-accent)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--color-ink-muted)", fontWeight: 500 }}>DPDP Act 2023 Compliant</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Media Card */}
            <ScrollReveal from="scale" delay={150} duration={850}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  padding: "clamp(8px, 2vw, 12px)",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(240,244,243,0.7))",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 24px 48px -12px rgba(29, 83, 74, 0.16)",
                  transform: `translateY(${heroOffset}px)`,
                  transition: "transform 0.1s ease-out",
                  maxWidth: 460,
                  margin: "0 auto",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    borderRadius: "calc(var(--radius-lg) - 6px)",
                    overflow: "hidden",
                    aspectRatio: "4/5",
                    position: "relative",
                    maxHeight: "520px",
                  }}
                >
                  <img
                    src="https://superphysio-production-physioprofilephotosbucket-ekzoxtzc.s3.us-east-1.amazonaws.com/physios/b4d8d4d8-70d1-709b-ff55-7a642b9ad658/profile/1787220859741.jpg"
                    alt="Dr. Neha Dhanokar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "contrast(1.02) saturate(1.03)",
                    }}
                  />
                  {/* Subtle Gradient Vignette */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "45%",
                      background: "linear-gradient(to top, rgba(17, 26, 28, 0.8) 0%, transparent 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "clamp(14px, 4vw, 24px)",
                    }}
                  >
                    <div style={{ color: "#FFF", fontFamily: "var(--font-display)", fontSize: "clamp(17px, 3.5vw, 20px)", fontWeight: 600 }}>
                      Dr. Neha Dhanokar
                    </div>
                    <div style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 13, marginTop: 2 }}>
                      Clinical Physiotherapist & TeleRehab Lead
                    </div>
                  </div>
                </div>

                {/* Floating Micro-Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 20,
                    background: "var(--color-surface)",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    boxShadow: "var(--shadow-md)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-emerald)" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink)" }}>Active Practice</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Clinical Metrics & Credibility Strip */}
      <section style={{ padding: "16px 0 48px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card glass-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
                padding: "clamp(20px, 4vw, 32px) clamp(16px, 3vw, 24px)",
                gap: "clamp(16px, 3vw, 24px)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              {[
                { val: "2+", label: "Years Experience", sub: "Evidence-based practice" },
                { val: "15", label: "South Mumbai Localities", sub: "Direct home service" },
                { val: "6", label: "Specialty Disciplines", sub: "From neuro to post-op" },
                { val: "7", label: "Days Coverage", sub: "Continuous recovery" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "8px 10px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(28px, 4.5vw, 38px)",
                      fontWeight: 600,
                      color: "var(--color-brand-teal)",
                      lineHeight: 1.1,
                      marginBottom: 4,
                    }}
                  >
                    {stat.val}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 2 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-ink-muted)" }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Specialties Grid */}
      <section id="specialties" style={{ padding: "clamp(32px, 6vw, 64px) 0" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto clamp(28px, 5vw, 48px)" }}>
              <div
                className="badge"
                style={{
                  marginBottom: 10,
                  background: "var(--color-brand-teal-glaze)",
                  color: "var(--color-brand-teal)",
                }}
              >
                Targeted Clinical Care
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", marginBottom: 10 }}>
                Specialized Physical Therapies
              </h2>
              <p style={{ color: "var(--color-ink-secondary)", fontSize: "clamp(14px, 2vw, 16px)" }}>
                Each patient protocol is uniquely customized to anatomical requirements,
                recovery stage, and lifestyle goals.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 20,
            }}
          >
            {SPECIALTIES.map((s, i) => (
              <ScrollReveal key={s.title} from="up" delay={i * 60}>
                <div
                  className="card card-interactive"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "clamp(20px, 3.5vw, 26px)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        fontWeight: 600,
                        color: "var(--color-brand-teal)",
                        background: "var(--color-brand-teal-glaze)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-pill)",
                      }}
                    >
                      {s.tag}
                    </span>
                    <span style={{ color: "var(--color-ink-faint)", fontSize: 16 }}>→</span>
                  </div>
                  <h3 style={{ fontSize: 18, marginBottom: 8, color: "var(--color-ink)" }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--color-ink-muted)", lineHeight: 1.6, flexGrow: 1, margin: 0 }}>
                    {s.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / TeleRehab Workflow */}
      <section id="how-it-works" style={{ padding: "clamp(36px, 6vw, 64px) 0", background: "rgba(47, 133, 118, 0.03)" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto clamp(28px, 5vw, 48px)" }}>
              <div className="badge" style={{ marginBottom: 10, background: "var(--color-brand-accent-soft)", color: "var(--color-brand-accent)" }}>
                Continuous Care Protocol
              </div>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 34px)", marginBottom: 10 }}>
                The TeleRehab Experience
              </h2>
              <p style={{ color: "var(--color-ink-secondary)", fontSize: "clamp(14px, 2vw, 16px)" }}>
                Combining clinical hands-on care in South Mumbai with seamless digital support
                so you never lose momentum during recovery.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
              gap: 20,
            }}
          >
            {WORKFLOW_STEPS.map((w, i) => (
              <ScrollReveal key={w.step} from="up" delay={i * 70}>
                <div
                  className="card"
                  style={{
                    height: "100%",
                    background: "var(--color-surface)",
                    padding: "24px 20px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 28,
                      fontWeight: 600,
                      color: "var(--color-brand-teal)",
                      opacity: 0.4,
                      marginBottom: 12,
                      lineHeight: 1,
                    }}
                  >
                    {w.step}
                  </div>
                  <h3 style={{ fontSize: 16, marginBottom: 8 }}>{w.title}</h3>
                  <p style={{ fontSize: 13, color: "var(--color-ink-muted)", lineHeight: 1.55, margin: 0 }}>
                    {w.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About Dr. Neha Dhanokar */}
      <section id="about" style={{ padding: "clamp(36px, 6vw, 64px) 0" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card glass-panel"
              style={{
                padding: "clamp(24px, 5vw, 44px)",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(237, 243, 241, 0.8), rgba(255, 255, 255, 0.95))",
                border: "1px solid rgba(47, 133, 118, 0.15)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                  gap: "clamp(24px, 4vw, 36px)",
                  alignItems: "center",
                }}
              >
                <div>
                  <div className="badge" style={{ marginBottom: 12, background: "var(--color-brand-teal-glaze)", color: "var(--color-brand-teal)" }}>
                    Physiotherapist & Founder
                  </div>
                  <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", marginBottom: 14 }}>
                    About Dr. Neha Dhanokar
                  </h2>
                  <p style={{ fontSize: "clamp(14px, 1.8vw, 15px)", color: "var(--color-ink)", lineHeight: 1.65, marginBottom: 14 }}>
                    Dr. Neha Dhanokar is a dedicated physiotherapist specialising in Orthopaedic, Neuro,
                    Geriatric, Post-operative, Women's health, and General physiotherapy. With 2+ years of
                    hands-on clinical experience, she combines home visits with telehealth follow-ups
                    to deliver uninterrupted, empathetic patient care across South Mumbai.
                  </p>
                  <p style={{ fontSize: 13, color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
                    Available 7 days a week, every patient consultation includes transparent session notes,
                    carefully adjusted exercise progressions, and video guidance to ensure technique precision.
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--color-surface)",
                    padding: "clamp(16px, 3vw, 24px)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    Practice Snapshot
                  </div>
                  <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Modality</span>
                      <strong style={{ color: "var(--color-ink)" }}>Home Visits & TeleRehab</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Region</span>
                      <strong style={{ color: "var(--color-ink)" }}>South Mumbai, Maharashtra</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Availability</span>
                      <strong style={{ color: "var(--color-brand-emerald)" }}>7 Days / Week</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Google Meet Sync</span>
                      <strong style={{ color: "var(--color-brand-teal)" }}>Automated Integration</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Areas Served Strip */}
      <section style={{ padding: "16px 0 48px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: "clamp(20px, 3vw, 24px)", marginBottom: 6 }}>South Mumbai Home Visit Coverage</h2>
              <p style={{ fontSize: 13, color: "var(--color-ink-muted)" }}>
                Prompt doorstep visits available across key South Mumbai neighbourhoods:
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                maxWidth: 880,
                margin: "0 auto",
              }}
            >
              {AREAS.map((a) => (
                <span
                  key={a}
                  className="badge"
                  style={{
                    fontSize: 12,
                    padding: "5px 12px",
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  📍 {a}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Strong Final CTA Card */}
      <section style={{ padding: "24px 0 64px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "clamp(36px, 6vw, 56px) clamp(20px, 4vw, 32px)",
                background: "linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-teal) 100%)",
                color: "#FFFFFF",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                border: "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  maxWidth: 580,
                  margin: "0 auto",
                }}
              >
                <div
                  className="badge"
                  style={{
                    background: "rgba(255, 255, 255, 0.16)",
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    marginBottom: 14,
                  }}
                >
                  Start Your Recovery
                </div>
                <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", color: "#FFFFFF", marginBottom: 14 }}>
                  Ready to Regain Your Strength?
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "clamp(14px, 2vw, 16px)", marginBottom: 28, lineHeight: 1.6 }}>
                  Create an account in under two minutes to pick an open clinical slot, review
                  your custom therapy plan, and consult with Dr. Neha Dhanokar.
                </p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link
                    to="/signup"
                    className="btn"
                    style={{
                      background: "#FFFFFF",
                      color: "var(--color-brand-primary)",
                      padding: "12px 28px",
                      fontSize: 15,
                      fontWeight: 600,
                      borderRadius: "var(--radius-sm)",
                      flex: "1 1 auto",
                      minWidth: "min(100%, 180px)",
                    }}
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/login"
                    className="btn"
                    style={{
                      background: "transparent",
                      color: "#FFFFFF",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      padding: "12px 24px",
                      fontSize: 15,
                      borderRadius: "var(--radius-sm)",
                      flex: "1 1 auto",
                      minWidth: "min(100%, 140px)",
                    }}
                  >
                    Log In
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "28px 0 36px",
          background: "var(--color-surface)",
          fontSize: 13,
          color: "var(--color-ink-muted)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "var(--color-ink)" }}>
              Neuro TeleRehab
            </span>
            <span>© {new Date().getFullYear()} Dr. Neha Dhanokar. All rights reserved.</span>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link to="/privacy-policy" style={{ color: "var(--color-ink-muted)" }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: "var(--color-ink-muted)" }}>Terms</Link>
            <Link to="/data-request" style={{ color: "var(--color-ink-muted)" }}>Data Rights</Link>
          </div>
        </div>
      </footer>

      {/* Embedded CSS for Home-specific Media Queries */}
      <style>{`
        @media (max-width: 767px) {
          .home-desktop-nav {
            display: none !important;
          }
          .home-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
