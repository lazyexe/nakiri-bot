import axios from 'axios';
import FormData from 'form-data';
import { FileTypeParser } from 'file-type';
import { randomBytes } from 'crypto';

export const tmpfiles = async (buffer) => {
  try {
    const fileType = await new FileTypeParser().fromBuffer(buffer);
    const { ext } = fileType || {};
    const formData = createFormData(buffer, 'file', ext);
    
    const response = await axios.post(
      'https://tmpfiles.org/api/v1/upload',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'User-Agent': fakeUserAgent(),
        },
      },
    );

    const result = response.data;
    const match = /https?:\/\/tmpfiles.org\/(.*)/.exec(result.data.url);
          
    if (match && match[1]) {
      return `https://tmpfiles.org/dl/${match[1]}`;
    } else {
      console.error('[UPLOADER] Unexpected URL format:', result.data.url);
      return null;
    }
  } catch (error) {
    console.error('[UPLOADER] Error uploading file:', error.message);
    return null;
  }
};

const createFormData = (buffer, fieldName, ext) => {
  const formData = new FormData();
  const filename = `${randomBytes(6).toString('hex')}.${ext}`;
  formData.append(fieldName, buffer, filename);
  return formData;
};

const fakeUserAgent = () => {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36';
  return userAgent;
};
