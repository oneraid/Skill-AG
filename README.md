# Antigravity Skill Manager ⚡

A modern, fast, and intuitive Web UI to manage, import, create, configure, toggle, and inspect **Google Antigravity & Gemini Agent Skills** with a dedicated **Skill Library**, **Instant ON / OFF Toggle Switch**, **1-Click Import from GitHub & OpenClaw**, and **Interactive Trigger Guide with Ready-to-Use Prompts**.

![Antigravity Skill Manager](https://img.shields.io/badge/Antigravity-v2.0-indigo?style=for-the-badge&logo=google)
![Node](https://img.shields.io/badge/Node.js-v18%2B-emerald?style=for-the-badge&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-Backend-slate?style=for-the-badge&logo=express)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.x-cyan?style=for-the-badge&logo=tailwindcss)

---

## 🌟 Fitur Utama (Key Features)

- 📦 **18 Pre-bundled Top Skills Included**: Repositori ini sudah menyertakan 18 skill terbaik (Desain, Anti-Slop, Cloudflare Security Audit, Claude Code Skills) di folder `bundled-skills/`. Saat dijalankan, aplikasi otomatis menyinkronkannya ke Library dan direktori global Antigravity Anda!
- 📚 **Skill Library (Perpustakaan Skill)**: Kelola semua skill kustom Anda dalam satu perpustakaan terpusat dengan switch toggle **ON / OFF instant**.
- ⚡ **Interactive Trigger Guide (`⚡ Cara Trigger`)**: Setiap skill memiliki popup modal yang merinci cara AI agent mendeteksinya, kata kunci (*keywords*), fitur sub-skills, dan **contoh prompt siap pakai (1-click copy)**.
- 🔗 **GitHub & OpenClaw Importer**: Impor skill langsung dari repositori GitHub, subfolder/monorepo OpenClaw, atau raw `SKILL.md` URL.
- 📦 **ZIP & Local Folder Import**: Drag & drop file `.zip` hasil download repo atau arahkan ke folder lokal yang sudah di-clone.
- 🧭 **All Discovered Skills Explorer**: Jelajahi seluruh skill dari Workspace (`.agents/skills`), Global (`~/.gemini/config/skills`), Plugins, dan Built-in Antigravity.
- ✏️ **Visual SKILL.md Editor & Tree Viewer**: Preview Markdown instan, edit frontmatter & body, serta jelajahi struktur folder `scripts/`, `references/`, dan `examples/`.
- 🔄 **Workspace Switcher**: Ganti target direktori proyek aktif secara dinamis langsung dari antarmuka.

---

## 🚀 Cara Menjalankan (Getting Started)

### Prasyarat
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- Git (opsional, untuk cloning)

### Instalasi & Menjalankan

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/oneraid/Skill-AG.git
   cd Skill-AG
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan aplikasi**:
   - **Windows**: Cukup klik ganda [`start.bat`](start.bat) atau jalankan:
     ```bash
     npm start
     ```
   - Browser akan otomatis terbuka di: **http://localhost:3456**

---

## 📖 Cara Menambah Skill dari GitHub & OpenClaw

Terdapat 3 cara mudah untuk menambahkan skill ke Library:

### 1. 🔗 Melalui URL (GitHub / OpenClaw / Raw Markdown)
Di menu aplikasi, klik tombol **"Add Skill"** -> pilih tab **"GitHub / OpenClaw / URL"**:
* **Dari GitHub Repository**:
  ```text
  https://github.com/owner/skill-repo
  ```
* **Dari OpenClaw atau GitHub Subfolder**:
  ```text
  https://github.com/openclaw/agent-skills/tree/main/skills/remote-validation
  ```
* **Dari Raw Markdown (`SKILL.md`)**:
  ```text
  https://raw.githubusercontent.com/.../SKILL.md
  ```
Klik tombol **"Import to Library"** — aplikasi akan otomatis mengunduh, mengekstrak instruksi, menyimpannya ke Library, dan mengaktifkannya!

### 2. 📦 Melalui File ZIP atau Folder Lokal
1. Buka tab **"Upload ZIP / Folder"**.
2. Tarik & jatuhkan (*drag & drop*) file `.zip` ke kotak upload, atau
3. Masukkan path folder lokal jika Anda sudah meng-clone repo (misal: `C:\Downloads\my-skill`).
4. Klik **"Import File to Library"**.

### 3. ✏️ Buat Manual dengan Template
Buka tab **"Buat Manual"** untuk menulis instruksi sendiri dengan pilihan starter template:
- *Standard Runbook*
- *Scripted Tool Runner* (dengan folder `scripts/`)
- *Testing & Quality Runbook*
- *Blank Skill*

---

## 💡 Bagaimana Cara Kerja Library & Switch ON/OFF?

1. **Master Copy di Library**:
   Skill disimpan permanen di direktori:
   `~/.gemini/config/library/skills/<nama-skill>/`
2. **Saat Dinyalakan (ON)**:
   Skill disalin ke direktori target:
   - Target Workspace: `<project_folder>/.agents/skills/<nama-skill>/`
   - Target Global: `~/.gemini/config/skills/<nama-skill>/`
   AI Agent Antigravity langsung memuat skill tersebut melalui mekanisme *progressive disclosure*.
3. **Saat Dimatikan (OFF)**:
   Skill ditarik dari folder aktif tersebut. AI Agent tidak akan memuatnya, namun master copy tetap aman tersimpan di Library Anda untuk diaktifkan kembali sewaktu-waktu.

---

## 📂 Struktur Proyek

```text
Skill-AG/
├── public/                 # Frontend SPA
│   ├── index.html          # Main HTML structure & Tailwind modals
│   ├── style.css           # Glassmorphism, animations, switch styles
│   └── app.js              # State, API handlers, Trigger Knowledge
├── server.js               # Express API backend & file manager
├── start.bat               # 1-click launcher for Windows
├── package.json            # Dependencies & scripts
└── README.md               # Dokumentasi
```

---

## 📄 Lisensi

MIT License © 2026 oneraid
