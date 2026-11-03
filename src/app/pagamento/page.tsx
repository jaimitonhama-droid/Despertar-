"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CATEGORIAS } from "@/data/engine";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PagamentoPage() {
  const router = useRouter();
  const [categoriaId, setCategoriaId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [estado, setEstado] = useState<"idle" | "processando" | "erro">("idle");
  const [erro, setErro] = useState("");
  const [segundos, setSegundos] = useState(594); // ~9:54 min de urgência suave

  useEffect(() => {
    const id = sessionStorage.getItem("categoriaId");
    const completado = sessionStorage.getItem("completado");
    if (!id || !completado) { router.replace("/escolha"); return; }
    setCategoriaId(id);

    // Se já tinha telefone digitado anteriormente, recupera
    const telSalvo = localStorage.getItem("despertar_telefone");
    if (telSalvo) setTelefone(telSalvo);

    // Timer regressivo suave
    const timer = setInterval(() => {
      setSegundos((prev) => (prev > 10 ? prev - 1 : 10));
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const catInfo = CATEGORIAS.find((c) => c.id === categoriaId);

  const formatarTempo = (totalSeg: number) => {
    const m = Math.floor(totalSeg / 60);
    const s = totalSeg % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handlePagar = async () => {
    const numeroLimpo = telefone.replace(/\D/g, "");
    if (!numeroLimpo || numeroLimpo.length !== 9 || (!numeroLimpo.startsWith("84") && !numeroLimpo.startsWith("85"))) {
      setErro("Insere um número M-Pesa válido da Vodacom (iniciado por 84 ou 85).");
      return;
    }

    setErro("");
    setEstado("processando");

    try {
      const respostas = JSON.parse(sessionStorage.getItem("respostas") || "{}");

      // Salva o telefone no dispositivo do cliente para ele nunca perder o acesso
      localStorage.setItem("despertar_telefone", numeroLimpo);

      // Cria o pedido no Firestore associado diretamente ao número M-Pesa
      const pedidoRef = await addDoc(collection(db, "pedidos"), {
        telefone: numeroLimpo,
        categoriaId,
        respostas,
        valor: 25,
        moeda: "MT",
        metodo: "m-pesa",
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
          metodo: "m-pesa",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.mensagem || "Erro ao conectar ao M-Pesa.");

      // Guarda localmente o ID do pedido
      sessionStorage.setItem("pedidoId", pedidoRef.id);
      localStorage.setItem("despertar_ultimo_pedido", pedidoRef.id);

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
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "14px 18px 20px",
      boxSizing: "border-box",
    }}>
      {/* HEADER COMPACTO COM TIMER DISCRETO */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: "10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => router.back()} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "20px", cursor: "pointer", padding: 0,
        }}>←</button>
        <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "1.5px", fontSize: "14px" }}>
          DESPERTAR
        </span>
        <span style={{
          fontSize: "10px",
          color: "#F4C542",
          background: "rgba(244,197,66,0.1)",
          padding: "3px 8px",
          borderRadius: "100px",
          fontWeight: 700,
        }}>
          ⏳ {formatarTempo(segundos)}
        </span>
      </header>

      {/* BLOCO CENTRAL ULTRA-LIMPO */}
      <div style={{ maxWidth: "380px", margin: "0 auto", width: "100%" }}>

        {/* PROVA SOCIAL SUTIL */}
        <div style={{ textAlign: "center", margin: "6px 0 8px" }}>
          <span style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.65)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "4px 10px",
            borderRadius: "100px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}>
            <span>🔥</span> +1.480 jovens moçambicanos já iniciaram
          </span>
        </div>

        {/* CARD DE RESUMO + TEASER DO DIAGNÓSTICO BLOQUEADO */}
        <div style={{
          background: "rgba(244,197,66,0.05)",
          border: "1px solid rgba(244,197,66,0.22)",
          borderRadius: "16px",
          padding: "12px 14px",
          marginBottom: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", color: "#F4C542", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              🔒 Diagnóstico das 7 Respostas
            </span>
            <span style={{ fontSize: "12px" }}>{catInfo?.emoji}</span>
          </div>

          <h2 style={{ fontSize: "14px", fontWeight: 800, margin: "0 0 6px", lineHeight: 1.25 }}>
            Plano de 7 dias: {catInfo?.titulo}
          </h2>

          {/* TEASER BORRADO (CURIOSIDADE PSICOLÓGICA) */}
          <div style={{
            background: "rgba(0,0,0,0.25)",
            border: "1px dashed rgba(244,197,66,0.3)",
            borderRadius: "10px",
            padding: "8px 10px",
            margin: "6px 0 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>
              <span style={{ color: "#F4C542", fontWeight: 700 }}>Gatilho identificado: </span>
              <span style={{
                filter: "blur(4px)",
                userSelect: "none",
                background: "rgba(255,255,255,0.15)",
                padding: "1px 6px",
                borderRadius: "4px",
              }}>
                Padrão Noturno Crítico
              </span>
            </div>
            <span style={{ fontSize: "11px" }}>🔒</span>
          </div>

          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {["✓ Diagnóstico real", "✓ Tarefas de 7 dias", "✓ Desafios práticos"].map((tag, i) => (
              <span key={i} style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "100px",
                padding: "2px 7px",
                fontSize: "9.5px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ÁREA DE PAGAMENTO M-PESA */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "14px 16px",
          marginBottom: "12px",
        }}>
          {/* LOGO M-PESA + VALOR 25 MT (COM ANCORAGEM) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                background: "#E60000",
                borderRadius: "10px",
                padding: "6px",
                display: "flex",
                boxShadow: "0 0 15px rgba(230,0,0,0.3)",
              }}>
                <Image src="/mpesa.png" alt="M-Pesa" width={34} height={34} style={{ borderRadius: "6px" }} />
              </div>
              <div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "white", display: "block" }}>M-Pesa</span>
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>Vodacom Moçambique</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "9px", color: "#10B981", fontWeight: 700, display: "block", textTransform: "uppercase" }}>
                Menos que 1 recarga
              </span>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#F4C542", lineHeight: 1 }}>25 MT</span>
            </div>
          </div>

          {/* INPUT DO NÚMERO M-PESA */}
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: "5px" }}>
            Digita o teu número M-Pesa:
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
                border: "1.5px solid rgba(255,255,255,0.14)",
                borderRadius: "12px",
                padding: "13px 13px 13px 56px",
                color: "white",
                fontSize: "16px",
                fontWeight: 700,
                outline: "none",
                fontFamily: "Inter, -apple-system, sans-serif",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#E60000"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.14)"}
            />
          </div>

          {/* AVISO DE PRIVACIDADE ABSOLUTA NO EXTRATO */}
          <p style={{
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            margin: "7px 0 0",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}>
            <span>🔒</span> 100% Discreto · No extrato do M-Pesa não aparece o nome do vício
          </p>
        </div>

        {/* MENSAGEM DE ERRO SE HOUVER */}
        {erro && (
          <div style={{
            marginBottom: "10px", padding: "10px 12px",
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
            padding: "15px",
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
          {estado === "processando" ? "A contactar M-Pesa..." : "DESBLOQUEAR PLANO POR 25 MT →"}
        </button>

      </div>

      {/* RODAPÉ MÍNIMO */}
      <footer style={{ textAlign: "center", paddingTop: "6px" }}>
        <p style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          🔒 Pagamento Seguro Vodacom M-Pesa · Sem necessidade de cadastro · Acesso Imediato
        </p>
      </footer>
    </main>
  );
}
