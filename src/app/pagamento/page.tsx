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

    // Validação específica para M-Pesa (Vodacom Moçambique: 84 ou 85)
    const numeroLimpo = telefone.replace(/\D/g, "");
    if (!numeroLimpo || numeroLimpo.length !== 9 || (!numeroLimpo.startsWith("84") && !numeroLimpo.startsWith("85"))) {
      setErro("Insere um número M-Pesa válido da Vodacom (iniciado por 84 ou 85).");
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
      if (!res.ok) throw new Error(data.mensagem || "Erro ao processar o pagamento.");

      sessionStorage.setItem("pedidoId", pedidoRef.id);
      router.push(`/verificando?pedido=${pedidoRef.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao conectar ao M-Pesa.";
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

        {/* LOGO M-PESA & CABEÇALHO DO CHECKOUT */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
        }}>
          {/* LOGO OFICIAL M-PESA */}
          <div style={{
            display: "inline-block",
            background: "#E60000",
            borderRadius: "16px",
            padding: "8px",
            boxShadow: "0 0 25px rgba(230,0,0,0.3)",
            marginBottom: "12px",
          }}>
            <Image
              src="/mpesa.png"
              alt="M-Pesa"
              width={64}
              height={64}
              style={{ borderRadius: "10px", display: "block" }}
              priority
            />
          </div>

          <h1 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 6px" }}>
            Pagamento via M-Pesa
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Receba o prompt de confirmação diretamente no seu celular Vodacom.
          </p>

          {/* VALOR 25 MT */}
          <div style={{
            marginTop: "16px",
            padding: "12px",
            background: "rgba(244,197,66,0.08)",
            border: "1px solid rgba(244,197,66,0.2)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "11px", color: "#F4C542", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
                Total a Pagar
              </p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
                {catInfo?.emoji} {catInfo?.titulo}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: "#F4C542" }}>25 MT</span>
            </div>
          </div>
        </div>

        {/* PASSO 1: LOGIN GMAIL */}
        {!user ? (
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
              1. Identificação rápida
            </label>
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
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EA4335" opacity="0.15"/>
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="#EA4335" strokeWidth="1.8"/>
                  <path d="M22 6L12 13L2 6" stroke="#EA4335" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#FFFFFF", fontSize: "14px" }}>Entrar com Gmail</span>
              </div>

              {/* 3 PONTINHOS GMAIL */}
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
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
              Necessário para associar e guardar o seu resultado com segurança.
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

        {/* PASSO 2: NÚMERO M-PESA */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
            2. Digite o seu número M-Pesa (Vodacom)
          </label>
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "14px",
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
                background: "rgba(255,255,255,0.06)",
                border: "2px solid rgba(255,255,255,0.12)",
                borderRadius: "14px",
                padding: "16px 16px 16px 58px",
                color: "white",
                fontSize: "16px",
                fontWeight: 700,
                outline: "none",
                fontFamily: "Inter, -apple-system, sans-serif",
                boxSizing: "border-box",
                letterSpacing: "0.5px",
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#E60000"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
            Vais receber um pop-up oficial no telemóvel para digitar o teu PIN M-Pesa.
          </p>
        </div>

        {/* MENSAGEM DE ERRO */}
        {erro && (
          <div style={{
            marginBottom: "16px", padding: "12px 14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px",
          }}>
            <p style={{ fontSize: "12px", color: "#EF4444", margin: 0 }}>{erro}</p>
          </div>
        )}

        {/* BOTÃO PAGAR COM M-PESA */}
        <button
          onClick={handlePagar}
          disabled={estado === "processando"}
          style={{
            width: "100%",
            padding: "18px",
            borderRadius: "16px",
            border: "none",
            fontWeight: 900,
            fontSize: "15px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: estado === "processando" ? "not-allowed" : "pointer",
            background: estado === "processando" ? "rgba(255,255,255,0.1)" : "#E60000",
            color: "#FFFFFF",
            boxShadow: estado === "processando" ? "none" : "0 0 30px rgba(230,0,0,0.35)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {estado === "processando" ? (
            <span>A contactar o M-Pesa...</span>
          ) : (
            <>
              <span>Pagar 25 MT com M-Pesa</span>
              <span>→</span>
            </>
          )}
        </button>

        {/* SEGURANÇA M-PESA */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "5px" }}>
            🔒 Pagamento Seguro
          </span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: "5px" }}>
            ⚡ Processamento em Tempo Real
          </span>
        </div>

      </div>
    </main>
  );
}
