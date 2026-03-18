import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function compareGoals(goal1: string, goal2: string): Promise<number> {
  if (!goal1 || !goal2) return 0.5;

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
    return isNaN(score) ? 0.5 : Math.min(1, Math.max(0, score));
  } catch {
    return 0.5;
  }
}
