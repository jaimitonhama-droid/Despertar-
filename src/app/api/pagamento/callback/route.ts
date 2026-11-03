import { NextRequest, NextResponse } from "next/server";
import { atualizarPedidoFirestore, criarResultadoFirestore } from "@/lib/firestore-rest";
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
      process.env.GATEWAY_WEBHOOK_SECRET ||
      "whsec_a8de5d399b8f536754b5a2399fab43dfccca21dfd2671d0f";

    // Validação de assinatura HMAC da ZumboPay
    if (secret) {
      const signatureHeader =
        req.headers.get("x-zumbopay-signature") ||
        req.headers.get("x-signature") ||
        "";

      if (signatureHeader) {
        try {
          const cleanSig = signatureHeader.replace(/^sha256=/, "").trim();
          const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

          const sigBuffer = Buffer.from(cleanSig, "hex");
          const expBuffer = Buffer.from(expectedSignature, "hex");

          if (
            sigBuffer.length !== expBuffer.length ||
            !crypto.timingSafeEqual(sigBuffer, expBuffer)
          ) {
            console.warn("[DESPERTAR Webhook] Assinatura HMAC inválida recebida.");
            return NextResponse.json({ erro: "Assinatura inválida." }, { status: 401 });
          }
        } catch (sigErr) {
          console.warn("[DESPERTAR Webhook] Erro ao comparar assinaturas:", sigErr);
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
      console.warn("[DESPERTAR Webhook] Evento recebido sem pedidoId:", body);
      return NextResponse.json({ recebido: true, nota: "Sem pedidoId" });
    }

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
      const transacaoId = data.id || data.transaction_id || `TX-${Date.now()}`;

      // Atualiza o pedido no Firestore para "confirmado"
      await atualizarPedidoFirestore(pedidoId, {
        estado: "confirmado",
        transacaoId,
        confirmadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      });

      // Cria o resultado para desbloqueio imediato do plano de 7 dias
      await criarResultadoFirestore(pedidoId, {
        pedidoId,
        diasConcluidos: [],
        geradoEm: new Date().toISOString(),
      });

      console.log(`[DESPERTAR Webhook] Pagamento confirmado com sucesso para pedido: ${pedidoId}`);
    } else if (isFailed) {
      await atualizarPedidoFirestore(pedidoId, {
        estado: "recusado",
        motivoRecusa: data.failure_reason || "Transação não concluída no M-Pesa",
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
