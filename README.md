# ⚡ TokenDash

> **Privacy-First, Real-Time AI Telemetry & API Key Management Dashboard**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM-emerald?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

TokenDash is a zero-knowledge, local-first telemetry HUD engineered for AI teams, developers, and founders. It aggregates multi-provider token consumption, tracks real-time API latency, projects monthly spend, and manages provider secrets—without sending raw API credentials or usage logs to third-party databases.

---

## 🏛️ System Architecture

TokenDash enforces a **Client-Side Cryptographic Paradigm** paired with a stateless edge relay to bypass CORS restrictions while maintaining absolute data isolation.

```mermaid
flowchart TD
    subgraph Client ["Browser Client (Zero-Trust Local Memory)"]
        A[Framer Motion HUD UI] <--> B[Zustand State Store]
        B <--> C["Web Crypto API (AES-256-GCM Vault)"]
    end

    subgraph Edge ["Next.js Serverless Layer"]
        D["/api/proxy Route Handler (Zero-Log / Ephemeral)"]
    end

    subgraph Upstream ["Upstream AI Providers"]
        E[OpenAI API]
        F[Anthropic API]
        G[Groq / OpenRouter APIs]
    end

    B -- "Decrypted Key + Payload" --> D
    D -- "Signed Provider Request" --> Upstream
    Upstream -- "Telemetry & Rate-Limit Headers" --> D
    D -- "Sanitized Usage Stream" --> B
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

## ⚡ Key Features

- **🔐 Zero-Knowledge Web Crypto Vault:** Hardware-accelerated client-side encryption for provider keys using your master passcode.
- **🌐 Unified Multi-Provider Aggregation:** Standardized token metrics, latency charts, and error rates across **OpenAI**, **Anthropic**, **Groq**, **Gemini**, and **OpenRouter**.
- **📊 Real-time Cyberpunk HUD:** Animated metric streams, interactive burn-rate charts, and active provider status indicators styled with a `#090a0f` obsidian background and cyan glowing accents.
- **🧪 Interactive Sandbox Engine:** Mock mode allowing comprehensive UI testing, telemetry visualization, and stress-testing without expending live API credits.
- **📥 Audit & Telemetry Export:** Instant log filtering across time windows (`24h`, `7d`, `30d`) with one-click export to **CSV** and **JSON**.

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling & Motion** | Tailwind CSS, Framer Motion, Lucide React Icons |
| **State Management** | Zustand (with selective persistence) |
| **Cryptography** | Native Web Crypto API (`window.crypto.subtle`) |
| **Tooling & Insights** | pnpm, Vercel Speed Insights, Vercel Analytics |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **pnpm**: `v8.0.0` or higher (`npm install -g pnpm`)

### Local Setup

```bash
# 1. Clone the repository
git clone [https://github.com/Rihan-R10/tokendash.git](https://github.com/Rihan-R10/tokendash.git)
cd tokendash

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to launch the dashboard.

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.