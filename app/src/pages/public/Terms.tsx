import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 40 }}>
      <Link to="/" style={{ fontSize: 13 }}>← Back home</Link>
      <h1 style={{ marginTop: 16 }}>Terms of Service</h1>
      <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>Last updated: 26 September 2026</p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Service</h2>
        <p>This website lets you request physiotherapy sessions with Dr. Neha Dhanokar. A request isn't confirmed until the therapist accepts it.</p>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Not a substitute for emergency care</h2>
        <p>This service is for scheduled physiotherapy, not medical emergencies. Contact local emergency services for urgent needs.</p>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Cancellations & rescheduling</h2>
        <p>Either you or the therapist may cancel or reschedule a confirmed session; we'll notify you promptly of any change.</p>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Your data</h2>
        <p>See our <Link to="/privacy-policy">Privacy Policy</Link> for how we handle your data under the DPDP Act, 2023.</p>
      </section>
    </div>
  );
}
