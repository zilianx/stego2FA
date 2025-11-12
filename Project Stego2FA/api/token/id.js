// api/token/[id].js
export default async function handler(req, res) {
  // enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const UPSTASH_REST_URL = process.env.UPSTASH_REST_URL;
    const UPSTASH_REST_TOKEN = process.env.UPSTASH_REST_TOKEN;
    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
      return res.status(500).json({ error: "Server not configured (missing Upstash env vars)." });
    }

    const getUrl = `${UPSTASH_REST_URL}/get/${encodeURIComponent(id)}`;
    const getResp = await fetch(getUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${UPSTASH_REST_TOKEN}` },
    });

    if (!getResp.ok) {
      const txt = await getResp.text();
      console.error("Upstash get failed:", txt);
      return res.status(502).json({ error: "Upstash get failed", details: txt });
    }

    const j = await getResp.json();
    // Upstash returns { result: "<value>" } or { result: null }
    if (!j || j.result == null) {
      return res.status(404).json({ error: "Token not found or expired" });
    }

    let payload;
    try {
      payload = JSON.parse(j.result);
    } catch (e) {
      payload = j.result; // return raw string if parse fails
    }

    return res.status(200).json({ id, payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}