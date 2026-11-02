"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIAS } from "@/data/engine";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PagamentoPage() {
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [categoriaId, setCategoriaId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState<"idle" | "processando" | "erro">("idle");
  const [erro, setErro] = useState("");

  useEffect(() => {
    const id = sessionStorage.getItem("categoriaId");
    const completado = sessionStorage.getItem("completado");
    if (!id || !completado) { router.replace("/escolha"); return; }
    setCategoriaId(id);
  }, [router]);

  const catInfo = CATEGORIAS.find((c) => c.id === categoriaId);

  const handlePagar = async () => {
    if (!user) { await signInWithGoogle(); return; }
    if (!telefone || telefone.length < 9) {
      setErro("Insere um número válido (M-Pesa ou e-Mola).");
      return;
    }
    setErro(""); setEstado("processando");
    try {
      const respostas = JSON.parse(sessionStorage.getItem("respostas") || "{}");
      const pedidoRef = await addDoc(collection(db, "pedidos"), {
        userId: user.uid, userEmail: user.email,
        categoriaId, respostas, valor: 25, moeda: "MT",
        telefone, estado: "aguardando", criadoEm: serverTimestamp(),
      });
      const res = await fetch("/api/pagamento/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedidoId: pedidoRef.id, telefone, valor: 25, userId: user.uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem || "Erro ao processar.");
      sessionStorage.setItem("pedidoId", pedidoRef.id);
      router.push(`/verificando?pedido=${pedidoRef.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado.";
      setErro(msg); setEstado("idle");
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.06)",
    border: "2px solid rgba(255,255,255,0.1)", borderRadius: "14px",
    padding: "16px 16px", color: "white", fontSize: "16px", fontWeight: 600,
    outline: "none", fontFamily: "Inter, -apple-system, sans-serif", boxSizing: "border-box",
  };

  if (!categoriaId) return null;

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      paddingBottom: "env(safe-area-inset-bottom, 32px)",
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
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center",
        }}>←</button>
        <span style={{ fontSize: "20px" }}>🌅</span>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "2px", fontSize: "16px" }}>DESPERTAR</span>
      </header>

      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "24px 16px 40px", boxSizing: "border-box" }}>

        {/* TÍTULO */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontSize: "clamp(20px, 5.5vw, 24px)", fontWeight: 900, lineHeight: 1.25, marginBottom: "8px" }}>
            O teu Despertar<br />
            <span style={{ color: "#F4C542" }}>está prestes a começar!</span>
          </h1>
          {catInfo && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(244,197,66,0.1)", border: "1px solid rgba(244,197,66,0.2)",
              borderRadius: "100px", padding: "5px 12px",
            }}>
              <span>{catInfo.emoji}</span>
              <span style={{ fontSize: "12px", color: "#F4C542", fontWeight: 700 }}>{catInfo.titulo}</span>
            </div>
          )}
        </div>

        {/* CARD DO PRODUTO */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px", padding: "20px 18px", marginBottom: "20px",
        }}>
          <p style={{ fontSize: "11px", color: "#F4C542", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px" }}>
            Inclui no teu plano
          </p>
          {[
            "Análise personalizada das 7 respostas",
            "Identificação dos teus principais gatilhos",
            "Plano de 7 dias com tarefas diárias",
            "Desafios práticos de autocontrolo",
            "Reflexões guiadas para cada noite",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ color: "#F4C542", fontSize: "13px", fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>{item}</span>
            </div>
          ))}

          {/* PREÇO: 25 MT */}
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>100 MT</span>
            <span style={{ fontSize: "32px", fontWeight: 900, color: "#F4C542" }}>25 MT</span>
            <span style={{
              background: "rgba(244,197,66,0.15)", color: "#F4C542",
              fontSize: "10px", fontWeight: 800, padding: "3px 8px",
              borderRadius: "100px", letterSpacing: "1px",
            }}>OFERTA</span>
          </div>
        </div>

        {/* LOGIN POR GMAIL (COM 3 PONTINHOS) */}
        {!user ? (
          <div style={{ marginBottom: "18px" }}>
            <button onClick={signInWithGoogle} style={{
              width: "100%",
              background: "rgba(234,67,53,0.08)",
              border: "1.5px solid rgba(234,67,53,0.3)",
              borderRadius: "14px",
              padding: "14px 16px",
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              boxSizing: "border-box",
              transition: "all 0.2s",
            }}>
              {/* ÍCONE ENVELOPE GMAIL */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EA4335" opacity="0.15"/>
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#EA4335" strokeWidth="1.8"/>
                  <path d="M22 6L12 13L2 6" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#FFFFFF", fontSize: "14px" }}>Entrar com Gmail</span>
              </div>

              {/* OS 3 PONTINHOS DE LOGIN POR GMAIL */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255,255,255,0.08)",
                padding: "4px 8px",
                borderRadius: "8px",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#EA4335", display: "inline-block" }} />
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#FBBC05", display: "inline-block" }} />
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34A853", display: "inline-block" }} />
              </div>
            </button>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: "6px" }}>
              Identificação rápida para guardar o teu plano
            </p>
          </div>
        ) : (
          <div style={{
            marginBottom: "16px", padding: "12px 14px",
            background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ color: "#16A34A", fontWeight: 900, fontSize: "14px" }}>✓</span>
            <p style={{ fontSize: "12px", color: "#16A34A", fontWeight: 700, margin: 0 }}>
              Sessão iniciada com Gmail
            </p>
          </div>
        )}

        {/* CAMPO TELEFONE */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
            Número M-Pesa / e-Mola
          </label>
          <input
            type="tel" value={telefone} maxLength={9}
            onChange={e => setTelefone(e.target.value.replace(/\D/g, ""))}
            placeholder="84xxxxxxx ou 86xxxxxxx"
            style={inp}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#F4C542"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
            Vais receber a notificação no telemóvel para confirmar os 25 MT.
          </p>
        </div>

        {/* ERRO */}
        {erro && (
          <div style={{
            marginBottom: "16px", padding: "12px 14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px",
          }}>
            <p style={{ fontSize: "12px", color: "#EF4444", margin: 0 }}>{erro}</p>
          </div>
        )}

        {/* BOTÃO PAGAR COM 25 MT */}
        <button onClick={handlePagar} disabled={estado === "processando"} style={{
          width: "100%", padding: "16px", borderRadius: "14px", border: "none",
          fontWeight: 900, fontSize: "14px", letterSpacing: "0.5px", textTransform: "uppercase",
          cursor: estado === "processando" ? "not-allowed" : "pointer",
          background: estado === "processando" ? "rgba(255,255,255,0.08)" : "#F4C542",
          color: estado === "processando" ? "rgba(255,255,255,0.3)" : "#0A0F1E",
          boxShadow: estado === "processando" ? "none" : "0 0 25px rgba(244,197,66,0.3)",
          transition: "all 0.2s",
        }}>
          {estado === "processando" ? "⏳ A processar..." : "Desbloquear o Meu Resultado — 25 MT"}
        </button>

        {/* TRUST */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "16px" }}>
          {["🔒 100% Privado", "📱 M-Pesa / e-Mola", "⚡ Imediato"].map((t, i) => (
            <span key={i} style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
    </main>
  );
}
