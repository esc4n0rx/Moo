import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

// Define o caminho para o nosso "banco de dados" JSON
const jsonPath = path.join(process.cwd(), "data", "counter.json");

// Define a estrutura de dados padrão
interface CounterData {
  totalClicks: number;
  updatedAt: string;
}

/**
 * Função auxiliar para ler os dados do contador do arquivo JSON.
 * Se o arquivo ou diretório não existir, ele será criado com valores padrão.
 */
async function getCounterData(): Promise<CounterData> {
  try {
    const fileData = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(fileData);
  } catch (error: any) {
    // Se o arquivo não existir (ENOENT), criamos um novo
    if (error.code === 'ENOENT') {
      const defaultData: CounterData = {
        totalClicks: 0,
        updatedAt: new Date().toISOString(),
      };
      // Garante que o diretório 'data' exista
      await fs.mkdir(path.dirname(jsonPath), { recursive: true });
      // Escreve o arquivo com os dados padrão
      await fs.writeFile(jsonPath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    // Se for outro erro, lança a exceção
    throw error;
  }
}

export async function GET() {
  try {
    const data = await getCounterData();
    return NextResponse.json({
      totalClicks: data.totalClicks,
    });
  } catch (error) {
    console.error("Error getting global counter:", error);
    return NextResponse.json({ error: "Failed to get counter" }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Lê os dados atuais
    const currentData = await getCounterData();

    // Incrementa o contador
    const updatedData: CounterData = {
      ...currentData,
      totalClicks: currentData.totalClicks + 1,
      updatedAt: new Date().toISOString(),
    };

    // Salva os dados atualizados de volta no arquivo JSON
    await fs.writeFile(jsonPath, JSON.stringify(updatedData, null, 2));

    return NextResponse.json({
      totalClicks: updatedData.totalClicks,
    });
  } catch (error) {
    console.error("Error incrementing global counter:", error);
    return NextResponse.json({ error: "Failed to increment counter" }, { status: 500 });
  }
}