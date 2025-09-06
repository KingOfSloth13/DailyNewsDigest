import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { section, headlines } = req.body;
    if (!headlines || !headlines.length) return res.status(400).json({ error: "No headlines provided" });

    const prompt = `
You are creating a news digest for the ${section} section. 
Summarize these headlines in a **listener-friendly style**, include financial, political, and cultural context, and make it detailed enough to generate at least 30–40 sentences per section:

${headlines.join("\n")}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const summary = completion.choices[0].message.content;
    res.status(200).json({ summary });

  } catch (error) {
    console.error("Summarize error:", error);
    res.status(500).json({ error: error.message });
  }
}
