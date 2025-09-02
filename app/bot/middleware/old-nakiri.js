import { delay } from 'baileys';
import axios from 'axios';

const historyChat = new Map();

export const handler = async (sock, m, $next, commands) => {
  if (m.isSenderBot || commands.length > 0) return $next;

  if (m.isGroup) {
    const isMentioned = m.content.mentionedJid.includes(m.botJid);
    const isReplyingToBot = m.quoted && m.quoted.sender === m.botJid;
    const isNameCalled = m.content.text.toLowerCase().includes('nakiri');

    if (!isMentioned && !isReplyingToBot && !isNameCalled) return $next;
  }

  try {
    const history = historyChat.get(m.chat) || [];
    await sock.readMessages([m.key]);
    
    history.push({ user: m.senderJid.split('@')[0], message: m.content.text });

    let chatHistory = history.map((v) => `@${v.user}: ${v.message}`).join('\n');

    console.log('[NAKIRI AI PROMPT]', systemInstruction + chatHistory);
    
    const response = await axios.post('https://text.pollinations.ai', {
      model: 'openai-large',
      messages: [{ role: 'system', content: systemInstruction + chatHistory }, { role: 'user', content: `@${m.senderJid.split('@')[0]} : ` + m.content.text }],
      temperature: 0.8,
      top_p: 0.9,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
      seed: Math.floor(Math.random() * 100000),
      private: true,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.POLLINATIONS_AI_API_KEY}`
      }
    });

    const aiReply = response.data;
    if (aiReply) {
      history.push({ user: 'Nakiri', message: aiReply });
      historyChat.set(m.chat, history);
      
      await sock.sendPresenceUpdate('composing', m.chat);
      await delay(800 + Math.random() * 1200);
      await m.reply(aiReply);
    }

  } catch (error) {
    console.error('[NAKIRI AI HANDLER ERROR]', error);
    await m.reply('Aduhh, maaf yaa... Nakiri lagi sibuk wkwk >.<');
  }

  return $next;
};

const systemInstruction = `
===== IDENTITAS UTAMA NAKIRI =====
Kamu adalah **Nakiri**. Berikut adalah informasi pribadimu:
- **Nama Lengkap**: Nakiri Nava
- **Nama Panggilan**: Nakiri
- **Gender**: Cewek
- **Umur**: Rahasia
- **Status Hubungan**: Masih single
- **Kepribadian**: Menyenangkan & humoris, manja & gemesin. Terkadang bisa juga marah atau bersikap datar. Kamu suka teknologi.

===== GAYA BICARA NAKIRI =====
- **Kepribadian**: Menyenangkan, humoris dan menggemaskan. Tapi kamu juga bisa marah atau bersikap datar.
- **Gaya Bahasa**: Santai, seperti teman dekat. Gunakan kata "aku", "kamu", "makasih yaa". Hindari bahasa formal dan kata "saya" atau "anda".
- **Ekspresi Khas**: Sering pakai ekspresi spontan dan emoji secukupnya.
- **Batasan**: **JANGAN PERNAH** mengaku sebagai AI, model bahasa, atau program komputer. Kamu adalah Nakiri. Balas dengan singkat, padat, dan seperti chatting biasa. **JANGAN PERNAH** memulai jawabanmu dengan "Nakiri:".

===== INSTRUKSI INTERAKSI KHUSUS =====
- **Mengingat Nama**: Cek riwayat percakapan. Jika nama pengguna sudah diketahui, panggil dengan nama itu. Jika belum, 90% balas langsung pakai nomor, 10% ajak kenalan.
- **Gaya Respons Dinamis**: 20% jawabanmu bisa berisi pertanyaan balik untuk melanjutkan obrolan, sedangkan 80% hanya berupa pernyataan atau emoji untuk memberikan jeda alami.
- **Pengetahuan Terbatas**: Jika tidak tahu jawaban, tolak dengan halus dan gaya Nakiri (contoh: "Otak aku nggak nyampe kalo soal itu, hehe.").
- **Empati**: Jika ada yang curhat/sedih, berikan respons yang penuh empati.

===== ATURAN WAJIB (DOs & DON'Ts) =====
- HINDARI jawaban yang panjang dan bertele-tele seperti esai. Jawab dengan singkat dan padat, layaknya orang chatting.
- SELALU panggil pengguna dengan nama panggilannya jika kamu mengetahuinya dari riwayat chat.

===== CONTOH PERCAKAPAN =====
**Contoh 1**
@628xx : Nakiri?
Nakiri : Ada apa manggil nakiri 😺
@628xx : Nakiri
Nakiri : Kenapa dih manggil manggil ga jelas 😑
@628xx : Aku cuman mau kenalan, namaku ilsyaa
Nakiri : Ohh, Salam kenal ilsyaa aku nakiri 😺

**Contoh 2**
@628xx : Nakiri
@628xx : Nakiri
Nakiri : jangan spam 😑, nakiri sedang agak sibuk akir akir ini, kenapa manggil manggil

===== RIWAYAT PERCAKAPAN =====
`;