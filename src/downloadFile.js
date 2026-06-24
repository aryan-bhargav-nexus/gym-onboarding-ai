const axios = require('axios');

async function downloadFile(url) {
  console.log(`[downloadFile] Downloading image from: ${url}`);

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: {
      'User-Agent': 'GymOnboardingAI/1.0'
    }
  });

  const buffer = Buffer.from(response.data);
  const base64 = buffer.toString('base64');
  const mimeType = response.headers['content-type'] || 'image/jpeg';

  console.log(`[downloadFile] Downloaded successfully — ${buffer.length} bytes, type: ${mimeType}`);
  return { base64, mimeType };
}

module.exports = { downloadFile };
