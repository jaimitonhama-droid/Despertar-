"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Categoria, Pergunta } from "@/types";

export default function QuestionarioPage() {
  const router = useRouter();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [perguntaActual, setPerguntaActual] = useState(1);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const categoriaId = sessionStorage.getItem("categoriaId");
    if (!categoriaId) { router.replace("/escolha"); return; }

    const respostasGuardadas = sessionStorage.getItem("respostas");
    const perguntaGuardada = sessionStorage.getItem("perguntaActual");
    const resObj = respostasGuardadas ? JSON.parse(respostasGuardadas) : {};
    const pergNum = perguntaGuardada ? parseInt(perguntaGuardada) : 1;
    setRespostas(resObj);
    setPerguntaActual(pergNum);

    import(`@/data/${categoriaId}.json`)
      .then((mod) => {
        setCategoria(mod.default as Categoria);
        setLoading(false);
        setRespostaSelecionada(resObj[pergNum] || null);
      })
      .catch(() => router.replace("/escolha"));
  }, [router]);

  if (loading || !categoria) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0A0F1E",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "14px",
      }}>
        <span style={{ fontSize: "40px" }}>🌅</span>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>
          A carregar...
        </p>
      </div>
    );
  }

  const total = categoria.perguntas.length;
  const progresso = Math.round((perguntaActual / total) * 100);
  const pergunta: Pergunta = categoria.perguntas[perguntaActual - 1];

  const handleSelecionar = (opcaoId: string) => {
    setRespostaSelecionada(opcaoId);
    const novas = { ...respostas, [perguntaActual]: opcaoId };
    setRespostas(novas);
    sessionStorage.setItem("respostas", JSON.stringify(novas));
  };

  const handleContinuar = () => {
    if (!respostaSelecionada) return;
    setAnimating(true);
    setTimeout(() => {
      if (perguntaActual < total) {
        const prox = perguntaActual + 1;
        setPerguntaActual(prox);
        sessionStorage.setItem("perguntaActual", prox.toString());
        setRespostaSelecionada(respostas[prox] || null);
      } else {
        sessionStorage.setItem("completado", "true");
        router.push("/pagamento");
      }
      setAnimating(false);
    }, 250);
  };

  const handleVoltar = () => {
    if (perguntaActual === 1) router.push("/escolha");
    else {
      const ant = perguntaActual - 1;
      setPerguntaActual(ant);
      sessionStorage.setItem("perguntaActual", ant.toString());
      setRespostaSelecionada(respostas[ant] || null);
    }
  };

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0A0F1E 0%, #101B32 100%)",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: "white",
      display: "flex",
      flexDirection: "column",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      {/* HEADER */}
      <header style={{
        padding: "16px 20px 0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        position: "sticky",
        top: 0,
        background: "rgba(10,15,30,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 50,
      }}>
        <button onClick={handleVoltar} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: "22px", cursor: "pointer", padding: "4px 8px 4px 0",
          display: "flex", alignItems: "center",
        }}>←</button>
        <span style={{ fontSize: "18px" }}>🌅</span>
        <span style={{ fontWeight: 800, color: "#F4C542", fontSize: "14px", letterSpacing: "1.5px" }}>DESPERTAR</span>
        <span style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          {categoria.emoji} {categoria.titulo}
        </span>
      </header>

      {/* BARRA DE PROGRESSO */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ maxWidth: "440px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              Pergunta {perguntaActual} de {total}
            </span>
            <span style={{ fontSize: "12px", color: "#F4C542", fontWeight: 700 }}>
              {progresso}%
            </span>
          </div>
          {/* Barra */}
          <div style={{
            height: "5px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "100px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${progresso}%`,
              background: "#F4C542",
              borderRadius: "100px",
              transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 0 10px rgba(244,197,66,0.5)",
            }} />
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{
        flex: 1,
        maxWidth: "440px",
        margin: "0 auto",
        padding: "24px 16px 32px",
        width: "100%",
        boxSizing: "border-box",
        opacity: animating ? 0 : 1,
        transition: "opacity 0.2s",
      }}>
        {/* PERGUNTA */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px",
          padding: "20px 18px",
          marginBottom: "18px",
        }}>
          <p style={{
            fontSize: "16px",
            fontWeight: 700,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.95)",
            margin: 0,
          }}>
            {pergunta.pergunta}
          </p>
        </div>

        {/* OPÇÕES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {pergunta.opcoes.map((opcao) => {
            const sel = respostaSelecionada === opcao.id;
            return (
              <button
                key={opcao.id}
                onClick={() => handleSelecionar(opcao.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "15px 16px",
                  borderRadius: "14px",
                  border: sel ? "2px solid #F4C542" : "1.5px solid rgba(255,255,255,0.08)",
                  background: sel ? "rgba(244,197,66,0.12)" : "rgba(255,255,255,0.03)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                  minHeight: "54px",
                }}
              >
                {/* Indicador */}
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: sel ? "2px solid #F4C542" : "2px solid rgba(255,255,255,0.25)",
                  background: sel ? "#F4C542" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}>
                  {sel && <span style={{ color: "#0A0F1E", fontSize: "11px", fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: "14px", lineHeight: 1.45, fontWeight: sel ? 600 : 400, color: "rgba(255,255,255,0.9)" }}>
                  {opcao.texto}
                </span>
              </button>
            );
          })}
        </div>

        {/* BOTÃO CONTINUAR */}
        <button
          onClick={handleContinuar}
          disabled={!respostaSelecionada}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            border: "none",
            fontWeight: 800,
            fontSize: "14px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            cursor: respostaSelecionada ? "pointer" : "not-allowed",
            background: respostaSelecionada ? "#F4C542" : "rgba(255,255,255,0.08)",
            color: respostaSelecionada ? "#0A0F1E" : "rgba(255,255,255,0.3)",
            boxShadow: respostaSelecionada ? "0 0 25px rgba(244,197,66,0.25)" : "none",
            transition: "all 0.2s",
          }}
        >
          {perguntaActual === total ? "Ver Meu Resultado →" : "Continuar →"}
        </button>
      </div>
    </main>
  );
}
