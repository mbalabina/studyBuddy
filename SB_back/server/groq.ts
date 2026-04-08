import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Кэш результатов: не делаем повторные запросы для одинаковых пар целей
const goalCache = new Map<string, number>();
const MAX_CACHE_SIZE = 500;

export async function compareGoals(goal1: string, goal2: string): Promise<number> {
  if (!goal1 || !goal2) return 0.5;

  // Ключ кэша независим от порядка строк
  const key = [goal1.trim(), goal2.trim()].sort().join("|||");

  if (goalCache.has(key)) {
    return goalCache.get(key)!;
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: `Оцени насколько похожи две учебные цели по смыслу. Ответь ТОЛЬКО числом от 0 до 1, где 0 = совсем разные, 1 = одинаковые.
Цель 1: "${goal1}"
Цель 2: "${goal2}"
Число:`,
        },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const text = response.choices[0]?.message?.content?.trim() || "0.5";
    const score = parseFloat(text);
    const result = isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));

    // Сохраняем в кэш
    if (goalCache.size >= MAX_CACHE_SIZE) {
      // Удаляем самую старую запись
      goalCache.delete(goalCache.keys().next().value!);
    }
    goalCache.set(key, result);

    return result;
  } catch {
    // При любой ошибке возвращаем нейтральное значение
    return 0.5;
  }
}