export default async function handler(req, res) {
  try {
    const { question, answer } = req.body;

    const sys = `You are a ruthless FAANG PM interviewer. Score 1–4.
Format strictly as:
Score: X/4
Verdict: ...
Gaps: ...
Strength: ...
Next step: ...`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: sys,
        messages: [
          {
            role: "user",
            content: `Question: ${question}\n\nCandidate answer: ${answer}`
          }
        ]
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("Anthropic error:", data);
      return res.status(500).json({ error: "AI failed" });
    }

    const text = data?.content?.[0]?.text || "No response";

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}