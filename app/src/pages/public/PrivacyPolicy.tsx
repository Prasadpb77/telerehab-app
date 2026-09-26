import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 40 }}>
      <Link to="/" style={{ fontSize: 13 }}>← Back home</Link>
      <h1 style={{ marginTop: 16 }}>Privacy Policy</h1>
      <p style={{ color: "var(--color-ink-muted)", fontSize: 13 }}>Last updated: 26 September 2026</p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>1. Who we are (Data Fiduciary)</h2>
        <p>
          This website is operated by Dr. Neha Dhanokar's independent physiotherapy practice
          ("we", "us", "the practice"). For the purposes of India's Digital Personal Data
          Protection Act, 2023 ("DPDP Act"), we are the <strong>Data Fiduciary</strong> for
          personal data you provide through this website.
        </p>
        <p>
          Contact for privacy matters (Grievance Officer): <a href="mailto:privacy@example.com">privacy@example.com</a>
          {" "}— replace with the practice's actual monitored email/phone before going live.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>2. What personal data we collect</h2>
        <ul>
          <li><strong>Account details:</strong> full name, email, phone/WhatsApp number, password (stored as a salted hash, never in plain text).</li>
          <li><strong>Clinical details:</strong> condition summary, session notes, exercise plan, and progress logs.</li>
          <li><strong>Booking details:</strong> appointment date/time, visit address (for home visits), and any reason notes you share.</li>
          <li><strong>Communication records:</strong> WhatsApp messages exchanged to confirm or reschedule visits, and video check-in link usage.</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>3. Why we collect it (specified purpose) and your consent</h2>
        <p>Under the DPDP Act, we process your data only for purposes you've separately consented to at signup:</p>
        <ul>
          <li><strong>Account & booking (required):</strong> to create your account, schedule and manage your sessions, and contact you about them.</li>
          <li><strong>Health-related notes (optional):</strong> to let you share context about your condition ahead of a visit.</li>
          <li><strong>Marketing communications (optional):</strong> occasional wellness tips or offers beyond transactional messages.</li>
        </ul>
        <p>You may withdraw consent for any optional purpose at any time (see Section 7).</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>4. AI-assisted session notes</h2>
        <p>
          With your consent, session transcripts may be summarised by an AI assistant into a
          draft note. Your treating therapist always reviews and approves (or edits) this draft
          before it is visible to you — the AI does not diagnose or prescribe treatment.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>5. Google Calendar/Meet</h2>
        <p>
          When a session is confirmed, we create a Google Calendar event (with a Meet link) using
          your name and email as an attendee, under the "account & booking" purpose. Google acts
          as our data processor for this limited purpose only.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>6. Storage, security, and retention</h2>
        <p>
          Your data is stored with Supabase (Postgres) with row-level security so only you and
          your treating therapist can access your records. We retain personal data only as long
          as necessary for the purposes above, or as required by law.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>7. Your rights as a Data Principal</h2>
        <ul>
          <li><strong>Access</strong> a summary of the personal data we hold about you.</li>
          <li><strong>Correct</strong> inaccurate or outdated personal data.</li>
          <li><strong>Erase</strong> personal data no longer necessary for its purpose.</li>
          <li><strong>Withdraw consent</strong> for any optional purpose at any time.</li>
          <li><strong>Nominate</strong> another individual to exercise these rights on your behalf.</li>
          <li><strong>Grievance redressal</strong> — raise a complaint about how we've handled your data.</li>
        </ul>
        <p>
          Exercise any of these via our <Link to="/data-request">data request form</Link>, or by
          emailing our Grievance Officer above. If unresolved, you may approach the Data
          Protection Board of India.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>8. Children's data</h2>
        <p>
          If you book on behalf of a child (under 18), you confirm you are their parent/lawful
          guardian and are providing consent on their behalf, as required under the DPDP Act.
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>9. Changes to this policy</h2>
        <p>Material changes affecting how we use your data will be notified, and fresh consent sought where required.</p>
      </section>
    </div>
  );
}
