# ⚡ SyncArch — Collaborative Electronics Lab in Your Browser

**SyncArch** is a real-time, web-based collaborative electronics workspace and microcontroller simulator. Built for engineers, students, and makers, it combines interactive circuit design, embedded C++ code editing, digital logic visualization, and an AI-powered hardware copilot in a single browser tab.

🌐 **Live Application:** [https://syncarch.vercel.app](https://syncarch.vercel.app)

---

## ✨ Key Features

- **Real-Time Multi-User Sync:** Collaborate simultaneously on circuit diagrams and wiring with instant WebSocket state synchronization powered by Socket.io.
- **Interactive Circuit & MCU Workspace:** Design, wire, and simulate digital logic circuits alongside microcontrollers (ESP32 / Arduino) directly in the browser.
- **Built-In Embedded Code Editor:** Write, edit, and test C++ firmware directly inside your hardware components with zero local toolchain setup.
- **Circuit AI Copilot:** Integrated Gemini AI assistant trained to help debug circuit logic, explain flip-flops and gates, and generate or troubleshoot microcontroller code.
- **Digital Oscilloscope & Logic Timing Diagram:** Inspect real-time signal states, waveforms, and timing behavior across active wires.
- **Cloud Persistence & Auth:** Secure Google OAuth 2.0 login with persistent circuit saving, version history, and chat history storage.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + Vite
- **Real-Time Client:** Socket.io Client
- **Authentication:** `@react-oauth/google` (Google OAuth 2.0)
- **Deployment:** Vercel

### Backend
- **Runtime & Server:** Node.js + Express
- **WebSockets:** Socket.io
- **AI Engine:** Google Gemini API
- **Database:** SQLite (`chat_history.db`)
- **Deployment:** Render

---

## 🚀 Local Setup & Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/ifazulhq/syncarch.git](https://github.com/ifazulhq/syncarch.git)
cd syncarch
