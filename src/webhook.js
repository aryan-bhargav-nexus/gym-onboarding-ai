const { downloadFile } = require('./downloadFile');
const { extractInBody, EMPTY_INBODY } = require('./extractInBody');
const { generateAssessment } = require('./generateAssessment');
const { generateWorkout } = require('./generateWorkout');
const { generateNutrition } = require('./generateNutrition');
const { sendTrainerEmail, sendClientEmail } = require('./sendEmail');
const { logToSheets } = require('./logSheets');

function extractMemberData(questions) {
  function find(...keys) {
    for (const key of keys) {
      const q = questions.find(q => {
        const name = (q.name || q.id || q.title || '').toLowerCase().replace(/\s+/g, '_');
        return name === key.toLowerCase() || name.includes(key.toLowerCase());
      });
      if (!q) continue;
      if (q.value === null || q.value === undefined) continue;
      if (Array.isArray(q.value)) return q.value.join(', ');
      return String(q.value);
    }
    return '';
  }

  return {
    name: find('name', 'full_name', 'fullname', 'your_name'),
    email: find('email', 'email_address'),
    phone: find('phone', 'phone_number', 'mobile', 'contact_number'),
    age: find('age'),
    gender: find('gender', 'sex'),
    primary_goal: find('primary_goal', 'goal', 'fitness_goal', 'main_goal'),
    training_experience: find('training_experience', 'experience', 'fitness_level'),
    days_available: find('days_available', 'days', 'training_days', 'days_per_week'),
    injury_history: find('injury_history', 'injuries', 'injury', 'past_injuries') || 'None',
    medical_considerations: find('medical_considerations', 'medical', 'health_conditions', 'medical_history') || 'None'
  };
}

function extractImageUrl(questions) {
  const fileQuestion = questions.find(q => q.type === 'FileUpload');
  if (!fileQuestion) return null;
  if (Array.isArray(fileQuestion.value) && fileQuestion.value.length > 0) {
    return fileQuestion.value[0].url || null;
  }
  return null;
}

async function processWebhook(body) {
  console.log('[webhook] ── Starting async processing ──');

  const questions = body.questions || [];

  if (questions.length === 0) {
    console.warn('[webhook] No questions array found in body. Check Fillout webhook payload structure.');
  }

  const member = extractMemberData(questions);
  console.log(`[webhook] Member: ${member.name} | ${member.email} | Goal: ${member.primary_goal}`);

  // ── Step 1: Download InBody image ──────────────────────────────────────────
  let inbody = { ...EMPTY_INBODY };
  let imageDownloadFailed = false;

  const imageUrl = extractImageUrl(questions);
  if (imageUrl) {
    try {
      console.log('[webhook] Step 1/8 — Downloading InBody image...');
      const { base64, mimeType } = await downloadFile(imageUrl);

      // ── Step 2: Extract InBody metrics ──────────────────────────────────────
      console.log('[webhook] Step 2/8 — Extracting InBody metrics with Gemini Vision...');
      inbody = await extractInBody(base64, mimeType);
    } catch (error) {
      console.error(`[webhook] Image download or extraction failed: ${error.message}`);
      imageDownloadFailed = true;
    }
  } else {
    console.warn('[webhook] No FileUpload question found — skipping InBody extraction.');
    imageDownloadFailed = true;
  }

  // ── Step 3: Generate trainer assessment ───────────────────────────────────
  let assessment = '';
  try {
    console.log('[webhook] Step 3/8 — Generating trainer assessment...');
    assessment = await generateAssessment(member, inbody);
  } catch (error) {
    console.error(`[webhook] Assessment generation failed: ${error.message}`);
    assessment = 'Trainer assessment could not be generated automatically. Please assess manually.';
  }

  // ── Step 4: Generate workout plan ─────────────────────────────────────────
  let workout = '';
  try {
    console.log('[webhook] Step 4/8 — Generating workout plan...');
    workout = await generateWorkout(member, assessment);
  } catch (error) {
    console.error(`[webhook] Workout generation failed: ${error.message}`);
    workout = 'Workout plan could not be generated automatically. Please create manually.';
  }

  // ── Step 5: Generate nutrition plan ───────────────────────────────────────
  let nutrition = '';
  try {
    console.log('[webhook] Step 5/8 — Generating nutrition plan...');
    nutrition = await generateNutrition(member, inbody, assessment);
  } catch (error) {
    console.error(`[webhook] Nutrition generation failed: ${error.message}`);
    nutrition = 'Nutrition plan could not be generated automatically. Please create manually.';
  }

  // Prepend alert to assessment if image failed, so trainer knows
  if (imageDownloadFailed) {
    assessment = '⚠️  ALERT: InBody image could not be downloaded or processed. All body composition metrics are set to 0. Please obtain the InBody report manually.\n\n' + assessment;
  }

  // ── Step 6: Send trainer email ────────────────────────────────────────────
  console.log('[webhook] Step 6/8 — Sending trainer email...');
  await sendTrainerEmail(member, inbody, assessment, workout, nutrition);

  // ── Step 7: Send client email ─────────────────────────────────────────────
  console.log('[webhook] Step 7/8 — Sending client email...');
  await sendClientEmail(member, assessment, workout, nutrition);

  // ── Step 8: Log to Google Sheets ──────────────────────────────────────────
  console.log('[webhook] Step 8/8 — Logging to Google Sheets...');
  await logToSheets(member, inbody, assessment, workout, nutrition);

  console.log(`[webhook] ── Processing complete for ${member.name} ──`);
}

function webhookHandler(req, res) {
  // Respond to Fillout immediately so the request does not time out
  res.status(200).json({ received: true });
  console.log('[webhook] 200 sent to Fillout. Starting background processing...');

  // Process everything in the background — do NOT await
  processWebhook(req.body).catch(error => {
    console.error('[webhook] Unhandled error in processWebhook:', error.message);
  });
}

module.exports = { webhookHandler };
