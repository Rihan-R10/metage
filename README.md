# ⚡ TokenDash

> **Privacy-First, Real-Time AI Telemetry & API Key Management Dashboard**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)

TokenDash is a lightweight, zero-knowledge HUD designed for AI engineers, developers, and founders. Track multi-provider token consumption, monitor API latency, estimate burn rates, and manage API keys locally without sending credentials or telemetry logs to third-party cloud databases.

---

## ✨ Key Features

- **🔐 Zero-Knowledge Web Crypto Vault:** Native client-side **AES-256-GCM** encryption using master passcodes. API keys stay inside your browser's local storage and are never uploaded to remote servers.
- **🌐 Unified Multi-Provider Normalization:** Seamlessly aggregates telemetry metrics across **OpenAI**, **Anthropic**, and **OpenRouter** into a single glass pane.
- **⚡ Serverless CORS Proxy (`/api/proxy`):** Built-in Next.js route handler to safely poll provider health and rate-limit endpoints without exposing client IP addresses or violating browser CORS policies.
- **📊 Real-time Cyberpunk HUD UI:** Animated metric cards (Framer Motion), interactive token usage charts, live terminal streaming logs, and provider status indicators built on `#090a0f` styling with cyan glowing accents.
- **🧪 Mock Telemetry Engine:** Integrated sandbox mode allowing full interactive testing and visualization without spending live API credits.
- **📥 Telemetry Export:** Instant log filtering and one-click data export to **CSV** and **JSON** formats for financial reporting and compliance.

---

## 🛡️ Architecture & Security Model

TokenDash operates on a **Local-First, Client-Side Cryptographic** paradigm:

┌────────────────────────────────────────────────────────┐
│                   Browser Client                       │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   AES-256 Vault      │    │  Zustand State Engine│  │
│  └──────────┬───────────┘    └──────────┬───────────┘  │
└─────────────┼───────────────────────────┼──────────────┘
│ Enriched Telemetry        │ Proxy Forwarding
▼                           ▼
┌──────────────────────────────────────────────────────┐
│        Next.js Route Handler (/api/proxy)            │
└──────────────────────────┬───────────────────────────┘
│ Forward Requests
▼
┌─────────────────────────────┐
│ OpenAI / Anthropic / API    │
└─────────────────────────────┘