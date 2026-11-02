import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 60%, #0A0F1E 100%)",
      color: "white",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      display: "flex",
      flexDirection: "column",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>

      {/* HEADER */}
      <header style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>🌅</span>
          <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "2px", color: "#F4C542" }}>
            DESPERTAR
          </span>
        </div>
        <span style={{
          fontSize: "10px",
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontWeight: 600,
        }}>
          Modo Despertar
        </span>
      </header>

      {/* HERO */}
      <section style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "36px 20px 48px",
        maxWidth: "440px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* BADGE */}
        <div style={{
          display: "inline-block",
          background: "rgba(244,197,66,0.12)",
          border: "1px solid rgba(244,197,66,0.25)",
          borderRadius: "100px",
          padding: "5px 14px",
          fontSize: "11px",
          color: "#F4C542",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "24px",
          fontWeight: 700,
        }}>
          Transformação Pessoal
        </div>

        {/* FRASE PRINCIPAL */}
        <h1 style={{
          fontSize: "clamp(24px, 6.5vw, 34px)",
          fontWeight: 900,
          lineHeight: 1.2,
          marginBottom: "16px",
          letterSpacing: "-0.5px",
        }}>
          Tudo que precisas
          <br />
          <span style={{ color: "#F4C542" }}>já está na tua mente.</span>
          <br />
          Só precisas despertar.
        </h1>

        {/* SUBTÍTULO */}
        <p style={{
          fontSize: "15px",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1.6,
          marginBottom: "36px",
          maxWidth: "320px",
        }}>
          Escolhe o teu hábito, responde 7 perguntas e recebe um plano pessoal de 7 dias.
        </p>

        {/* BOTÃO CTA */}
        <Link href="/escolha" style={{
          display: "block",
          width: "100%",
          maxWidth: "340px",
          background: "#F4C542",
          color: "#0A0F1E",
          fontWeight: 900,
          fontSize: "15px",
          padding: "18px 24px",
          borderRadius: "16px",
          textDecoration: "none",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          boxShadow: "0 0 35px rgba(244,197,66,0.25)",
          transition: "all 0.2s",
          boxSizing: "border-box",
        }}>
          Começar Agora →
        </Link>

        {/* FRASE SEM O 99 MT */}
        <p style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.4)",
          marginTop: "14px",
          fontWeight: 500,
        }}>
          Sem julgamentos · 100% privado
        </p>

        {/* MÉTRICAS */}
        <div style={{
          display: "flex",
          gap: "28px",
          marginTop: "44px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "24px",
          width: "100%",
          justifyContent: "center",
        }}>
          {[
            { num: "10", label: "Hábitos" },
            { num: "7", label: "Perguntas" },
            { num: "7 dias", label: "Plano pessoal" },
          ].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#F4C542" }}>{m.num}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
