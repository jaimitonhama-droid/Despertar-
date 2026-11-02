import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await req.json();
    const { pedidoId, telefone, valor, userId } = body;

    // Validações básicas
    if (!pedidoId || !telefone || !valor || !userId) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Dados incompletos." },
        { status: 400 }
      );
    }

    if (valor !== 25) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Valor inválido." },
        { status: 400 }
      );
    }

    // Verifica se o pedido existe e pertence ao utilizador
    const pedidoRef = adminDb.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const pedidoData = pedidoSnap.data()!;
    if (pedidoData.userId !== userId) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Acesso não autorizado." },
        { status: 403 }
      );
    }

    if (pedidoData.estado === "confirmado") {
      return NextResponse.json(
        { sucesso: false, mensagem: "Este pedido já foi pago." },
        { status: 409 }
      );
    }

    const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL;
    const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY;

    if (!GATEWAY_BASE_URL || !GATEWAY_API_KEY) {
      // Modo de desenvolvimento / sem credenciais
      console.warn("[DESPERTAR] Gateway não configurada. Modo desenvolvimento.");
      await pedidoRef.update({
        estado: "aguardando",
        telefone,
        gatewayRef: `DEV-${Date.now()}`,
        atualizadoEm: new Date().toISOString(),
      });

      return NextResponse.json({
        sucesso: true,
        mensagem: "Pedido criado em modo desenvolvimento.",
        pedidoId,
        modo: "desenvolvimento",
      });
    }

    const gatewayResponse = await fetch(`${GATEWAY_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        msisdn: telefone,
        amount: valor,
        currency: "MZN",
        reference: pedidoId,
        description: "DESPERTAR — Plano de 7 dias",
        callback_url: `${process.env.GATEWAY_CALLBACK_URL || process.env.NEXTAUTH_URL}/api/pagamento/callback`,
      }),
    });

    if (!gatewayResponse.ok) {
      const errData = await gatewayResponse.json().catch(() => ({}));
      console.error("[DESPERTAR] Erro na gateway:", errData);
      return NextResponse.json(
        { sucesso: false, mensagem: "Erro ao iniciar pagamento. Tenta novamente." },
        { status: 502 }
      );
    }

    const gatewayData = await gatewayResponse.json();

    await pedidoRef.update({
      estado: "aguardando",
      telefone,
      gatewayRef: gatewayData.id || gatewayData.reference || pedidoId,
      atualizadoEm: new Date().toISOString(),
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Pedido de pagamento enviado para o teu telemóvel.",
      pedidoId,
    });
  } catch (err) {
    console.error("[DESPERTAR] Erro interno:", err);
    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
