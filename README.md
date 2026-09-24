<div align="center">

<img src="https://img.shields.io/badge/AURA-Sound%20Lab-6366f1?style=for-the-badge&logo=music&logoColor=white" alt="Aura Music" />

# 🎵 Aura — Next-Gen Cinematic Music Experience

**A premium, AI-powered music streaming platform with real-time group listening, cinematic visuals, and synchronized lyrics.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[Live Demo](#) · [Report Bug](https://github.com/Shekhar/aura-music/issues) · [Request Feature](https://github.com/Shekhar/aura-music/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎧 **Cinematic Player** | Full-screen immersive playback with dynamic album art backgrounds |
| 🎤 **Synced Lyrics** | Real-time line-by-line lyrics synchronized with the playing track |
| 🚗 **Car Group Play (Jam)** | Real-time group listening sessions over WebSocket — listen together |
| 🔍 **Universal Search** | Instant multi-source search across songs, albums, artists & playlists |
| 📱 **QR Join** | Join a Jam session by scanning a QR code from any device |
| 🔐 **Multi-Provider Auth** | Sign in with Google, phone (OTP), or email (OTP) |
| 🌍 **Country Code Picker** | Full country code selector for phone authentication |
| 📚 **Library Management** | Create and manage personal playlists (login required) |
| 🤖 **AI-Powered** | Gemini AI integration for smart music recommendations |
| 🎨 **Glassmorphism UI** | Premium dark-mode design with smooth animations and micro-interactions |
| 📊 **Analytics** | Firebase Analytics for usage insights |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** — Component-driven UI
- **Vite 8** — Lightning-fast dev server & build tool
- **Tailwind CSS v4** — Utility-first styling
- **Motion (Framer)** — Fluid animations
- **Zustand** — Lightweight global state management
- **TanStack Query** — Server state & caching
- **Lucide React** — Beautiful icon library

### Backend
- **Express.js** — REST API server
- **WebSocket (ws)** — Real-time Jam sessions
- **Nodemailer** — Email OTP dispatch
- **Firebase Admin** — Authentication & Firestore

### Services
- **Firebase** — Auth, Firestore DB, Analytics
- **JioSaavn API** — Music streaming & metadata
- **LRCLIB** — Synchronized lyrics
- **Google Gemini AI** — AI recommendations

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v18+**
- npm or yarn
- A [Firebase project](https://console.firebase.google.com/)
- (Optional) Gmail App Password for email OTP

### 1. Clone the Repository

```bash
git clone https://github.com/Shekhar/aura-music.git
cd aura-music
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```env
# Firebase (get from Firebase Console → Project Settings)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# SMTP Email for OTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → your project
2. **Authentication** → Enable providers: **Google**, **Phone**, **Email/Password**
3. **Firestore** → Create database (start in test mode, then secure with rules below)
4. **Add your domain** to authorized domains in Authentication settings

#### Firestore Security Rules
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /playlists/{playlistId} {
      allow read: if resource.data.public == true || request.auth.uid == resource.data.ownerId;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
aura-music/
├── src/
│   ├── components/          # Shared UI components
│   │   └── ui/             # Base components (Button, Modal, etc.)
│   ├── features/            # Feature modules
│   │   ├── auth/           # AuthModal, Country Picker, OTP flows
│   │   ├── player/         # Music player, lyrics, queue
│   │   ├── jam/            # Car Group Play / Jam session
│   │   ├── library/        # Playlist management
│   │   ├── search/         # Search & discovery
│   │   └── home/           # Home screen, featured content
│   ├── lib/
│   │   ├── firebase.ts     # Firebase initialization (env-based)
│   │   ├── music/          # Music provider, JioSaavn, lyrics
│   │   └── store/          # Zustand state stores
│   └── server/
│       └── jamManager.ts   # WebSocket Jam session manager
├── server.ts                # Express + Vite dev server
├── .env.example             # Environment variable template
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

---

## 🌐 Deployment (Vercel)

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import from GitHub
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add all environment variables from your `.env` file in the **Environment Variables** section
6. Deploy!

> **Note**: Since Aura uses a custom Express server with WebSockets for Jam sessions, for full production deployment consider a platform that supports long-lived servers (e.g., Railway, Render, or a VPS). For a static-only Vercel deploy, Jam sessions will be limited.

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⬜ | Firebase Analytics ID |
| `VITE_GEMINI_API_KEY` | ⬜ | Google Gemini AI API Key |
| `SMTP_HOST` | ⬜ | SMTP server host (for email OTP) |
| `SMTP_PORT` | ⬜ | SMTP port (default: 587) |
| `SMTP_USER` | ⬜ | SMTP username / email |
| `SMTP_PASS` | ⬜ | SMTP password / App Password |
| `SMTP_FROM` | ⬜ | From address shown in emails |
| `PORT` | ⬜ | Server port (default: 3000) |
| `APP_URL` | ⬜ | Public app URL for callbacks |

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by **Shekhar** · Powered by [Firebase](https://firebase.google.com/) · Music by [JioSaavn](https://jiosaavn.com)

</div>
