require('dotenv').config();
const { google } = require('googleapis');
const { getGoogleAuth } = require('./auth/googleAuth');

async function logToSheets(member, inbody, assessment, workout, nutrition) {
  console.log('[logSheets] Appending row to Google Sheets...');
  try {
    const auth = getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();

    const row = [
      timestamp,
      member.name,
      member.email,
      member.phone,
      member.age,
      member.gender,
      member.primary_goal,
      member.training_experience,
      member.days_available,
      member.injury_history,
      member.medical_considerations,
      inbody.weight_kg,
      inbody.skeletal_muscle_mass_kg,
      inbody.body_fat_percentage,
      inbody.bmi,
      inbody.bmr_kcal,
      inbody.visceral_fat_level,
      inbody.inbody_score,
      assessment,
      workout,
      nutrition
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:U',
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    });

    console.log('[logSheets] Row appended successfully.');
  } catch (error) {
    console.error(`[logSheets] Failed to log to Sheets: ${error.message}`);
  }
}

module.exports = { logToSheets };
