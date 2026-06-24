require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateNutrition(memberProfile, inbodyMetrics, assessment) {
  console.log('[generateNutrition] Generating nutrition plan...');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.3 }
  });

  const profileData = JSON.stringify({ ...memberProfile, inbody: inbodyMetrics }, null, 2);
  const weightForHydration = inbodyMetrics.weight_kg > 0
    ? `${inbodyMetrics.weight_kg} kg × 0.033 = ${(inbodyMetrics.weight_kg * 0.033).toFixed(1)} L`
    : 'bodyweight × 0.033 = daily litres';

  const prompt = `You are a sports nutritionist. Create a nutrition plan
with these exact sections:

1. CALORIE TARGET
Show: BMR → activity multiplier → TDEE → final target
State if surplus/deficit/maintenance and by how much

2. MACRONUTRIENT SPLIT
Table: Macro | Grams/day | Calories | % of total
Justify each number based on goal and body composition

3. MEAL TIMING
- Meals per day
- Pre-workout: what + how long before
- Post-workout: what + within how long
- Last meal timing

4. SAMPLE MEAL PLAN
6 meals with gram amounts using Indian food options:
Breakfast / Mid-Morning / Lunch / Pre-Workout /
Post-Workout / Dinner

5. FOODS TO PRIORITIZE
8 specific foods with one reason each

6. FOODS TO LIMIT
5 specific foods with one reason each

7. HYDRATION
${weightForHydration} + 500ml on training days

8. SUPPLEMENTS
Max 3, with dosage and timing only if relevant to goal

All gram amounts must add up to macro targets.
No generic advice.

MEMBER PROFILE + ASSESSMENT:
${profileData}

TRAINER ASSESSMENT:
${assessment}`;

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[generateNutrition] Attempt ${attempt}...`);
      const result = await model.generateContent(prompt);
      const nutrition = result.response.text();
      console.log('[generateNutrition] Nutrition plan generated successfully.');
      return nutrition;
    } catch (error) {
      lastError = error;
      console.error(`[generateNutrition] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === 1) {
        console.log('[generateNutrition] Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

module.exports = { generateNutrition };
