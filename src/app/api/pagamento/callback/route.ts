import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await req.json();

    const GATEWAY_WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET;

    if (GATEWAY_WEBHOOK_SECRET) {
      const assinaturaRecebida =
        req.headers.get("x-gateway-signature") ||
        req.headers.get("x-webhook-token") ||
        "";

      if (assinaturaRecebida !== GATEWAY_WEBHOOK_SECRET) {
        console.warn("[DESPERTAR] Callback com assinatura inválida bloqueado.");
        return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
      }
    }

    const { reference, status, transaction_id } = body;

    if (!reference) {
      return NextResponse.json({ erro: "Referência em falta." }, { status: 400 });
    }

    const mapaEstados: Record<string, string> = {
      SUCCESS: "confirmado",
      COMPLETED: "confirmado",
      FAILED: "recusado",
      CANCELLED: "recusado",
      EXPIRED: "expirado",
    };

    const estadoInterno = mapaEstados[status?.toUpperCase()] || "recusado";

    const pedidoRef = adminDb.collection("pedidos").doc(reference);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
      return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    }

    const pedidoData = pedidoSnap.data()!;

    if (pedidoData.estado === "confirmado") {
      return NextResponse.json({ mensagem: "Pedido já processado." });
    }

    await pedidoRef.update({
      estado: estadoInterno,
      transactionId: transaction_id || null,
      confirmadoEm:
        estadoInterno === "confirmado" ? new Date().toISOString() : null,
      atualizadoEm: new Date().toISOString(),
    });

    if (estadoInterno === "confirmado") {
      await adminDb.collection("resultados").doc(reference).set({
        pedidoId: reference,
        userId: pedidoData.userId,
        categoriaId: pedidoData.categoriaId,
        diasConcluidos: [],
        geradoEm: new Date().toISOString(),
      });
    }

    return NextResponse.json({ mensagem: "Callback processado com sucesso." });
  } catch (err) {
    console.error("[DESPERTAR] Erro no callback:", err);
    return NextResponse.json(
      { erro: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", servico: "DESPERTAR Callback" });
}
