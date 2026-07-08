export default function Integritetspolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#F5F1E8", fontFamily: "'Quicksand', sans-serif", padding: "120px 24px 80px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;700&display=swap');`}</style>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <a href="/" style={{ fontSize: 13, color: "#6B6560", textDecoration: "none", display: "inline-block", marginBottom: 40 }}>← Back</a>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, letterSpacing: "0.03em" }}>Privacy Policy</h1>
        <p style={{ color: "#6B6560", fontSize: 14, marginBottom: 48 }}>Last updated: July 2026</p>

        <Section title="Who we are">
          <p>Sanshō Ramen is operated by Viktor Ritsvall. We organise pop-up dining events in Skåne, Sweden.</p>
          <p>Contact: <a href="mailto:contact@sanshoramen.se" style={{ color: "#1D1D1D" }}>contact@sanshoramen.se</a></p>
        </Section>

        <Section title="What we collect and why">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #1D1D1D" }}>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Data</th>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Why</th>
                <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 600 }}>Legal basis</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Name, email, phone", "To process your booking and send confirmation", "Contract (Art. 6(1)(b) GDPR)"],
                ["Number of guests, dietary needs", "To prepare and organise the event", "Contract (Art. 6(1)(b) GDPR)"],
                ["Payment card (setup only)", "No-show protection — card is never charged without notice", "Legitimate interest (Art. 6(1)(f) GDPR)"],
                ["Email (newsletter)", "To send news about upcoming events", "Consent (Art. 6(1)(a) GDPR)"],
              ].map(([data, why, basis]) => (
                <tr key={data} style={{ borderBottom: "0.5px solid #DDD8CE" }}>
                  <td style={{ padding: "12px 0", verticalAlign: "top", color: "#1D1D1D", paddingRight: 16 }}>{data}</td>
                  <td style={{ padding: "12px 0", verticalAlign: "top", color: "#6B6560", paddingRight: 16 }}>{why}</td>
                  <td style={{ padding: "12px 0", verticalAlign: "top", color: "#6B6560", fontSize: 12 }}>{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Newsletter">
          <p>We only add you to our mailing list if you actively opt in — either via the newsletter form or by ticking the box when booking. You can unsubscribe at any time via the link at the bottom of every email, or by emailing us.</p>
        </Section>

        <Section title="How long we keep your data">
          <p>Booking data is kept for 12 months after the event for accounting and safety purposes, then deleted. Newsletter subscriptions are kept until you unsubscribe.</p>
        </Section>

        <Section title="Third parties">
          <p>We use the following services that may process your data:</p>
          <ul style={{ paddingLeft: 20, color: "#6B6560", lineHeight: 2 }}>
            <li><strong style={{ color: "#1D1D1D" }}>Supabase</strong> — database hosting (EU region)</li>
            <li><strong style={{ color: "#1D1D1D" }}>Stripe</strong> — payment card verification</li>
            <li><strong style={{ color: "#1D1D1D" }}>Resend</strong> — transactional email</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>Under GDPR you have the right to: access your data, correct it, have it deleted, restrict processing, and withdraw consent at any time. Email us at <a href="mailto:contact@sanshoramen.se" style={{ color: "#1D1D1D" }}>contact@sanshoramen.se</a> to exercise any of these rights.</p>
          <p>You also have the right to lodge a complaint with the Swedish supervisory authority: <a href="https://www.imy.se" target="_blank" rel="noreferrer" style={{ color: "#1D1D1D" }}>Integritetsskyddsmyndigheten (IMY)</a>.</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, letterSpacing: "0.02em" }}>{title}</h2>
      <div style={{ color: "#6B6560", lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </div>
  );
}
