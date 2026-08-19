<div align="center">

# ⚡ TokenDash

**Privacy-First Real-Time Telemetry & Zero-Trust API Key Management Dashboard**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-764ABC?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM-emerald?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tokendash-8n1kwzgw6-rihan-r11.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[**Explore Live Demo »**](https://tokendash-8n1kwzgw6-rihan-r11.vercel.app) · [Report Bug](https://github.com/rihan-r11/tokendash/issues) · [Request Feature](https://github.com/rihan-r11/tokendash/issues)

</div>

---

## 🔒 Zero-Trust Security Architecture

TokenDash is built around a **zero-knowledge privacy model**. Your raw API keys are never written to unencrypted storage or transmitted in plaintext across the network.

```
┌──────────────────────────────────────────────────────────┐
│                   BROWSER CLIENT                         │
│  - User input key → Web Crypto API (AES-256-GCM)        │
│  - Key encrypted in-memory before leaving client         │
└────────────────────────────┬─────────────────────────────┘
                             │ (Encrypted Ciphertext + IV)
                             ▼
┌──────────────────────────────────────────────────────────┐
│             NEXT.JS SERVERLESS PROXY (/api/proxy)        │
│  - Validates request payload schema                      │
│  - Injects authorization headers                         │
│  - Ephemeral forwarder (zero key persistence)             │
└────────────────────────────┬─────────────────────────────┘
                             │ (Authenticated Request)
                             ▼
┌──────────────────────────────────────────────────────────┐
│            UPSTREAM PROVIDERS (OpenAI/Anthropic/etc)     │
└──────────────────────────────────────────────────────────┘
```

---

## 🛡️ Threat Model & Security Boundaries

TokenDash treats the network and third-party servers as untrusted zones. All credentials and sensitive telemetry remain bound to the client execution environment.

| Threat Vector | Mitigation Strategy | Security Boundary |
| :--- | :--- | :--- |
| **Server-Side Key Leaks** | Zero-knowledge design; raw API keys are never written to server disks or database tables. | **Client-Side Storage** |
| **Storage Interception** | Master passcodes derive cryptographic keys via `PBKDF2` (100,000+ iterations) before writing to `localStorage`. | **Browser Vault** |
| **CORS & IP Exposure** | Next.js serverless route handler (`/api/proxy`) masks client origin and handles provider-specific CORS rules. | **Edge Network** |
| **XSS / Memory Dump** | Keys reside in non-extractable CryptoKey objects in volatile heap memory and flush on window unload. | **Application Memory** |

---

## 🔑 Cryptographic Specifications

- **Encryption Algorithm:** `AES-256-GCM` (Galois/Counter Mode) providing authenticated encryption with associated data (AEAD).
- **Initialization Vector (IV):** Dynamic 96-bit cryptographically secure random IV generated per key entry using `crypto.getRandomValues()`.
- **Key Derivation Function (KDF):** `PBKDF2` with `SHA-256`, utilizing a dynamic 128-bit salt and a minimum iteration count of 100,000.
- **Key Lifecycle:** Passcodes and derived keys are retained purely in volatile JavaScript runtime heap memory; zero plain-text values are ever stored in `localStorage` or `IndexedDB`.

---

## ✨ Key Features

- 🛡️ **Zero-Trust Key Storage:** Encrypted client-side; plain-text keys never touch the server disk.
- 🔐 **Zero-Knowledge Web Crypto Vault:** Hardware-accelerated client-side encryption for provider keys using your master passcode.
- 🌐 **Unified Multi-Provider Aggregation:** Standardized token metrics, latency charts, and error rates across **OpenAI**, **Anthropic**, **Groq**, **Gemini**, and **OpenRouter**.
- 📊 **Real-Time Cyberpunk HUD:** Animated metric streams, interactive burn-rate charts, and active provider status indicators styled with a `#090a0f` obsidian background and cyan glowing accents.
- 🧪 **Interactive Sandbox Engine:** Mock mode allowing comprehensive UI testing, telemetry visualization, and stress-testing without expending live API credits.
- 📥 **Audit & Telemetry Export:** Instant log filtering across time windows (`24h`, `7d`, `30d`) with one-click export to **CSV** and **JSON**.
- ⚡ **Sub-50ms Edge Performance:** Instant serverless execution powered by Next.js Turbopack and Vercel Edge Network.
- 🎨 **Modular UI Engine:** Built with Framer Motion animations, Lucide icons, and Tailwind CSS.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **State Management** | Zustand (with selective persistence) |
| **Styling & Motion** | Tailwind CSS, Framer Motion, Lucide React Icons |
| **Cryptography** | Native Web Crypto API (`window.crypto.subtle`) |
| **Tooling & Insights** | pnpm, Vercel Speed Insights, Vercel Analytics |

---

## 🚀 Quick Start

### Prerequisites

Ensure you have Node.js 18+ and `pnpm` installed:

```bash
npm install -g pnpm
```

### Installation

1. **Clone the Repository:**
```bash
git clone https://github.com/rihan-r11/tokendash.git
cd tokendash
```

2. **Install Dependencies:**
```bash
pnpm install
```

3. **Configure Environment Variables:**
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```

Add optional server-side configuration keys:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_SECRET=your_optional_server_secret
```

4. **Run Development Server:**
```bash
pnpm dev
```

Open `http://localhost:3000` in your browser to view the application.

---

## 📂 Project Structure

```text
tokendash/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── proxy/route.ts       # Serverless proxy handler
│   │   ├── globals.css              # HUD glowing utilities
│   │   ├── layout.tsx
│   │   └── page.tsx                 # Main telemetry dashboard
│   ├── components/
│   │   ├── dashboard/               # Metric cards, HUD charts, & tables
│   │   └── ui/                      # Base UI primitives
│   ├── lib/
│   │   ├── cryptoVault.ts           # AES-256 Web Crypto implementation
│   │   └── adapters/                # OpenAI, Anthropic, OpenRouter handlers
│   ├── store/
│   │   └── useTokenStore.ts         # Zustand state management
│   └── types/                       # Shared TypeScript interface definitions
├── public/                          # Static assets
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! If you'd like to report a bug or suggest a feature:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for full details.

---

<div align="center">

**Built with ⚡ by [Rihan](https://github.com/rihan-r11)**

</div>