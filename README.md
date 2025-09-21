# Nakiri Bot

Bot WhatsApp multifungsi yang dibangun dengan Node.js, Baileys, dan Prisma. Bot ini menyediakan berbagai fitur seperti downloader media, game, manajemen grup, sistem mata uang virtual, dan integrasi AI.

## ✨ Fitur Utama

### 🤖 AI & Chat
- **DeepSeek AI**: Integrasi dengan AI untuk percakapan cerdas
- **Anonymous Chat**: Fitur chat anonim antar pengguna

### 📥 Downloader
- **YouTube**: Download video dan audio dari YouTube
- **Instagram**: Download konten dari Instagram
- **TikTok**: Download video TikTok
- **Facebook**: Download video Facebook
- **GitHub**: Download repository atau file dari GitHub

### 🎮 Game & Hiburan
- **Blackjack**: Permainan kartu blackjack
- **Slot Machine**: Permainan mesin slot
- **Minecraft**: Integrasi dengan server Minecraft (Exaroton)

### 👥 Manajemen Grup
- **Admin Tools**: Kick, promote, demote anggota
- **Anti Mention**: Perlindungan dari mention spam
- **Word Blocker**: Filter kata-kata terlarang
- **Strike System**: Sistem peringatan untuk anggota
- **Activity Score**: Sistem poin aktivitas grup
- **Welcome Message**: Pesan selamat datang otomatis

### 💰 Sistem Ekonomi
- **Virtual Currency**: Mata uang virtual dengan sistem mining
- **Transfer**: Transfer mata uang antar pengguna
- **Transaction History**: Riwayat transaksi lengkap
- **Leaderboard**: Papan peringkat pengguna

### 🛠️ Tools & Utilitas
- **Sticker Converter**: Konversi media ke sticker dan sebaliknya
- **Screenshot Website**: Ambil screenshot dari website
- **Notes System**: Sistem catatan dengan password
- **Ping**: Cek status dan latency bot
- **Info**: Informasi sistem dan bot

### 🌐 Multi-bahasa
- Dukungan bahasa Indonesia dan Inggris
- Pengaturan bahasa per pengguna dan grup

## 🚀 Instalasi

### Prasyarat
- Node.js (versi 18 atau lebih baru)
- MongoDB
- FFmpeg (untuk pemrosesan media)

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/username/nakiri-bot.git
   cd nakiri-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Konfigurasi environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env` dan sesuaikan dengan konfigurasi Anda:
   ```env
   APP_LOCALE="id"
   APP_URL="http://localhost:3100"
   NODE_ENV=development
   SESSION_NAME="nakiri-your-number"
   
   CLIENT_URL="http://localhost:8000"
   SECRET_TOKEN=your-secret-token
   
   DATABASE_URL="mongodb://localhost:27017/nakiri"
   
   # API Keys (opsional)
   TOGETHER_API_KEY=your-together-api-key
   POLLINATIONS_AI_API_KEY=your-pollinations-key
   BLACKBOX_API_KEY=your-blackbox-key
   OPENROUTER_API_KEY=your-openrouter-key
   EXAROTON_TOKEN=your-exaroton-token
   EXAROTON_SERVER_ID=your-server-id
   ```

5. **Jalankan bot**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Scan QR Code**
   - Bot akan menampilkan QR code di terminal
   - Scan dengan WhatsApp untuk menghubungkan bot

## 📁 Struktur Project

```
nakiri-bot/
├── app/
│   ├── bot/
│   │   ├── commands/          # Command handlers
│   │   │   ├── ai/           # AI commands
│   │   │   ├── downloader/   # Download commands
│   │   │   ├── fun/          # Fun commands
│   │   │   ├── game/         # Game commands
│   │   │   ├── group/        # Group management
│   │   │   ├── owner/        # Owner-only commands
│   │   │   ├── personal/     # Personal commands
│   │   │   └── tools/        # Utility tools
│   │   ├── event/            # Event handlers
│   │   ├── middleware/       # Bot middleware
│   │   └── socket.js         # WhatsApp socket connection
│   ├── express/              # Express.js server
│   ├── lang/                 # Language files
│   ├── prisma/               # Generated Prisma client
│   └── utils/                # Utility functions
├── prisma/
│   └── schema.prisma         # Database schema
├── storage/                  # File storage
└── index.js                  # Main entry point
```

## 🔧 Konfigurasi

### Database
Bot menggunakan MongoDB dengan Prisma ORM. Schema database mencakup:
- **Users**: Data pengguna dan balance
- **Groups**: Konfigurasi grup dan fitur
- **Transactions**: Riwayat transaksi mata uang
- **Notes**: Sistem catatan
- **Device Auth**: Autentikasi perangkat WhatsApp

### API Keys
Beberapa fitur memerlukan API key:
- **Together AI**: Untuk fitur AI chat
- **Pollinations AI**: Untuk generasi gambar AI
- **Blackbox AI**: Untuk coding assistance
- **OpenRouter**: Untuk multiple AI models
- **Exaroton**: Untuk manajemen server Minecraft

## 📝 Penggunaan

### Command Prefix
Bot menggunakan prefix yang dapat dikonfigurasi (default: `/`, `!`, `.`)

### Contoh Commands
```
/menu - Tampilkan menu utama
/ytmp3 <url> - Download audio YouTube
/sticker - Konversi gambar ke sticker
/balance - Cek saldo mata uang
/mine - Mining mata uang virtual
/blackjack - Main blackjack
/ai <pesan> - Chat dengan AI
```

### Owner Commands
```
/eval <code> - Execute JavaScript code
/setpp - Set profile picture bot
/prefix <new_prefix> - Ubah prefix bot
```

## 🛡️ Keamanan

- Sistem autentikasi berbasis token
- Rate limiting untuk API endpoints
- Validasi input dengan Zod
- Sanitasi data untuk mencegah injection
- Sistem ban dan strike untuk moderasi

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 Lisensi

Distributed under the ISC License. See `LICENSE` for more information.

## 👨‍💻 Author

**ilsyaa** - Developer utama

## 🙏 Acknowledgments

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Prisma](https://prisma.io) - Database ORM
- [Express.js](https://expressjs.com) - Web framework
- Semua kontributor dan pengguna bot

## 📞 Support

Jika Anda mengalami masalah atau memiliki pertanyaan:
1. Buka issue di GitHub repository
2. Pastikan untuk menyertakan log error dan langkah reproduksi
3. Gunakan template issue yang tersedia

---

⭐ Jangan lupa untuk memberikan star jika project ini membantu Anda!