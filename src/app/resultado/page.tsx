"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Categoria, DiaPlano } from "@/types";
import { analisarRespostas, getNivelTexto, CATEGORIAS } from "@/data/engine";
import { Suspense } from "react";

function ResultadoConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const pedidoId = params.get("pedido");
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [nivel, setNivel] = useState("moderado");
  const [diasConcluidos, setDiasConcluidos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const carregarResultado = useCallback(async () => {
    if (!pedidoId) {
      router.replace("/escolha");
      return;
    }

    try {
      const pedidoSnap = await getDoc(doc(db, "pedidos", pedidoId));
      if (!pedidoSnap.exists()) {
        router.replace("/escolha");
        return;
      }

      const pedido = pedidoSnap.data();

      if (pedido.estado !== "confirmado" && pedido.gatewayRef?.startsWith("DEV-") !== true) {
        router.replace(`/verificando?pedido=${pedidoId}`);
        return;
      }

      const mod = await import(`@/data/${pedido.categoriaId}.json`);
      setCategoria(mod.default as Categoria);

      const n = analisarRespostas(pedido.categoriaId, pedido.respostas);
      setNivel(n);

      const resultadoSnap = await getDoc(doc(db, "resultados", pedidoId));
      if (resultadoSnap.exists()) {
        setDiasConcluidos(resultadoSnap.data().diasConcluidos || []);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      router.replace("/escolha");
    }
  }, [pedidoId, router]);

  useEffect(() => {
    carregarResultado();
  }, [carregarResultado]);

  const toggleDia = async (dia: number) => {
    const novos = diasConcluidos.includes(dia)
      ? diasConcluidos.filter((d) => d !== dia)
      : [...diasConcluidos, dia];
    setDiasConcluidos(novos);

    if (pedidoId) {
      try {
        await updateDoc(doc(db, "resultados", pedidoId), {
          diasConcluidos: novos,
        });
      } catch {
        // Ignora silenciosamente
      }
    }
  };

  const copiarMensagem = () => {
    if (!categoria) return;
    const catInfo = CATEGORIAS.find((c) => c.id === categoria.id);
    const linhas = [
      `🌅 MENSAGEM DO TEU DESPERTAR`,
      `Foco: ${catInfo?.emoji || ""} ${categoria.titulo}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Olá. Analisámos as tuas 7 respostas com atenção. Aqui está o teu plano prático de 7 dias:`,
      ``,
      `📊 DIAGNÓSTICO DO TEU HÁBITO:`,
      categoria.plano.analise_intro,
      ``,
      getNivelTexto(nivel),
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📅 O TEU PLANO DE 7 DIAS:`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      ...categoria.plano.dias.flatMap((dia) => [
        `▶️ ${dia.titulo.toUpperCase()}`,
        `🎯 Objectivo: ${dia.objetivo}`,
        `💡 Como fazer: ${dia.explicacao}`,
        `⚡ Tarefa do dia: ${dia.tarefa}`,
        `🛡️ Desafio de autocontrolo: ${dia.desafio}`,
        `🌙 Reflexão da noite: ${dia.reflexao}`,
        `───────────────────────────`,
        ``,
      ]),
      `💬 PALAVRA FINAL:`,
      `"${categoria.plano.mensagem_final}"`,
      ``,
      `🌅 DESPERTAR — Tudo que precisas já está na tua mente.`,
    ];

    navigator.clipboard.writeText(linhas.join("\n")).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  if (loading || !categoria) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0A0F1E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
      }}>
        <span style={{ fontSize: "40px" }}>🌅</span>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>
          A preparar a tua mensagem...
        </p>
      </div>
    );
  }

  const catInfo = CATEGORIAS.find((c) => c.id === categoria.id);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      paddingBottom: "env(safe-area-inset-bottom, 36px)",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        background: "rgba(10,15,30,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>🌅</span>
          <span style={{ fontWeight: 800, color: "#F4C542", letterSpacing: "1.5px", fontSize: "15px" }}>DESPERTAR</span>
        </div>
        <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
          Desbloqueado
        </span>
      </header>

      <div style={{ maxWidth: "440px", margin: "0 auto", padding: "24px 16px 48px", boxSizing: "border-box" }}>
        
        {/* CABEÇALHO DA MENSAGEM */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "20px 18px",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span style={{ fontSize: "26px" }}>{catInfo?.emoji}</span>
            <div>
              <p style={{ fontSize: "10px", color: "#F4C542", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, margin: 0 }}>
                A Tua Mensagem Pessoal
              </p>
              <h1 style={{ fontSize: "17px", fontWeight: 800, margin: "2px 0 0" }}>
                {categoria.plano.titulo}
              </h1>
            </div>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: "0 0 14px" }}>
            Copia esta mensagem para o teu WhatsApp ou notas para reler durante a tua semana.
          </p>

          <button
            onClick={copiarMensagem}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: copiado ? "#10B981" : "#F4C542",
              color: "#0A0F1E",
              fontWeight: 800,
              fontSize: "13px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 0 20px rgba(244,197,66,0.25)",
            }}
          >
            {copiado ? "✓ Mensagem Copiada!" : "📋 Copiar Toda a Mensagem"}
          </button>
        </div>

        {/* DIAGNÓSTICO */}
        <div style={{
          background: "rgba(244,197,66,0.04)",
          border: "1px solid rgba(244,197,66,0.15)",
          borderRadius: "18px",
          padding: "18px 16px",
          marginBottom: "20px",
        }}>
          <p style={{ fontSize: "11px", color: "#F4C542", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px", margin: 0 }}>
            💬 Diagnóstico
          </p>
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.85)", margin: "8px 0 12px" }}>
            {categoria.plano.analise_intro}
          </p>
          <div style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            borderLeft: "3px solid #F4C542",
          }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: 0 }}>
              {getNivelTexto(nivel)}
            </p>
          </div>
        </div>

        {/* PROGRESSO INTERATIVO DOS 7 DIAS */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>
              🗓️ O Teu Plano de 7 Dias
            </h2>
            <span style={{ fontSize: "11px", color: "#F4C542", fontWeight: 700 }}>
              {diasConcluidos.length} de 7 concluídos
            </span>
          </div>

          <div style={{
            height: "4px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "100px",
            overflow: "hidden",
            marginBottom: "18px",
          }}>
            <div style={{
              height: "100%",
              width: `${(diasConcluidos.length / 7) * 100}%`,
              background: "#10B981",
              transition: "width 0.3s",
            }} />
          </div>

          {/* LISTA DOS 7 DIAS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {categoria.plano.dias.map((dia: DiaPlano) => {
              const feito = diasConcluidos.includes(dia.dia);
              return (
                <div
                  key={dia.dia}
                  style={{
                    background: feito ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.04)",
                    border: feito ? "1.5px solid rgba(16,185,129,0.35)" : "1.5px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    padding: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: feito ? "#10B981" : "rgba(244,197,66,0.15)",
                        color: feito ? "#0A0F1E" : "#F4C542",
                        fontSize: "11px",
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        {feito ? "✓" : dia.dia}
                      </div>
                      <h3 style={{ fontSize: "13px", fontWeight: 700, color: feito ? "#10B981" : "white", margin: 0 }}>
                        {dia.titulo}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleDia(dia.dia)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "100px",
                        border: "none",
                        background: feito ? "#10B981" : "rgba(255,255,255,0.08)",
                        color: feito ? "#0A0F1E" : "rgba(255,255,255,0.6)",
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {feito ? "Feito ✓" : "Concluir"}
                    </button>
                  </div>

                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: "0 0 10px" }}>
                    {dia.explicacao}
                  </p>

                  <div style={{
                    background: "rgba(0,0,0,0.25)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "11px",
                  }}>
                    <div>
                      <span style={{ color: "#F4C542", fontWeight: 700 }}>⚡ Tarefa: </span>
                      <span style={{ color: "rgba(255,255,255,0.85)" }}>{dia.tarefa}</span>
                    </div>
                    <div>
                      <span style={{ color: "#38BDF8", fontWeight: 700 }}>🛡️ Desafio: </span>
                      <span style={{ color: "rgba(255,255,255,0.85)" }}>{dia.desafio}</span>
                    </div>
                    <div>
                      <span style={{ color: "#A855F7", fontWeight: 700 }}>🌙 Reflexão: </span>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>{dia.reflexao}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MENSAGEM FINAL */}
        <div style={{
          background: "rgba(244,197,66,0.06)",
          border: "1px solid rgba(244,197,66,0.2)",
          borderRadius: "16px",
          padding: "20px 16px",
          textAlign: "center",
          marginBottom: "20px",
        }}>
          <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>🌅</span>
          <p style={{
            fontSize: "13px",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.6,
            margin: 0,
          }}>
            &quot;{categoria.plano.mensagem_final}&quot;
          </p>
        </div>

        {/* BOTÃO COPIAR FINAL */}
        <button
          onClick={copiarMensagem}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            background: "#F4C542",
            color: "#0A0F1E",
            fontWeight: 800,
            fontSize: "14px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 0 25px rgba(244,197,66,0.3)",
          }}
        >
          {copiado ? "✓ Mensagem Copiada!" : "📋 Copiar Toda a Mensagem"}
        </button>

      </div>
    </main>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "36px" }}>🌅</span>
      </div>
    }>
      <ResultadoConteudo />
    </Suspense>
  );
}
