import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ID único para nosso contador na tabela do Supabase.
const COUNTER_ID = "global_moo_counter";

// Cria o cliente Supabase usando as variáveis de ambiente.
// Usamos a 'service_key' aqui porque esta lógica roda no servidor e precisa de acesso total.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // Busca o valor atual do contador no Supabase
    const { data, error } = await supabase
      .from("counters") // Nome da nossa tabela
      .select("clicks")   // Seleciona apenas a coluna 'clicks'
      .eq("id", COUNTER_ID) // Onde o 'id' é o nosso contador global
      .single(); // Esperamos apenas um resultado

    if (error) {
      // Se o contador ainda não existir (pode acontecer na primeira vez), retorna 0
      if (error.code === 'PGRST116') {
         return NextResponse.json({ totalClicks: 0 });
      }
      // Para outros erros do banco, lança a exceção
      throw error;
    }

    return NextResponse.json({
      totalClicks: data?.clicks ?? 0,
    });

  } catch (error: any) {
    console.error("Error getting global counter from Supabase:", error);
    return NextResponse.json(
      { error: "Failed to get counter" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // Chama a função 'increment_clicks' que criamos no Supabase
    const { data, error } = await supabase.rpc('increment_clicks', {
      counter_id: COUNTER_ID
    });

    if (error) {
      // Se houver um erro ao chamar a função, lança a exceção
      throw error;
    }

    // A função RPC retorna o novo valor diretamente
    return NextResponse.json({
      totalClicks: data,
    });

  } catch (error: any) {
    console.error("Error incrementing global counter in Supabase:", error);
    return NextResponse.json(
      { error: "Failed to increment counter" },
      { status: 500 }
    );
  }
}