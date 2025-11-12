// api/upload.js
// Vercel serverless (Node 18+). Stores payload JSON in Upstash Redis with TTL.
import crypto from "crypto";

export default async function handler(req, res) {
  // CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    if (!body || !body.payload) {
      return res.status(400).json({ error: "Missing payload in body" });
    }

    const payloadObj = body.payload; // should be a JSON-object { ct, hmac, ... }
    const json = JSON.stringify(payloadObj);

    // generate short random id (20 hex chars)
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

    const ttlSeconds = Number(process.env.TTL_SECONDS) || 300; // default 5 minutes

    const UPSTASH_REST_URL = process.env.UPSTASH_REST_URL;
    const UPSTASH_REST_TOKEN = process.env.UPSTASH_REST_TOKEN;

    if (!UPSTASH_REST_URL || !UPSTASH_REST_TOKEN) {
      return res.status(500).json({ error: "Server not configured (missing Upstash env vars)." });
    }

    // Upstash REST set: POST { url }/set/{key}/{value}/EX/{seconds}
    const encodedValue = encodeURIComponent(json);
    const setUrl = `${UPSTASH_REST_URL}/set/${id}/${encodedValue}/EX/${ttlSeconds}`;

    const setResp = await fetch(setUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!setResp.ok) {
      const txt = await setResp.text();
      console.error("Upstash set failed:", txt);
      return res.status(502).json({ error: "Upstash set failed", details: txt });
    }

    const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
    const tokenUrl = SITE_URL ? `${SITE_URL}/yy.html?token=${id}` : `/yy.html?token=${id}`;

    return res.status(200).json({ id, url: tokenUrl, expires_in: ttlSeconds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
