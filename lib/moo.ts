/**
 * Interface para a resposta esperada da API.
 * Ajuda a garantir que estamos recebendo os dados corretos.
 */
interface GlobalCounterResponse {
  totalClicks: number;
}

// URL base da nossa API.
const API_URL = "/api/global-counter";

/**
 * Busca o valor inicial do contador global no servidor.
 * @returns {Promise<number>} O número total de cliques globais.
 */
export async function fetchInitialGlobalCount(): Promise<number> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    const data: GlobalCounterResponse = await response.json();
    return data.totalClicks;
  } catch (error) {
    console.error("Failed to fetch global counter:", error);
    // Retorna 0 como um valor seguro caso a API falhe na inicialização.
    return 0;
  }
}

/**
 * Envia um novo clique para o servidor (POST request).
 * @returns {Promise<number | null>} O novo total de cliques globais retornado pela API, ou null em caso de erro.
 */
export async function registerMooClick(): Promise<number | null> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`API response error: ${response.status}`);
    }
    const data: GlobalCounterResponse = await response.json();
    return data.totalClicks;
  } catch (error) {
    console.error("Failed to register moo click:", error);
    // Retorna null para que o componente que chamou saiba que houve uma falha.
    return null;
  }
}