'use server';

export interface AiDescriptionResult {
  success: boolean;
  description?: string;
  error?: string;
}

interface GeminiPayload {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const MAX_TITLE_LENGTH = 120;
const MAX_WORDS = 30;
const MISSING_KEY_RESULT: AiDescriptionResult = {
  success: false,
  error: 'Función de IA no configurada: falta GEMINI_API_KEY en el entorno.',
};

function clampWords(text: string, maxWords: number): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
    .join(' ');
}

function extractDescription(payload: GeminiPayload): string | null {
  const raw = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join(' ')
    .replace(/^["'«»\s]+|["'«».\s]+$/g, '')
    .trim();
  return raw ? clampWords(raw, MAX_WORDS) : null;
}

function validateTitle(title: string, subject: string): AiDescriptionResult | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return { success: false, error: `Escribe primero el ${subject}.` };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { success: false, error: `El ${subject} es demasiado largo.` };
  }
  return null;
}

async function requestGeminiDescription(
  prompt: string,
  apiKey: string
): Promise<AiDescriptionResult> {
  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'El servicio de IA no respondió correctamente. Inténtalo nuevamente.',
      };
    }

    const payload = (await response.json()) as GeminiPayload;
    const description = extractDescription(payload);
    if (!description) {
      return {
        success: false,
        error: 'La IA no generó una descripción válida. Inténtalo nuevamente.',
      };
    }

    return { success: true, description };
  } catch {
    return {
      success: false,
      error: 'Error de conexión con el servicio de IA. Inténtalo nuevamente.',
    };
  }
}

export async function generateDishDescription(
  title: string
): Promise<AiDescriptionResult> {
  const invalid = validateTitle(title, 'nombre del platillo');
  if (invalid) return invalid;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return MISSING_KEY_RESULT;

  return requestGeminiDescription(
    `Actúa como chef redactor. Genera una descripción gastronómica breve y apetitosa en español para el plato "${title.trim()}". Máximo ${MAX_WORDS} palabras. Responde únicamente con la descripción, sin comillas, prefijos ni explicaciones adicionales.`,
    apiKey
  );
}

export async function generatePromoDescription(
  title: string
): Promise<AiDescriptionResult> {
  const invalid = validateTitle(title, 'título de la promoción');
  if (invalid) return invalid;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return MISSING_KEY_RESULT;

  return requestGeminiDescription(
    `Actúa como redactor de marketing gastronómico. Genera una descripción breve y atractiva en español para la promoción "${title.trim()}". Máximo ${MAX_WORDS} palabras. Responde únicamente con la descripción, sin comillas, prefijos ni explicaciones adicionales.`,
    apiKey
  );
}
