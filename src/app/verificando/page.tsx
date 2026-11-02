"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { EstadoPagamento } from "@/types";
import { Suspense } from "react";

function VerificandoConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedido");
  const [estado, setEstado] = useState<EstadoPagamento>("aguardando");
  const [segundos, setSegundos] = useState(0);

  const handleEstado = useCallback((novoEstado: EstadoPagamento) => {
    setEstado(novoEstado);
    if (novoEstado === "confirmado") {
      setTimeout(() => router.push(`/resultado?pedido=${pedidoId}`), 1200);
    }
  }, [router, pedidoId]);

  useEffect(() => {
    if (!pedidoId) {
      router.replace("/escolha");
      return;
    }

    const unsub = onSnapshot(doc(db, "pedidos", pedidoId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        handleEstado(data.estado as EstadoPagamento);
      }
    });

    const interval = setInterval(() => {
      setSegundos((s) => s + 1);
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [pedidoId, router, handleEstado]);

  const mensagens: Record<EstadoPagamento, { emoji: string; titulo: string; desc: string; cor: string }> = {
    aguardando: {
      emoji: "📱",
      titulo: "Confirma no teu telemóvel",
      desc: "Enviámos um pedido M-Pesa / e-Mola de 25 MT. Introduz o teu PIN no ecrã para validar o teu despertar.",
      cor: "#F4C542",
    },
    processando: {
      emoji: "⏳",
      titulo: "A validar confirmação...",
      desc: "O pagamento está a ser processado pela rede móvel. Fica nesta página por alguns segundos.",
      cor: "#38BDF8",
    },
    confirmado: {
      emoji: "✅",
      titulo: "Pagamento Confirmado!",
      desc: "A carregar a tua mensagem pessoal e o teu plano de 7 dias...",
      cor: "#10B981",
    },
    recusado: {
      emoji: "❌",
      titulo: "Pagamento Não Concluído",
      desc: "O pedido expirou ou foi cancelado no telemóvel. Podes tentar novamente sem perder as tuas respostas.",
      cor: "#EF4444",
    },
    expirado: {
      emoji: "⌛",
      titulo: "Tempo Limite Atingido",
      desc: "Não recebemos a resposta a tempo. Clica abaixo para reenviar o pedido de 25 MT.",
      cor: "#94A3B8",
    },
  };

  const info = mensagens[estado];

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "white",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontSize: "20px" }}>🌅</span>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "2px" }}>DESPERTAR</span>
      </header>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}>
        <div style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
          
          {/* ÍCONE COM GLOW */}
          <div style={{
            fontSize: "64px",
            marginBottom: "20px",
            filter: "drop-shadow(0 0 24px rgba(244,197,66,0.3))",
          }}>
            {info.emoji}
          </div>

          <h1 style={{
            fontSize: "22px",
            fontWeight: 800,
            marginBottom: "12px",
            lineHeight: 1.3,
          }}>
            {info.titulo}
          </h1>

          <p style={{
            fontSize: "14px",
            color: "rgba(255,255,255,0.6)",
            lineHeight: 1.6,
            marginBottom: "28px",
          }}>
            {info.desc}
          </p>

          {/* STATUS BOX */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "18px",
            padding: "16px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: info.cor,
                boxShadow: `0 0 10px ${info.cor}`,
              }} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: info.cor, textTransform: "capitalize" }}>
                {estado}
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              {segundos}s
            </span>
          </div>

          {/* INSTRUÇÕES SIMPLES */}
          {(estado === "aguardando" || estado === "processando") && (
            <div style={{
              background: "rgba(244,197,66,0.05)",
              border: "1px solid rgba(244,197,66,0.15)",
              borderRadius: "16px",
              padding: "18px",
              textAlign: "left",
            }}>
              <p style={{ fontSize: "12px", color: "#F4C542", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
                Instruções no telemóvel:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                <div>1. Desbloqueia o teu ecrã.</div>
                <div>2. Aceita a notificação USSD de 25 MT.</div>
                <div>3. Digita o teu PIN do M-Pesa / e-Mola.</div>
              </div>
            </div>
          )}

          {(estado === "recusado" || estado === "expirado") && (
            <button
              onClick={() => router.push("/pagamento")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: "#F4C542",
                color: "#0A0F1E",
                fontWeight: 800,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: "pointer",
                boxShadow: "0 0 25px rgba(244,197,66,0.3)",
              }}
            >
              Tentar Novamente
            </button>
          )}

        </div>
      </div>
    </main>
  );
}

export default function VerificandoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "40px" }}>🌅</span>
      </div>
    }>
      <VerificandoConteudo />
    </Suspense>
  );
}
