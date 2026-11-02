// Categorias de vícios disponíveis no DESPERTAR
export const CATEGORIAS = [
  {
    id: "pornografia",
    titulo: "Pornografia",
    emoji: "🔞",
    descricao: "Quebra o ciclo e recupera o teu foco",
    cor: "#7C3AED",
  },
  {
    id: "celular_tiktok",
    titulo: "Celular / TikTok",
    emoji: "📱",
    descricao: "Retoma o controlo do teu tempo",
    cor: "#0EA5E9",
  },
  {
    id: "aviator_apostas",
    titulo: "Aviator / Apostas",
    emoji: "✈️",
    descricao: "Protege o teu dinheiro e o teu futuro",
    cor: "#EF4444",
  },
  {
    id: "relacionamentos",
    titulo: "Relacionamentos Tóxicos",
    emoji: "❤️",
    descricao: "Liberta-te e reconstrói o teu valor",
    cor: "#EC4899",
  },
  {
    id: "alcool",
    titulo: "Álcool",
    emoji: "🍺",
    descricao: "Recupera a clareza e o controlo",
    cor: "#F59E0B",
  },
  {
    id: "autocontrolo",
    titulo: "Falta de Disciplina",
    emoji: "🎯",
    descricao: "Constrói foco e consistência diária",
    cor: "#10B981",
  },
  {
    id: "dagga_cigarro",
    titulo: "Cigarro",
    emoji: "🚬",
    descricao: "Respira fundo e recupera a tua saúde",
    cor: "#6B7280",
  },
  {
    id: "procrastinacao",
    titulo: "Procrastinação",
    emoji: "⏰",
    descricao: "Passa do adiamento à acção",
    cor: "#F97316",
  },
  {
    id: "comparacao_redes",
    titulo: "Comparação nas Redes",
    emoji: "👀",
    descricao: "Vive a tua própria história",
    cor: "#8B5CF6",
  },
  {
    id: "acucar_sono",
    titulo: "Dormir Tarde",
    emoji: "🌙",
    descricao: "Recupera o teu sono e a tua energia",
    cor: "#14B8A6",
  },
];

// Motor de análise — combina as respostas e monta o texto personalizado
export function analisarRespostas(
  categoriaId: string,
  respostas: Record<number, string>
): string {
  // Determina o nível de gravidade (1=leve, 2=moderado, 3=grave, 4=severo)
  const indices = Object.values(respostas);
  const pontuacao = indices.reduce((acc, r) => {
    const mapa: Record<string, number> = { a: 1, b: 2, c: 3, d: 4 };
    return acc + (mapa[r] || 1);
  }, 0);
  const media = pontuacao / indices.length;

  if (media <= 1.5) return "leve";
  if (media <= 2.5) return "moderado";
  if (media <= 3.5) return "grave";
  return "severo";
}

// Textos de análise personalizados por nível
export function getNivelTexto(nivel: string): string {
  const textos: Record<string, string> = {
    leve:
      "As tuas respostas indicam que ainda tens um nível considerável de controlo sobre este hábito. Estás numa fase em que a mudança é mais fácil e os resultados podem surgir rapidamente com as orientações certas.",
    moderado:
      "As tuas respostas revelam um padrão que já está a afectar a tua rotina de forma consistente. Não está fora do teu controlo — mas sem acção agora, tende a aprofundar-se. Este é o momento certo para agir.",
    grave:
      "As tuas respostas mostram que este hábito já tem um peso real na tua vida — na tua energia, nas tuas relações ou nas tuas finanças. A boa notícia: reconheceres isso é o passo mais difícil, e já o deste.",
    severo:
      "As tuas respostas revelam um padrão profundamente enraizado que está a custar-te muito — em tempo, em dinheiro, em bem-estar ou em relações. Não estás sozinho nisto, e mudar é possível. Começa aqui.",
  };
  return textos[nivel] || textos["moderado"];
}

