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
      setErro("Digita um número 84 ou 85 válido.");
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
      padding: "16px 20px 24px",
      boxSizing: "border-box",
    }}>
      {/* HEADER COMPACTO */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: "12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "20px", cursor: "pointer", padding: 0,
        }}>←</button>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "1.5px", fontSize: "14px" }}>
          DESPERTAR
        </span>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
          {catInfo?.emoji} {catInfo?.titulo}
        </span>
      </header>

      {/* BLOCO CENTRAL ULTRA-COMPACTO */}
      <div style={{ maxWidth: "380px", margin: "0 auto", width: "100%" }}>
        
        {/* LOGO M-PESA + VALOR DIRETO */}
        <div style={{ textAlign: "center", margin: "14px 0" }}>
          <div style={{
            display: "inline-block",
            background: "#E60000",
            borderRadius: "14px",
            padding: "6px",
            boxShadow: "0 0 20px rgba(230,0,0,0.3)",
            marginBottom: "8px",
          }}>
            <Image
              src="/mpesa.png"
              alt="M-Pesa"
              width={48}
              height={48}
              style={{ borderRadius: "8px", display: "block" }}
              priority
            />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#F4C542", lineHeight: 1 }}>
            25 MT
          </div>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>
            Pagamento via M-Pesa Vodacom
          </p>
        </div>

        {/* IDENTIFICAÇÃO GMAIL COMPACTA */}
        {!user ? (
          <button onClick={signInWithGoogle} style={{
            width: "100%",
            background: "rgba(234,67,53,0.08)",
            border: "1.5px solid rgba(234,67,53,0.3)",
            borderRadius: "12px",
            padding: "10px 14px",
            cursor: "pointer",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "13px",
            fontWeight: 700,
            marginBottom: "14px",
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
            marginBottom: "12px", padding: "8px 12px",
            background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)",
            borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ color: "#16A34A", fontWeight: 900, fontSize: "12px" }}>✓</span>
            <span style={{ fontSize: "11px", color: "#16A34A", fontWeight: 700 }}>
              Sessão iniciada com Gmail
            </span>
          </div>
        )}

        {/* CAMPO TELEFONE M-PESA */}
        <div style={{ marginBottom: "14px" }}>
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
                padding: "14px 14px 14px 56px",
                color: "white",
                fontSize: "16px",
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

        {/* MENSAGEM DE ERRO SE HOUVER */}
        {erro && (
          <div style={{
            marginBottom: "12px", padding: "8px 12px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
          }}>
            <p style={{ fontSize: "11px", color: "#EF4444", margin: 0, textAlign: "center" }}>{erro}</p>
          </div>
        )}

        {/* BOTÃO PRINCIPAL DE PAGAMENTO */}
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
          {estado === "processando" ? "A contactar M-Pesa..." : "PAGAR 25 MT COM M-PESA →"}
        </button>

      </div>

      {/* RODAPÉ MÍNIMO */}
      <footer style={{ textAlign: "center", paddingTop: "8px" }}>
        <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          🔒 Pagamento 100% Seguro · M-Pesa Moçambique
        </p>
      </footer>
    </main>
  );
}
