require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateWorkout(memberProfile, assessment) {
  console.log('[generateWorkout] Generating workout plan...');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.3 }
  });

  const profileData = JSON.stringify(memberProfile, null, 2);

  const prompt = `You are a certified personal trainer. Generate a
${memberProfile.days_available}-day weekly workout plan.

Format every exercise as:
| Exercise | Sets | Reps | Rest | Coaching Cue |

Rules:
- 2-3 days = Full Body split
- 4 days = Upper/Lower split
- 5-6 days = Push/Pull/Legs split
- Fat loss goal = 12-15 reps, 30-45s rest
- Muscle gain goal = 8-12 reps, 60-90s rest
- Strength goal = 4-6 reps, 2-3min rest
- No exercises conflicting with: ${memberProfile.injury_history}
- Include warmup and cooldown rows
- State split chosen and why
- Add one weekly progression rule

MEMBER PROFILE + ASSESSMENT:
${profileData}

TRAINER ASSESSMENT:
${assessment}`;

  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[generateWorkout] Attempt ${attempt}...`);
      const result = await model.generateContent(prompt);
      const workout = result.response.text();
      console.log('[generateWorkout] Workout plan generated successfully.');
      return workout;
    } catch (error) {
      lastError = error;
      console.error(`[generateWorkout] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === 1) {
        const delayMatch = error.message.match(/"retryDelay":"(\d+)s"/);
        const delayMs = delayMatch ? (parseInt(delayMatch[1], 10) + 2) * 1000 : 65000;
        console.log(`[generateWorkout] Retrying in ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

module.exports = { generateWorkout };
