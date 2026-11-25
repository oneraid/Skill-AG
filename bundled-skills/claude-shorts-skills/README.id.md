# Claude Shorts Skills (Bahasa Indonesia)

[English](README.md) · **Bahasa Indonesia**

Empat *skill* [Claude Code](https://claude.com/claude-code) untuk bikin video pendek vertikal (YouTube Shorts, TikTok, Reels) langsung di PC sendiri:

| Skill | Gunanya |
|---|---|
| [`cartoon-3d-short`](skills/cartoon-3d-short) | Video cerita kartun 55–70 detik: karakter 2D di dunia 3D. Dari naskah, voice-over, kamera, akting, suara, sampai render final. |
| [`captions`](skills/captions) | Caption yang pas dengan suara narasi, sebagai klip green screen terpisah untuk After Effects / CapCut. |
| [`minecraft-shorts`](skills/minecraft-shorts) | Naskah short Minecraft (Inggris & Indonesia) dengan formula "Apa jadinya kalau...?" dan "cara kamu menemukan X". |
| [`minecraft-story`](skills/minecraft-story) | Video cerita Minecraft 2:15 "In this world / In this town", dibangun lewat kode dan beberapa agent sekaligus. |

Bukan AI video generator: gambarnya di-*render* dengan three.js di dalam [Remotion](https://www.remotion.dev/). Contoh hasilnya ada di [README bahasa Inggris](README.md#made-with-these-skills).

## Yang perlu disiapkan

- PC/laptop (Windows 10/11, macOS, atau Linux). Skill ini dibuat dan dites di **Windows 11**.
- Langganan Claude yang bisa memakai Claude Code (Pro atau di atasnya).
- Ruang disk kosong beberapa GB untuk Node, Remotion dan hasil render.

## Cara pasang (langkah demi langkah)

Semua perintah di bawah diketik di **PowerShell** (Windows: tekan Start, ketik `PowerShell`, Enter). Pengguna Mac: lihat [Cara pasang di macOS](#cara-pasang-di-macos).

### 1. Pasang alat dasarnya

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.12
winget install Gyan.FFmpeg
```

Tutup PowerShell lalu buka lagi supaya perintah barunya dikenali. Cek dengan `node -v` (harus 20 ke atas).

### 2. Pasang Claude Code

```powershell
npm install -g @anthropic-ai/claude-code
```

Jalankan `claude` sekali, lalu login dengan akun Claude kamu. Cara pasang lainnya ada di [dokumentasi resmi](https://code.claude.com/docs/en/setup).

### 3. Ambil repo ini

```powershell
git clone https://github.com/fahniazz/claude-shorts-skills
```

### 4. Salin skill ke folder Claude

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item -Recurse -Force claude-shorts-skills\skills\* "$HOME\.claude\skills\"
```

macOS / Linux:

```bash
mkdir -p ~/.claude/skills && cp -r claude-shorts-skills/skills/* ~/.claude/skills/
```

Kalau memakai `minecraft-story`, pasang juga agent-nya:

```powershell
node "$HOME\.claude\skills\minecraft-story\scripts\install.mjs"
```

### 5. Siapkan project Remotion

Video kartun dan caption di-*render* di project Remotion:

```powershell
npx create-video@latest
cd nama-project-kamu
npm install @remotion/three three @react-three/fiber
```

### 6. Pakai!

Di dalam folder project, jalankan:

```powershell
claude
```

Ketik `/` untuk melihat daftar skill (misalnya `/cartoon-3d-short`), atau langsung minta:

> *"Pakai skill cartoon short, bikin short tentang orang pertama yang menemukan rem lift."*

## Cara pasang di macOS

> Skill ini dibuat dan dites di Windows 11. Langkah di bawah seharusnya jalan di macOS, tapi **belum pernah dites** di Mac. Kalau ada yang error, tolong laporkan di [issue #5](https://github.com/fahniazz/claude-shorts-skills/issues/5) 🙏

Buka **Terminal** (tekan `Cmd + Spasi`, ketik `Terminal`, Enter), lalu jalankan:

**1. Pasang Homebrew dan alat dasarnya** (lewati baris pertama kalau Homebrew sudah ada)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git node python ffmpeg
```

**2. Pasang Claude Code**, lalu jalankan `claude` sekali dan login

```bash
npm install -g @anthropic-ai/claude-code
```

**3. Ambil repo ini dan salin skill ke folder Claude**

```bash
git clone https://github.com/fahniazz/claude-shorts-skills
mkdir -p ~/.claude/skills && cp -r claude-shorts-skills/skills/* ~/.claude/skills/
```

Kalau memakai `minecraft-story`:

```bash
node ~/.claude/skills/minecraft-story/scripts/install.mjs
```

**4. Siapkan project Remotion, lalu pakai**

```bash
npx create-video@latest
cd nama-project-kamu
npm install @remotion/three three @react-three/fiber
claude
```

Di Mac, render memakai browser bawaan Remotion (otomatis diunduh), kecuali kamu mengisi `CHROME_PATH`. Script caption otomatis memakai font Arial Black yang ada di Mac; pakai `--font` kalau mau font lain.

## Kalau ada masalah

- `winget` / `node` / `git` tidak dikenal → tutup dan buka lagi PowerShell, atau restart PC.
- Skill tidak muncul → pastikan foldernya ada di `C:\Users\<nama>\.claude\skills\`, lalu mulai sesi `claude` baru.
- Masih error? Laporkan di tab [**Issues**](https://github.com/fahniazz/claude-shorts-skills/issues): tulis OS, perintah yang dijalankan, dan pesan error lengkapnya.

## Suka? Kasih ⭐

Login ke GitHub, buka [halaman repo ini](https://github.com/fahniazz/claude-shorts-skills), lalu klik tombol **⭐ Star** di kanan atas. Itu sangat membantu project ini 🙏

Mau ikut mengembangkan? Baca [CONTRIBUTING.md](CONTRIBUTING.md) (bahasa Inggris). Lisensi: [MIT](LICENSE).
