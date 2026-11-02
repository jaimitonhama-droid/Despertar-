"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    if (!user) {
      await signInWithGoogle();
      return;
    }

    const numeroLimpo = telefone.replace(/\D/g, "");
    if (!numeroLimpo || numeroLimpo.length !== 9 || (!numeroLimpo.startsWith("84") && !numeroLimpo.startsWith("85"))) {
      setErro("Digita um número M-Pesa válido (84 ou 85).");
      return;
    }

    setErro("");
    setEstado("processando");

    try {
      const respostas = JSON.parse(sessionStorage.getItem("respostas") || "{}");
      const pedidoRef = await addDoc(collection(db, "pedidos"), {
        userId: user.uid,
        userEmail: user.email,
        categoriaId,
        respostas,
        valor: 25,
        moeda: "MT",
        metodo: "m-pesa",
        telefone: numeroLimpo,
        estado: "aguardando",
        criadoEm: serverTimestamp(),
      });

      const res = await fetch("/api/pagamento/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId: pedidoRef.id,
          telefone: numeroLimpo,
          valor: 25,
          userId: user.uid,
          metodo: "m-pesa",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem || "Erro ao conectar.");

      sessionStorage.setItem("pedidoId", pedidoRef.id);
      router.push(`/verificando?pedido=${pedidoRef.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar.";
      setErro(msg);
      setEstado("idle");
    }
  };

  if (!categoriaId) return null;

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "14px 16px 20px",
      boxSizing: "border-box",
    }}>
      {/* HEADER COMPACTO */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "18px", cursor: "pointer", padding: 0,
        }}>←</button>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "1.5px", fontSize: "13px" }}>
          DESPERTAR
        </span>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
          Passo 2 de 2
        </span>
      </header>

      {/* BLOCO PRINCIPAL */}
      <div style={{ maxWidth: "400px", margin: "0 auto", width: "100%" }}>

        {/* CARD DE CONTEXTO: O QUE A PESSOA ESTÁ A PAGAR */}
        <div style={{
          background: "rgba(244,197,66,0.05)",
          border: "1px solid rgba(244,197,66,0.2)",
          borderRadius: "16px",
          padding: "14px 16px",
          margin: "12px 0",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "#F4C542", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              🔒 Plano Pronto para Desbloqueio
            </span>
            <span style={{ fontSize: "12px" }}>{catInfo?.emoji}</span>
          </div>

          <h2 style={{ fontSize: "15px", fontWeight: 800, margin: "0 0 6px", lineHeight: 1.3 }}>
            Plano de 7 dias: {catInfo?.titulo}
          </h2>

          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: "0 0 10px" }}>
            Cruzámos as tuas 7 respostas. Paga a taxa única para ler a tua mensagem e aceder às tuas tarefas diárias.
          </p>

          {/* 3 CHIPS COMPACTOS DO QUE ESTÁ INCLUSO */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["✓ Diagnóstico real", "✓ Tarefas de 7 dias", "✓ Desafios diários"].map((tag, i) => (
              <span key={i} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "100px",
                padding: "3px 8px",
                fontSize: "10px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* IDENTIFICAÇÃO GMAIL RÁPIDA */}
        {!user ? (
          <button onClick={signInWithGoogle} style={{
            width: "100%",
            background: "rgba(234,67,53,0.08)",
            border: "1.5px solid rgba(234,67,53,0.25)",
            borderRadius: "12px",
            padding: "9px 12px",
            cursor: "pointer",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "12px",
            boxSizing: "border-box",
          }}>
            <span>✉️ Entrar com Gmail</span>
            <div style={{ display: "flex", gap: "3px" }}>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#EA4335" }} />
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#FBBC05" }} />
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#34A853" }} />
            </div>
          </button>
        ) : (
          <div style={{
            marginBottom: "10px", padding: "6px 10px",
            background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)",
            borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ color: "#16A34A", fontWeight: 900, fontSize: "11px" }}>✓</span>
            <span style={{ fontSize: "11px", color: "#16A34A", fontWeight: 700 }}>
              Sessão iniciada com Gmail
            </span>
          </div>
        )}

        {/* BLOCO DE COBRANÇA M-PESA */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "12px 14px",
          marginBottom: "12px",
        }}>
          {/* TOPO: LOGO M-PESA + VALOR 25 MT */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                background: "#E60000",
                borderRadius: "8px",
                padding: "4px",
                display: "flex",
              }}>
                <Image src="/mpesa.png" alt="M-Pesa" width={32} height={32} style={{ borderRadius: "4px" }} />
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>M-Pesa</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", display: "block" }}>Taxa de desbloqueio</span>
              <span style={{ fontSize: "22px", fontWeight: 900, color: "#F4C542", lineHeight: 1 }}>25 MT</span>
            </div>
          </div>

          {/* INPUT DO NÚMERO */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "13px",
              fontWeight: 800,
              color: "#E60000",
            }}>
              +258
            </span>
            <input
              type="tel"
              value={telefone}
              maxLength={9}
              onChange={e => setTelefone(e.target.value.replace(/\D/g, ""))}
              placeholder="84XXXXXXX ou 85XXXXXXX"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                padding: "12px 12px 12px 52px",
                color: "white",
                fontSize: "15px",
                fontWeight: 700,
                outline: "none",
                fontFamily: "Inter, -apple-system, sans-serif",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#E60000"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>
          <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", margin: "4px 0 0", textAlign: "center" }}>
            Receberás o pop-up no celular para digitar o teu PIN M-Pesa
          </p>
        </div>

        {/* ERRO */}
        {erro && (
          <div style={{
            marginBottom: "10px", padding: "8px 10px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
          }}>
            <p style={{ fontSize: "11px", color: "#EF4444", margin: 0, textAlign: "center" }}>{erro}</p>
          </div>
        )}

        {/* BOTÃO DESBLOQUEAR */}
        <button
          onClick={handlePagar}
          disabled={estado === "processando"}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            fontWeight: 900,
            fontSize: "14px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: estado === "processando" ? "not-allowed" : "pointer",
            background: estado === "processando" ? "rgba(255,255,255,0.1)" : "#E60000",
            color: "#FFFFFF",
            boxShadow: estado === "processando" ? "none" : "0 0 25px rgba(230,0,0,0.35)",
            transition: "all 0.15s",
          }}
        >
          {estado === "processando" ? "A contactar M-Pesa..." : "DESBLOQUEAR PLANO — 25 MT →"}
        </button>

      </div>

      {/* RODAPÉ */}
      <footer style={{ textAlign: "center", paddingTop: "6px" }}>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          🔒 Acesso imediato após confirmação · M-Pesa Moçambique
        </p>
      </footer>
    </main>
  );
}
