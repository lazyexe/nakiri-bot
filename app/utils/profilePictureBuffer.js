import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

export default async function ({ sock = null, jid, name = null }) {
  const profilePath = path.join(
    __storagedir,
    'public',
    'profile',
    `${name || jid}.jpg`
  );

  if (fs.existsSync(profilePath)) {
    try {
      const stats = fs.statSync(profilePath);
      const fileTime = DateTime.fromJSDate(stats.mtime).toUTC();
      const now = DateTime.utc();

      const diffHours = now.diff(fileTime, 'hours').hours;

      // console.log(`File: ${path.basename(profilePath)} - Modifikasi: ${fileTime.toISO()} - Selisih jam: ${diffHours.toFixed(2)}`);

      if (diffHours < 5) {
        // console.log('File masih fresh, menggunakan file yang sudah ada.');
        // return process.env.APP_URL + '/cdn/profile/' + `${name || jid}.jpg`;
        return fs.readFileSync(profilePath);
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // console.error('Error saat membaca stats file, menghapus file lama.', error);
      fs.unlinkSync(profilePath);
    }
  }

  try {
    // console.log('Mendownload profile picture baru.');
    const url = await sock.profilePictureUrl(jid);
    const buffer = await axios
      .get(url, { responseType: 'arraybuffer' })
      .then(res => Buffer.from(res.data, 'binary'))
      .catch(() => null);

    if (buffer) {
      fs.writeFileSync(profilePath, buffer);
      // console.log('Profile picture baru berhasil disimpan.');
      return fs.readFileSync(profilePath);
    }

    // console.log('Gagal mendapatkan buffer gambar.');
    return null;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    // console.error('Error downloading profile picture:', error);
    return null;
  }
};