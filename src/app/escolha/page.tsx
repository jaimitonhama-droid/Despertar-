"use client";

import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/data/engine";

export default function EscolhaPage() {
  const router = useRouter();

  const handleEscolha = (categoriaId: string) => {
    sessionStorage.setItem("categoriaId", categoriaId);
    sessionStorage.setItem("respostas", JSON.stringify({}));
    sessionStorage.setItem("perguntaActual", "1");
    router.push("/questionario");
  };

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 60%, #0A0F1E 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      paddingBottom: "env(safe-area-inset-bottom, 24px)",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        background: "rgba(10,15,30,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 50,
      }}>
        <button onClick={() => router.push("/")} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "22px", cursor: "pointer", padding: "4px 8px 4px 0",
          display: "flex", alignItems: "center",
        }}>←</button>
        <span style={{ fontSize: "20px" }}>🌅</span>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "2px", fontSize: "16px" }}>DESPERTAR</span>
      </header>

      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "24px 16px 40px", boxSizing: "border-box" }}>
        {/* TÍTULO */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            fontSize: "clamp(20px, 5.5vw, 26px)",
            fontWeight: 900,
            marginBottom: "8px",
            lineHeight: 1.25,
          }}>
            Qual hábito queres<br />
            <span style={{ color: "#F4C542" }}>superar?</span>
          </h1>
          <p style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.5,
          }}>
            Escolhe o que mais está a afetar a tua vida agora.
          </p>
        </div>

        {/* GRID 2x5 OTIMIZADO PARA TELEMÓVEL */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleEscolha(cat.id)}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "16px 14px",
                cursor: "pointer",
                textAlign: "left",
                color: "white",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                boxSizing: "border-box",
                minHeight: "84px",
                justifyContent: "center",
              }}
              onTouchStart={e => {
                (e.currentTarget as HTMLButtonElement).style.border = "1.5px solid #F4C542";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,197,66,0.1)";
              }}
              onTouchEnd={e => {
                (e.currentTarget as HTMLButtonElement).style.border = "1.5px solid rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
              }}
            >
              <span style={{ fontSize: "24px", display: "block" }}>{cat.emoji}</span>
              <span style={{
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1.25,
                color: "rgba(255,255,255,0.95)",
              }}>
                {cat.titulo}
              </span>
            </button>
          ))}
        </div>

        {/* PRIVACIDADE */}
        <div style={{
          marginTop: "24px",
          textAlign: "center",
          padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5, margin: 0 }}>
            🔒 As tuas respostas são confidenciais e usadas apenas para personalizar o teu plano.
          </p>
        </div>
      </div>
    </main>
  );
}
