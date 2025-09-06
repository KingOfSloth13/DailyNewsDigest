export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OpenAI API key" });

    const { section, headlines } = req.body;
    if (!headlines || headlines.length === 0) return res.status(400).json({ error: "No headlines provided" });

    // Prompt instructs the model to create 15–20 minutes of narration per section
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
            content: `
You are a professional podcast-style news narrator. Expand each headline into
long, detailed, and engaging narration. Include context, background, and implications. 
Use a natural, conversational tone as if reading on air. 

**Important**: Each section (global, US, Colorado) should begin with a clear spoken announcement, e.g.,
"Now entering the Global News section." 
Aim for **15–20 minutes of reading per section** (about 7,000 words per section if possible). 
Do not summarize too briefly — make it engaging, informative, and full of context.`
          },
          {
            role: "user",
            content: `You are narrating the ${section} section. Use these headlines as anchors: ${headlines.join(" | ")}. Begin the narration by clearly stating the section name.`
          }
        ],
        max_tokens: 6000, // increase so we can generate longer scripts
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      return res.status(completion.status).json({ error: "OpenAI API error", details: errText });
    }

    const data = await completion.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) return res.status(500).json({ error: "No script returned from OpenAI", details: data });

    return res.status(200).json({ summary });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server crashed", details: error.message });
  }
}
