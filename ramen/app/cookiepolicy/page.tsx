import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookiepolicy – Sanshō Ramen",
  description: "Hur Sanshō Ramen använder cookies på sin webbplats.",
};

export default function Cookiepolicy() {
  return (
    <div style={{
      maxWidth: 680, margin: "0 auto", padding: "120px 40px 80px",
      fontFamily: "'Quicksand', sans-serif", color: "#1D1D1D", lineHeight: 1.8,
    }}>
      <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#C0392B", marginBottom: 12 }}>Juridik</p>
      <h1 style={{ fontWeight: 700, fontSize: 40, marginBottom: 32, letterSpacing: "0.04em" }}>Cookiepolicy</h1>
      <p style={{ color: "#6B6560", marginBottom: 40, fontSize: 14 }}>Senast uppdaterad: juli 2025</p>

      <Section title="Vad är cookies?">
        Cookies är små textfiler som sparas i din webbläsare när du besöker en webbplats. De används för att sajten ska fungera korrekt och för att vi ska kunna förstå hur den används.
      </Section>

      <Section title="Vilka cookies använder vi?">
        <Table rows={[
          ["Nödvändiga cookies", "Används för inloggning i adminpanelen och för att hålla din session aktiv. Dessa kan inte stängas av.", "Session", "Alltid aktiva"],
          ["Google Analytics (_ga, _gid)", "Samlar in anonym statistik om sidvisningar, trafik och hur besökare navigerar på sajten. Ingen persondata kopplas till enskilda användare.", "2 år / 24 h", "Kräver samtycke"],
        ]} />
      </Section>

      <Section title="Hur hanterar vi ditt samtycke?">
        När du besöker sajten visas en cookie-banner där du kan välja att acceptera eller avböja analytics-cookies. Ditt val sparas lokalt i din webbläsare och gäller i 12 månader. Du kan när som helst ändra ditt val genom att rensa dina webbläsarcookies.
      </Section>

      <Section title="Google Analytics och persondata">
        Vi använder Google Analytics med IP-anonymisering aktiverad. Det innebär att din IP-adress förkortas innan den behandlas av Google. Vi delar inte data med tredje part för marknadsföringssyften.
      </Section>

      <Section title="Dina rättigheter">
        Du har rätt att begära ut, korrigera eller radera persondata vi har om dig. Kontakta oss på <a href="mailto:hej@sanshoramen.se" style={{ color: "#1D1D1D" }}>hej@sanshoramen.se</a> för frågor.
      </Section>

      <Section title="Mer information">
        Läs även vår <a href="/integritetspolicy" style={{ color: "#1D1D1D" }}>integritetspolicy</a> för fullständig information om hur vi behandlar personuppgifter.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, letterSpacing: "0.02em" }}>{title}</h2>
      <div style={{ fontSize: 15, color: "#4a4540" }}>{children}</div>
    </div>
  );
}

function Table({ rows }: { rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #DDD8CE" }}>
            {["Cookie", "Syfte", "Livslängd", "Samtycke"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#6B6560", fontWeight: 600, letterSpacing: "0.05em", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #EDE8DF" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 12px", color: "#4a4540", verticalAlign: "top" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
