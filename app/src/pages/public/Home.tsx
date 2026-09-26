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

  useEffect(() => {
    function onScroll() {
      // Subtle parallax for the portrait container
      setHeroOffset(window.scrollY * 0.08);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ position: "relative", overflowX: "hidden" }}>
      <ScrollProgressBar />

      {/* Top Navigation */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(248, 249, 250, 0.85)",
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
            padding: "16px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-teal))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFF",
                boxShadow: "0 2px 8px rgba(29, 83, 74, 0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--color-ink)",
              }}
            >
              Neuro TeleRehab
            </span>
          </div>

          <nav style={{ display: "flex", gap: 24, alignItems: "center", fontSize: 14 }}>
            <a href="#specialties" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>Specialties</a>
            <a href="#how-it-works" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>How It Works</a>
            <a href="#about" style={{ color: "var(--color-ink-muted)", fontWeight: 500 }}>About</a>
            <div style={{ height: 16, width: 1, background: "var(--color-border)" }} />
            <Link to="/login" style={{ color: "var(--color-ink)", fontWeight: 500 }}>Log in</Link>
            <Link to="/signup" className="btn btn-primary" style={{ padding: "8px 18px" }}>
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          position: "relative",
          paddingTop: "64px",
          paddingBottom: "80px",
          background: "radial-gradient(ellipse at 80% 20%, rgba(47, 133, 118, 0.12) 0%, transparent 60%)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 56,
              alignItems: "center",
              minHeight: "68vh",
            }}
          >
            {/* Left Content */}
            <ScrollReveal from="subtle-up" duration={800}>
              <div
                className="badge"
                style={{
                  marginBottom: 20,
                  padding: "6px 14px",
                  background: "var(--color-brand-teal-glaze)",
                  color: "var(--color-brand-teal)",
                  borderColor: "rgba(36, 107, 95, 0.2)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span className="badge-dot" style={{ background: "var(--color-brand-emerald)" }} />
                Home & Video Physiotherapy · South Mumbai
              </div>

              <h1
                style={{
                  fontSize: "clamp(34px, 4.2vw, 56px)",
                  lineHeight: 1.12,
                  marginTop: 8,
                  marginBottom: 20,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                }}
              >
                Precision Neuro & Physical Rehabilitation.
              </h1>

              <p
                style={{
                  fontSize: "clamp(16px, 1.2vw, 18px)",
                  lineHeight: 1.6,
                  color: "var(--color-ink-secondary)",
                  maxWidth: 540,
                  marginBottom: 32,
                }}
              >
                Dr. Neha Dhanokar brings orthopaedic, neuro, geriatric, post-operative, and
                women's health physiotherapy directly to your door — backed with encrypted
                telehealth follow-ups, structured daily therapy regimens, and continuous progress metrics.
              </p>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <Link
                  to="/signup"
                  className="btn btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: 15,
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600,
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
                    padding: "14px 24px",
                    fontSize: 15,
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 500,
                  }}
                >
                  Patient & Clinician Portal
                </Link>
              </div>

              {/* Trust Signal Pillars */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 40,
                  paddingTop: 24,
                  borderTop: "1px solid var(--color-border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-emerald)" }} />
                  <span style={{ fontSize: 13, color: "var(--color-ink-muted)", fontWeight: 500 }}>Google Meet TeleRehab</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-teal)" }} />
                  <span style={{ fontSize: 13, color: "var(--color-ink-muted)", fontWeight: 500 }}>Doorstep Home Visits</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-accent)" }} />
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
                  padding: 12,
                  background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(240,244,243,0.7))",
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 24px 48px -12px rgba(29, 83, 74, 0.16)",
                  transform: `translateY(${heroOffset}px)`,
                  transition: "transform 0.1s ease-out",
                }}
              >
                <div
                  style={{
                    borderRadius: "calc(var(--radius-lg) - 6px)",
                    overflow: "hidden",
                    aspectRatio: "4/5",
                    position: "relative",
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
                      height: "40%",
                      background: "linear-gradient(to top, rgba(17, 26, 28, 0.75) 0%, transparent 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "24px",
                    }}
                  >
                    <div style={{ color: "#FFF", fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>
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
                    top: -16,
                    right: 28,
                    background: "var(--color-surface)",
                    padding: "8px 16px",
                    borderRadius: "var(--radius-pill)",
                    boxShadow: "var(--shadow-md)",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-brand-emerald)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>Active Practice</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Clinical Metrics & Credibility Strip */}
      <section style={{ padding: "16px 0 64px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card glass-panel"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                padding: "32px 24px",
                gap: 24,
                borderRadius: "var(--radius-md)",
                textAlign: "center",
              }}
            >
              {[
                { val: "2+", label: "Years Clinical Experience", sub: "Evidence-based practice" },
                { val: "15", label: "South Mumbai Localities", sub: "Direct home service" },
                { val: "6", label: "Specialty Disciplines", sub: "From neuro to post-op" },
                { val: "7", label: "Days Clinical Coverage", sub: "Consistent recovery momentum" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  style={{
                    borderRight: i < 3 ? "1px solid var(--color-border-subtle)" : "none",
                    padding: "0 12px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(32px, 3.5vw, 42px)",
                      fontWeight: 600,
                      color: "var(--color-brand-teal)",
                      lineHeight: 1.1,
                      marginBottom: 6,
                    }}
                  >
                    {stat.val}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", marginBottom: 2 }}>
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
      <section id="specialties" style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 48px" }}>
              <div
                className="badge"
                style={{
                  marginBottom: 12,
                  background: "var(--color-brand-teal-glaze)",
                  color: "var(--color-brand-teal)",
                }}
              >
                Targeted Clinical Care
              </div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 36px)", marginBottom: 12 }}>
                Specialized Physical Therapies
              </h2>
              <p style={{ color: "var(--color-ink-secondary)", fontSize: 16 }}>
                Each patient protocol is uniquely customized to anatomical requirements,
                recovery stage, and lifestyle goals.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {SPECIALTIES.map((s, i) => (
              <ScrollReveal key={s.title} from="up" delay={i * 80}>
                <div
                  className="card card-interactive"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "28px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
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
                    <span style={{ color: "var(--color-ink-faint)", fontSize: 18 }}>→</span>
                  </div>
                  <h3 style={{ fontSize: 19, marginBottom: 10, color: "var(--color-ink)" }}>
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
      <section id="how-it-works" style={{ padding: "40px 0 80px", background: "rgba(47, 133, 118, 0.03)" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
              <div className="badge" style={{ marginBottom: 12, background: "var(--color-brand-accent-soft)", color: "var(--color-brand-accent)" }}>
                Continuous Care Protocol
              </div>
              <h2 style={{ fontSize: "clamp(26px, 3vw, 36px)", marginBottom: 12 }}>
                The TeleRehab Experience
              </h2>
              <p style={{ color: "var(--color-ink-secondary)", fontSize: 16 }}>
                Combining clinical hands-on care in South Mumbai with seamless digital support
                so you never lose momentum during recovery.
              </p>
            </div>
          </ScrollReveal>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 24,
            }}
          >
            {WORKFLOW_STEPS.map((w, i) => (
              <ScrollReveal key={w.step} from="up" delay={i * 90}>
                <div
                  className="card"
                  style={{
                    height: "100%",
                    background: "var(--color-surface)",
                    padding: "28px 24px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      fontWeight: 600,
                      color: "var(--color-brand-teal)",
                      opacity: 0.35,
                      marginBottom: 16,
                      lineHeight: 1,
                    }}
                  >
                    {w.step}
                  </div>
                  <h3 style={{ fontSize: 17, marginBottom: 10 }}>{w.title}</h3>
                  <p style={{ fontSize: 14, color: "var(--color-ink-muted)", lineHeight: 1.55, margin: 0 }}>
                    {w.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* About Dr. Neha Dhanokar */}
      <section id="about" style={{ padding: "60px 0 80px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card glass-panel"
              style={{
                padding: "48px 40px",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(237, 243, 241, 0.8), rgba(255, 255, 255, 0.95))",
                border: "1px solid rgba(47, 133, 118, 0.15)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: 40,
                  alignItems: "center",
                }}
              >
                <div>
                  <div className="badge" style={{ marginBottom: 14, background: "var(--color-brand-teal-glaze)", color: "var(--color-brand-teal)" }}>
                    Physiotherapist & Founder
                  </div>
                  <h2 style={{ fontSize: "clamp(24px, 2.5vw, 32px)", marginBottom: 16 }}>
                    About Dr. Neha Dhanokar
                  </h2>
                  <p style={{ fontSize: 16, color: "var(--color-ink)", lineHeight: 1.65, marginBottom: 16 }}>
                    Dr. Neha Dhanokar is a dedicated physiotherapist specialising in Orthopaedic, Neuro,
                    Geriatric, Post-operative, Women's health, and General physiotherapy. With 2+ years of
                    hands-on clinical experience, she combines home visits with telehealth follow-ups
                    to deliver uninterrupted, empathetic patient care across South Mumbai.
                  </p>
                  <p style={{ fontSize: 14, color: "var(--color-ink-secondary)", lineHeight: 1.6 }}>
                    Available 7 days a week, every patient consultation includes transparent session notes,
                    carefully adjusted exercise progressions, and video guidance to ensure technique precision.
                  </p>
                </div>

                <div
                  style={{
                    background: "var(--color-surface)",
                    padding: 24,
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    Practice Snapshot
                  </div>
                  <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Modality</span>
                      <strong style={{ color: "var(--color-ink)" }}>Home Visits & TeleRehab</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Region</span>
                      <strong style={{ color: "var(--color-ink)" }}>South Mumbai, Maharashtra</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: 8 }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Availability</span>
                      <strong style={{ color: "var(--color-brand-emerald)" }}>7 Days / Week</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-ink-muted)" }}>Google Meet Integration</span>
                      <strong style={{ color: "var(--color-brand-teal)" }}>Automated Link Creation</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Areas Served Strip */}
      <section style={{ padding: "20px 0 60px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, marginBottom: 8 }}>South Mumbai Home Visit Coverage</h2>
              <p style={{ fontSize: 14, color: "var(--color-ink-muted)" }}>
                Prompt doorstep visits available across key South Mumbai neighbourhoods:
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
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
                    fontSize: 13,
                    padding: "6px 14px",
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
      <section style={{ padding: "40px 0 80px" }}>
        <div className="container">
          <ScrollReveal from="up">
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "64px 32px",
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
                    marginBottom: 16,
                  }}
                >
                  Start Your Recovery
                </div>
                <h2 style={{ fontSize: "clamp(28px, 3.2vw, 40px)", color: "#FFFFFF", marginBottom: 16 }}>
                  Ready to Regain Your Strength?
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
                  Create an account in under two minutes to pick an open clinical slot, review
                  your custom therapy plan, and consult with Dr. Neha Dhanokar.
                </p>
                <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                  <Link
                    to="/signup"
                    className="btn"
                    style={{
                      background: "#FFFFFF",
                      color: "var(--color-brand-primary)",
                      padding: "14px 32px",
                      fontSize: 15,
                      fontWeight: 600,
                      borderRadius: "var(--radius-sm)",
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
                      padding: "14px 28px",
                      fontSize: 15,
                      borderRadius: "var(--radius-sm)",
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
          padding: "36px 0 48px",
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
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15, color: "var(--color-ink)" }}>
              Neuro TeleRehab
            </span>
            <span>© {new Date().getFullYear()} Dr. Neha Dhanokar. All rights reserved.</span>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link to="/privacy-policy" style={{ color: "var(--color-ink-muted)" }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: "var(--color-ink-muted)" }}>Terms of Service</Link>
            <Link to="/data-request" style={{ color: "var(--color-ink-muted)" }}>DPDP Data Rights</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
