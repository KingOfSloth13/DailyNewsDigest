// api/summarize.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { section, headlines } = req.body;

  if (!headlines || headlines.length === 0) {
    return res.status(400).json({ error: "No headlines provided" });
  }

  try {
    const prompt = `Summarize the following news headlines for the section "${section}" in a clear, concise, conversational style, suitable for audio reading:\n\n${headlines.join("\n")}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a news announcer summarizing headlines in a friendly, clear audio style." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const summary = completion.choices[0].message.content;
    res.status(200).json({ summary });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating summary" });
  }
}
