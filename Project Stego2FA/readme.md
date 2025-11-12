# Stego 2FA — Deploy Guide (Vercel + Upstash + GitHub Pages)

## 1) Create Upstash Redis
- Sign up at https://upstash.com
- Create a Redis database (free)
- From Connect -> copy:
  - REST URL (e.g. https://us1-abc.upstash.io)
  - REST token (bearer)

## 2) Create GitHub repo & push files
- Put repo files:
  - index.html
  - xx.html
  - yy.html
  - manifest.json
  - api/upload.js
  - api/token/[id].js
  - README.md

## 3) Deploy backend to Vercel
- Sign in at https://vercel.com
- Import the GitHub repo
- Add Environment Variables (Project Settings -> Environment Variables):
  - UPSTASH_REST_URL = your Upstash REST URL (no trailing slash)
  - UPSTASH_REST_TOKEN = your Upstash REST token
  - TTL_SECONDS = 300
  - SITE_URL = https://yourusername.github.io/stego2fa
- Deploy. Vercel provides a domain like `https://your-backend.vercel.app`

## 4) Update frontend API_BASE
- In `xx.html` and `yy.html`, replace `<YOUR_API_BASE>` with your Vercel domain (`https://your-backend.vercel.app`).
  - Or use relative `/api/...` if you host frontend together on Vercel (recommended).

## 5) Host frontend (GitHub Pages)
- On GitHub repo -> Settings -> Pages: Deploy from `main` branch, root
- Visit `https://yourusername.github.io/stego2fa/`

## Notes
- The server stores only ciphertext + HMAC. Decryption occurs on client.
- Keys (Upstash token) must remain secret; do not commit them.
