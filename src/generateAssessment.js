require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAssessment(memberProfile, inbodyMetrics) {
  console.log('[generateAssessment] Generating trainer assessment...');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { temperature: 0.3 }
  });

  const profileData = JSON.stringify({ ...memberProfile, inbody: inbodyMetrics }, null, 2);

  const prompt = `You are a certified personal trainer and sports nutritionist
with 10+ years experience. Write a TRAINER ASSESSMENT for
this member using EXACTLY these sections:

1. CURRENT FITNESS STATUS
- Interpret each InBody metric in plain English
- State if below average / average / above average for
  their age and gender

2. RED FLAGS & OBSERVATIONS
- Flag injuries, medical considerations, concerning metrics
- Be specific to their numbers

3. PRIMARY TRAINING FOCUS
- State the #1 training priority
- Justify using their actual InBody numbers

4. REALISTIC MILESTONES
- 4-week target (specific and measurable)
- 8-week target (specific and measurable)
- 12-week target (specific and measurable)

5. EXERCISE MODIFICATIONS
- List exercises to AVOID based on injury history
- List one safe alternative for each

No generic advice. Use their actual numbers throughout.
Under 500 words.

MEMBER PROFILE: ${profileData}`;

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[generateAssessment] Attempt ${attempt}...`);
      const result = await model.generateContent(prompt);
      const assessment = result.response.text();
      console.log('[generateAssessment] Assessment generated successfully.');
      return assessment;
    } catch (error) {
      lastError = error;
      console.error(`[generateAssessment] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === 1) {
        console.log('[generateAssessment] Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

module.exports = { generateAssessment };
