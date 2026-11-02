import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await req.json();
    const { pedidoId, telefone, valor } = body;

    // Validações básicas (não exige conta/login)
    if (!pedidoId || !telefone || !valor) {
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

    // Verifica se o pedido existe no Firestore
    const pedidoRef = adminDb.collection("pedidos").doc(pedidoId);
    const pedidoSnap = await pedidoRef.get();

    if (!pedidoSnap.exists) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const pedidoData = pedidoSnap.data()!;

    if (pedidoData.estado === "confirmado") {
      return NextResponse.json(
        { sucesso: false, mensagem: "Este pedido já foi pago." },
        { status: 409 }
      );
    }

    // Configurações ZumboPay
    const ZUMBOPAY_API_KEY =
      process.env.ZUMBOPAY_API_KEY ||
      process.env.GATEWAY_API_KEY ||
      "zk_live_bdd5003908038e3284f64baf535f1ead0f135363791822dd";

    const ZUMBOPAY_WALLET_ID =
      process.env.ZUMBOPAY_WALLET_ID ||
      "71ce5cbe-1131-4a8f-916a-34e8cc363de7"; // Carteira M-Pesa oficial

    const ZUMBOPAY_MERCHANT_ID =
      process.env.ZUMBOPAY_MERCHANT_ID || "MCH_5303E8B8B7";

    // Formata o número para padrão Moçambique internacional (25884... ou 25885...)
    const numLimpo = telefone.replace(/\D/g, "");
    const msisdn = numLimpo.startsWith("258") ? numLimpo : `258${numLimpo}`;

    // Dispara a cobrança via ZumboPay STK Push
    const zumboRes = await fetch("https://zumbopay.com/api/public/v1/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ZUMBOPAY_API_KEY}`,
        "X-Merchant-Id": ZUMBOPAY_MERCHANT_ID,
      },
      body: JSON.stringify({
        wallet_id: ZUMBOPAY_WALLET_ID,
        amount: 25,
        msisdn,
        customer_name: "Cliente Despertar",
        source_id: pedidoId,
      }),
    });

    const zumboData = await zumboRes.json().catch(() => ({}));

    if (!zumboRes.ok) {
      console.error("[DESPERTAR] Erro na resposta ZumboPay:", zumboData);
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            zumboData?.error?.message ||
            "Não foi possível contactar o M-Pesa. Confirma o número Vodacom.",
        },
        { status: 400 }
      );
    }

    // Atualiza pedido no Firestore com a referência da cobrança
    const chargeId = zumboData?.data?.id || zumboData?.id || `ZUMBO-${Date.now()}`;
    await pedidoRef.update({
      estado: "aguardando",
      telefone: numLimpo,
      gatewayRef: chargeId,
      atualizadoEm: new Date().toISOString(),
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: "Pedido M-Pesa enviado com sucesso. Confirma o PIN no teu telemóvel.",
      pedidoId,
      chargeId,
    });
  } catch (err) {
    console.error("[DESPERTAR] Erro no endpoint /api/pagamento/iniciar:", err);
    return NextResponse.json(
      { sucesso: false, mensagem: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
