export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    const { section, headlines } = req.body;

    if (!headlines || headlines.length === 0) {
      return res.status(400).json({ error: "No headlines provided" });
    }

    // Generate long-form narration for 10–20 minutes per section
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional news narrator. Expand headlines into long, engaging summaries (like a podcast), including context, background, and implications. Each section should be detailed enough to last 10–20 minutes when read aloud. Use a conversational but professional tone."
          },
          {
            role: "user",
            content: `Create a detailed narration for the ${section} section. Use these headlines as anchors: ${headlines.join(" | ")}.`
          }
        ],
        max_tokens: 3000,
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      return res.status(completion.status).json({ error: "OpenAI API error", details: errText });
    }

    const data = await completion.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return res.status(500).json({ error: "No script returned from OpenAI", details: data });
    }

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server crashed", details: error.message });
  }
}
