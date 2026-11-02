"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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

  const mensagens: Record<EstadoPagamento, { titulo: string; desc: string; cor: string }> = {
    aguardando: {
      titulo: "Confirmação enviada para o M-Pesa",
      desc: "Um pedido de 25 MT foi enviado para o teu número Vodacom. Digita o teu PIN do M-Pesa no ecrã para desbloquear.",
      cor: "#E60000",
    },
    processando: {
      titulo: "A validar com o M-Pesa...",
      desc: "Estamos a aguardar a confirmação da rede. Não feches esta página.",
      cor: "#F4C542",
    },
    confirmado: {
      titulo: "Pagamento Confirmado!",
      desc: "Recebemos o teu pagamento de 25 MT com sucesso. A abrir o teu plano...",
      cor: "#10B981",
    },
    recusado: {
      titulo: "Pagamento Cancelado",
      desc: "A transação M-Pesa foi cancelada ou o PIN foi incorreto. Podes tentar novamente sem perder as tuas respostas.",
      cor: "#EF4444",
    },
    expirado: {
      titulo: "Tempo Limite Atingido",
      desc: "Não recebemos a resposta a tempo. Clica abaixo para reenviar o pedido de 25 MT ao teu M-Pesa.",
      cor: "#94A3B8",
    },
  };

  const info = mensagens[estado];

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ fontSize: "20px" }}>🌅</span>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "2px", fontSize: "16px" }}>DESPERTAR</span>
      </header>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}>
        <div style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
          
          {/* LOGO M-PESA */}
          <div style={{
            display: "inline-block",
            background: "#E60000",
            borderRadius: "20px",
            padding: "10px",
            boxShadow: "0 0 30px rgba(230,0,0,0.35)",
            marginBottom: "20px",
          }}>
            <Image
              src="/mpesa.png"
              alt="M-Pesa"
              width={72}
              height={72}
              style={{ borderRadius: "12px", display: "block" }}
              priority
            />
          </div>

          <h1 style={{
            fontSize: "20px",
            fontWeight: 900,
            marginBottom: "10px",
            lineHeight: 1.3,
          }}>
            {info.titulo}
          </h1>

          <p style={{
            fontSize: "13px",
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.6,
            marginBottom: "24px",
          }}>
            {info.desc}
          </p>

          {/* STATUS BOX */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "14px 18px",
            marginBottom: "20px",
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
              <span style={{ fontSize: "13px", fontWeight: 700, color: info.cor, textTransform: "capitalize" }}>
                {estado === "aguardando" ? "Aguardando PIN..." : estado}
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              {segundos}s
            </span>
          </div>

          {/* INSTRUÇÕES DO CELULAR */}
          {(estado === "aguardando" || estado === "processando") && (
            <div style={{
              background: "rgba(230,0,0,0.06)",
              border: "1px solid rgba(230,0,0,0.2)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "left",
            }}>
              <p style={{ fontSize: "11px", color: "#E60000", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
                Passos no seu celular:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>
                <div>1. Olhe para a tela do seu celular Vodacom.</div>
                <div>2. Aceite o pedido de 25 MT do M-Pesa.</div>
                <div>3. Digite o seu código PIN do M-Pesa.</div>
              </div>
            </div>
          )}

          {(estado === "recusado" || estado === "expirado") && (
            <button
              onClick={() => router.push("/pagamento")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                border: "none",
                background: "#E60000",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
                boxShadow: "0 0 25px rgba(230,0,0,0.35)",
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
      <div style={{ minHeight: "100dvh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "36px" }}>🌅</span>
      </div>
    }>
      <VerificandoConteudo />
    </Suspense>
  );
}
