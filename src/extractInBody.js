require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EMPTY_INBODY = {
  weight_kg: 0,
  skeletal_muscle_mass_kg: 0,
  body_fat_mass_kg: 0,
  body_fat_percentage: 0,
  bmi: 0,
  bmr_kcal: 0,
  visceral_fat_level: 0,
  total_body_water_L: 0,
  inbody_score: 0
};

const PROMPT = `You are analyzing an InBody body composition report image.
Extract ONLY these metrics and return as valid JSON only,
no explanation, no markdown, just raw JSON:
{
  "weight_kg": number,
  "skeletal_muscle_mass_kg": number,
  "body_fat_mass_kg": number,
  "body_fat_percentage": number,
  "bmi": number,
  "bmr_kcal": number,
  "visceral_fat_level": number,
  "total_body_water_L": number,
  "inbody_score": number
}
If any value is not visible in the image, use 0.`;

async function extractInBody(imageBase64, mimeType) {
  console.log('[extractInBody] Sending image to Gemini for metric extraction...');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType
    }
  };

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[extractInBody] Attempt ${attempt}...`);
      const result = await model.generateContent([PROMPT, imagePart]);
      const text = result.response.text().trim();

      // Strip markdown code fences if Gemini wraps the JSON
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const metrics = JSON.parse(cleaned);

      console.log('[extractInBody] Metrics extracted:', JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      lastError = error;
      console.error(`[extractInBody] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === 1) {
        console.log('[extractInBody] Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.error('[extractInBody] Both attempts failed. Returning empty InBody metrics.');
  return { ...EMPTY_INBODY };
}

module.exports = { extractInBody, EMPTY_INBODY };
