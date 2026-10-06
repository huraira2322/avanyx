# Avanyx — AI-Powered Universal Retail & POS OS

Avanyx is an intelligent, multi-tenant Enterprise Point of Sale (POS) and Autonomous Business Operating System built with modern web technologies, Firebase, and multi-model AI routing.

---

## 🌟 Key Features

* **Universal Business Engine & AI Second Brain**: Dynamic domain workflows, real-time analytics, automated catalog configuration, and adaptive operational models.
* **Modern POS & Checkout**: Lightning-fast barcode scanning, multi-method payment splits, hold/resume carts, and instant thermal/digital receipt printing.
* **Autonomous Inventory & Demand Forecaster**: Real-time stock levels, low-stock alerts, supplier tracking, and AI-driven restocking directives.
* **Robust Multi-Tenant Security**: Firebase Authentication and Firestore security rules enforcing complete per-tenant data isolation.
* **Multi-Model AI Router**: Hybrid AI reasoning supporting DeepSeek V4 and Google Gemini models with intelligent fallback failover.

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+ or 20+
* npm or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/huraira2322/avanyx.git
   cd avanyx
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Firebase client config and optional AI provider keys (`DEEPSEEK_API_KEY`, `GEMINI_API_KEY`) as instructed in `.env.example`.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🛡️ License

MIT License. Copyright (c) 2026 Abu Huraira Hussain.
