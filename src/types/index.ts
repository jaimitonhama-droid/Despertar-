// Tipos globais do projeto DESPERTAR

export interface OpcaoResposta {
  id: string; // "a" | "b" | "c" | "d"
  texto: string;
}

export interface Pergunta {
  id: number;
  pergunta: string;
  opcoes: OpcaoResposta[];
}

export interface DiaPlano {
  dia: number;
  titulo: string;
  objetivo: string;
  explicacao: string;
  tarefa: string;
  desafio: string;
  reflexao: string;
}

export interface PlanoCategoria {
  titulo: string;
  analise_intro: string;
  dias: DiaPlano[];
  mensagem_final: string;
}

export interface Categoria {
  id: string;
  titulo: string;
  emoji: string;
  perguntas: Pergunta[];
  plano: PlanoCategoria;
}

export interface CategoriaCard {
  id: string;
  titulo: string;
  emoji: string;
  descricao: string;
  cor: string;
}

// Sessão de questionário do utilizador (guardada temporariamente)
export interface SessaoQuestionario {
  categoriaId: string;
  respostas: Record<number, string>; // { 1: "a", 2: "c", ... }
  perguntaActual: number;
  completado: boolean;
}

// Pedido de compra guardado no Firestore
export interface Pedido {
  id: string;                  // Identificador único do pedido
  userId: string;              // UID do utilizador Firebase
  categoriaId: string;
  respostas: Record<number, string>;
  valor: number;               // 99
  moeda: string;               // "MT"
  estado: EstadoPagamento;
  criadoEm: string;            // ISO timestamp
  confirmadoEm?: string;
  telefone?: string;           // Número M-Pesa / e-Mola
  gatewayRef?: string;         // Referência externa da gateway
}

export type EstadoPagamento =
  | "aguardando"
  | "processando"
  | "confirmado"
  | "recusado"
  | "expirado";

// Resultado personalizado guardado no Firestore após pagamento
export interface ResultadoPersonalizado {
  pedidoId: string;
  userId: string;
  categoriaId: string;
  nivel: string;               // "leve" | "moderado" | "grave" | "severo"
  diasConcluidos: number[];    // [1, 2, 3] — dias marcados como concluídos
  geradoEm: string;
}

