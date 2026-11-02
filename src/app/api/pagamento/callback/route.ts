import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ erro: "Payload JSON inválido." }, { status: 400 });
    }

    const secret =
      process.env.ZUMBOPAY_WEBHOOK_SECRET ||
      process.env.GATEWAY_WEBHOOK_SECRET;

    // Se houver segredo configurado, valida a assinatura HMAC-SHA256 da ZumboPay
    if (secret) {
      const signatureHeader =
        req.headers.get("x-zumbopay-signature") ||
        req.headers.get("x-signature") ||
        "";

      if (signatureHeader) {
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(rawBody)
          .digest("hex");

        const sigBuffer = Buffer.from(signatureHeader, "hex");
        const expBuffer = Buffer.from(expectedSignature, "hex");

        if (
          sigBuffer.length !== expBuffer.length ||
          !crypto.timingSafeEqual(sigBuffer, expBuffer)
        ) {
          console.warn("[DESPERTAR Webhook] Assinatura HMAC inválida.");
          return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
        }
      }
    }

    // Extrai evento e dados (ZumboPay envia { event: "payment.succeeded", data: {...} })
    const event = body.event || body.type || "";
    const data = body.data || body;

    // Identifica o ID do pedido que foi enviado em source_id ou reference
    const pedidoId =
      data.source_id ||
      data.reference ||
      body.source_id ||
      body.reference;

    if (!pedidoId) {
      console.warn("[DESPERTAR Webhook] Evento recebido sem pedidoId/source_id:", body);
      return NextResponse.json({ recebido: true, nota: "Sem pedidoId" });
    }

    const adminDb = getAdminDb();
    const pedidoRef = adminDb.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
      console.warn(`[DESPERTAR Webhook] Pedido ${pedidoId} não encontrado no Firestore.`);
      return NextResponse.json({ recebido: true, nota: "Pedido inexistente" });
    }

    const pedidoData = pedidoSnap.data()!;

    // Determina se o pagamento teve sucesso ou falhou
    const isSuccess =
      event === "payment.succeeded" ||
      event === "charge.succeeded" ||
      data.status === "succeeded" ||
      data.status === "SUCCESS" ||
      data.status === "COMPLETED";

    const isFailed =
      event === "payment.failed" ||
      data.status === "failed" ||
      data.status === "FAILED" ||
      data.status === "CANCELLED";

    if (isSuccess) {
      if (pedidoData.estado === "confirmado") {
        return NextResponse.json({ mensagem: "Pedido já confirmado anteriormente." });
      }

      const transacaoId = data.id || data.transaction_id || `TX-${Date.now()}`;

      await pedidoRef.update({
        estado: "confirmado",
        transacaoId,
        confirmadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      });

      // Inicializa o resultado do plano para desbloqueio imediato
      await adminDb.collection("resultados").doc(pedidoId).set({
        pedidoId,
        telefone: pedidoData.telefone,
        categoriaId: pedidoData.categoriaId,
        diasConcluidos: [],
        geradoEm: new Date().toISOString(),
      }, { merge: true });

      console.log(`[DESPERTAR Webhook] Pagamento confirmado com sucesso para pedido: ${pedidoId}`);
    } else if (isFailed) {
      await pedidoRef.update({
        estado: "recusado",
        motivoRecusa: data.failure_reason || "Falha na transação M-Pesa",
        atualizadoEm: new Date().toISOString(),
      });
      console.log(`[DESPERTAR Webhook] Pagamento recusado para pedido: ${pedidoId}`);
    }

    return NextResponse.json({ recebido: true, status: "processado" });
  } catch (err) {
    console.error("[DESPERTAR Webhook] Erro ao processar callback:", err);
    return NextResponse.json({ erro: "Erro interno no processamento." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    servico: "DESPERTAR ZumboPay Webhook",
    timestamp: new Date().toISOString(),
  });
}
