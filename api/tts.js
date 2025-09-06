export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = "G17SuINrv2H9FC6nvetn"; // Your ElevenLabs voice ID

    // Split long text into chunks (~3000 chars) to avoid TTS failure
    const chunkSize = 3000;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    const audioBuffers = [];
    for (const chunk of chunks) {
      const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: chunk,
          voice_settings: { stability: 0.75, similarity_boost: 0.75 }
        })
      });

      if (!ttsRes.ok) {
        const errText = await ttsRes.text();
        console.error("ElevenLabs TTS error:", errText);
        return res.status(ttsRes.status).json({ error: "TTS error", details: errText });
      }

      const buffer = await ttsRes.arrayBuffer();
      audioBuffers.push(Buffer.from(buffer));
    }

    const fullBuffer = Buffer.concat(audioBuffers);
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(fullBuffer);

  } catch (error) {
    console.error("TTS server error:", error);
    res.status(500).json({ error: error.message });
  }
}
