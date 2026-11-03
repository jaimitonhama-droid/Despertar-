// Helper para atualizar Firestore via REST API oficial do Google
// Funciona 100% no servidor sem precisar de Service Account / chaves privadas de servidor

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "carla-v5";
const API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyBq22BlwDCEO7fDqbEmFMbXznKqQF2BV14";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "number") {
      fields[key] = Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) =>
            typeof v === "number"
              ? { integerValue: v.toString() }
              : { stringValue: String(v) }
          ),
        },
      };
    } else if (typeof value === "object") {
      fields[key] = { mapValue: { fields: toFirestoreFields(value) } };
    }
  }
  return fields;
}

export async function atualizarPedidoFirestore(pedidoId: string, campos: Record<string, any>) {
  try {
    const fields = toFirestoreFields(campos);
    const updateMask = Object.keys(campos)
      .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join("&");

    const url = `${BASE_URL}/pedidos/${encodeURIComponent(pedidoId)}?key=${API_KEY}&${updateMask}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn(`[Firestore REST] Aviso ao atualizar pedido ${pedidoId}:`, err);
    }
    return res.ok;
  } catch (err) {
    console.error(`[Firestore REST] Erro ao atualizar pedido ${pedidoId}:`, err);
    return false;
  }
}

export async function criarResultadoFirestore(pedidoId: string, dados: Record<string, any>) {
  try {
    const fields = toFirestoreFields(dados);
    const url = `${BASE_URL}/resultados/${encodeURIComponent(pedidoId)}?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });

    return res.ok;
  } catch (err) {
    console.error(`[Firestore REST] Erro ao criar resultado ${pedidoId}:`, err);
    return false;
  }
}

