# Gym Onboarding AI

An automated backend that turns a Fillout form submission into a full trainer report, personalised workout plan, nutrition plan, two branded emails, and a Google Sheets log — all within seconds of a member clicking "Submit".

---

## What happens when a member submits the form

1. Fillout sends the form data to your server via webhook
2. The server replies **immediately** with 200 OK so Fillout is happy
3. In the background, it:
   - Downloads the member's InBody report image from Fillout's storage
   - Sends the image to Gemini AI and extracts all body composition numbers
   - Generates a detailed trainer assessment using those numbers
   - Generates a personalised weekly workout plan
   - Generates a personalised nutrition plan with Indian food options
   - Emails the **trainer** a full report (all metrics + all three plans)
   - Emails the **member** their workout and nutrition plan with a welcome message
   - Logs everything to a Google Sheet for your records

---

## Step 1 — Install Node.js

Node.js is the engine that runs this server. If you have never coded before, this is the only software you need to install.

1. Go to **https://nodejs.org**
2. Click the button that says **"LTS"** (the recommended version)
3. Download and run the installer — click Next on every screen
4. When it finishes, open a new terminal (search "Command Prompt" or "PowerShell" on Windows / "Terminal" on Mac)
5. Type this and press Enter to confirm it worked:

```
node --version
```

You should see something like `v20.11.0`. If you do, Node.js is installed.

---

## Step 2 — Download this project and install packages

1. Put this project folder (`gym-onboarding-ai`) on your Desktop or anywhere you like
2. Open your terminal and navigate to the folder. Replace the path below with wherever you actually put it:

```
cd C:\Users\YourName\Desktop\gym-onboarding-ai
```

3. Install all the required packages by running:

```
npm install
```

This downloads everything automatically into a `node_modules` folder. It takes about 30 seconds.

---

## Step 3 — Get your Gemini API key

Gemini is the AI that reads the InBody images and generates all the plans.

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar
4. Click **"Create API Key"**
5. Copy the key — it looks like `AIzaSy...`
6. Paste it into your `.env` file next to `GEMINI_API_KEY=`

---

## Step 4 — Set up Google Cloud (for Gmail + Google Sheets)

This is the most involved step. Follow it exactly.

### 4a — Create a Google Cloud Project

1. Go to **https://console.cloud.google.com**
2. Sign in with the Gmail account you want to **send emails from** (this should be the gym's Gmail)
3. At the top, click the project dropdown → **"New Project"**
4. Name it `gym-onboarding` → click **Create**
5. Make sure the new project is selected in the dropdown at the top

### 4b — Enable the APIs you need

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for **"Gmail API"** → click it → click **Enable**
3. Go back to Library, search for **"Google Sheets API"** → click it → click **Enable**

### 4c — Create OAuth2 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials"** → choose **"OAuth client ID"**
3. If asked to configure the consent screen first:
   - Click **"Configure Consent Screen"**
   - Choose **External** → click Create
   - Fill in App name (e.g. `Gym Onboarding AI`) and your email → click Save and Continue
   - On the Scopes screen, click Save and Continue (no changes needed)
   - On the Test Users screen, add your Gmail address → click Save and Continue
   - Click Back to Dashboard
4. Now go back to Credentials → **"+ Create Credentials"** → **"OAuth client ID"**
5. For Application type, choose **"Web application"**
6. Under **Authorized redirect URIs**, click **"+ Add URI"** and enter exactly:
   ```
   https://developers.google.com/oauthplayground
   ```
7. Click **Create**
8. A popup shows your **Client ID** and **Client Secret** — copy both into your `.env` file

### 4d — Get your Refresh Token

1. Go to **https://developers.google.com/oauthplayground**
2. Click the **gear icon** (⚙) in the top right corner
3. Check **"Use your own OAuth credentials"**
4. Paste in your **Client ID** and **Client Secret** from Step 4c → close the settings panel
5. On the left, scroll down to find **"Gmail API v1"** and click the arrow to expand it
6. Select these two scopes (click the checkbox next to each):
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/spreadsheets`
7. Click **"Authorize APIs"** → sign in with your gym's Gmail account → click Allow
8. You will be redirected back. Click **"Exchange authorization code for tokens"**
9. Copy the **Refresh token** that appears → paste it into `.env` next to `GOOGLE_REFRESH_TOKEN=`

> **Important:** The refresh token only shows once. If you lose it, repeat steps 5–9.

---

## Step 5 — Set up your Google Sheet

1. Go to **https://sheets.google.com** and create a new blank spreadsheet
2. Name it something like `Gym Onboarding Log`
3. In **Row 1**, add these column headers exactly (one per cell, A through U):

```
Timestamp | Name | Email | Phone | Age | Gender | Goal | Experience | Days Available | Injuries | Medical Notes | Weight | SMM | Body Fat % | BMI | BMR | Visceral Fat | InBody Score | Trainer Assessment | Workout Plan | Nutrition Plan
```

4. Look at the URL of your sheet. It looks like:
   ```
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
   ```
   The long string between `/d/` and `/edit` is your **Sheet ID**
5. Paste that ID into `.env` next to `GOOGLE_SHEET_ID=`

---

## Step 6 — Fill in your .env file

Open the `.env` file in any text editor (Notepad works). Fill in every line:

```
GEMINI_API_KEY=AIzaSy...your key here...
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...your secret here...
GOOGLE_REFRESH_TOKEN=1//0g...your refresh token here...
TRAINER_EMAIL=yourtrainer@gmail.com
GYM_NAME=Iron House Gym
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
PORT=3000
```

Save the file.

---

## Step 7 — Run the server locally

In your terminal (inside the project folder), run:

```
npm run dev
```

You will see:

```
  ┌─────────────────────────────────────────┐
  │        Gym Onboarding AI — Ready        │
  │  Server listening on port 3000          │
  └─────────────────────────────────────────┘
```

Your server is now running. Keep this terminal open.

To stop it, press `Ctrl + C`.

---

## Step 8 — Test with ngrok (expose your local server to the internet)

Fillout needs a public URL to send webhooks to. ngrok creates a temporary public URL that tunnels to your local server.

### Install ngrok

1. Go to **https://ngrok.com** → sign up for a free account
2. Download ngrok for your operating system
3. Follow their setup instructions to authenticate your ngrok account

### Start ngrok

Open a **second** terminal window (keep the first one running your server) and run:

```
ngrok http 3000
```

You will see something like:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the `https://...ngrok-free.app` URL.

### Connect to Fillout

1. In Fillout, open your form → go to **Integrations** or **Webhooks**
2. Add a new webhook with the URL:
   ```
   https://abc123.ngrok-free.app/webhook
   ```
3. Submit a test form — watch your server terminal for log output
4. Check that the trainer and client emails arrive, and that a row appears in your Google Sheet

> **Note:** The free ngrok URL changes every time you restart it. For production, use a paid ngrok plan or deploy to Railway (see Step 9).

---

## Step 9 — Deploy to Railway (free, permanent hosting)

Railway gives you a permanent URL so you do not need to run your computer 24/7.

### Create a Railway account

1. Go to **https://railway.app** → sign up with GitHub (free)

### Push your code to GitHub first

1. Go to **https://github.com** → sign in → click **"New repository"**
2. Name it `gym-onboarding-ai` → click **Create repository**
3. Follow the instructions GitHub shows you to push your code. In your terminal:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/gym-onboarding-ai.git
git push -u origin main
```

### Deploy on Railway

1. Go to **https://railway.app/new**
2. Click **"Deploy from GitHub repo"**
3. Select your `gym-onboarding-ai` repository
4. Railway will detect it is a Node.js app and deploy it automatically

### Add your environment variables on Railway

1. In your Railway project, click on your service
2. Go to the **"Variables"** tab
3. Click **"Add Variable"** and add every line from your `.env` file:
   - `GEMINI_API_KEY` → your value
   - `GOOGLE_CLIENT_ID` → your value
   - `GOOGLE_CLIENT_SECRET` → your value
   - `GOOGLE_REFRESH_TOKEN` → your value
   - `TRAINER_EMAIL` → your value
   - `GYM_NAME` → your value
   - `GOOGLE_SHEET_ID` → your value
   - `PORT` → `3000`
4. Railway will automatically redeploy after you add the variables

### Get your permanent URL

1. Go to the **"Settings"** tab of your Railway service
2. Under **"Domains"**, click **"Generate Domain"**
3. You will get a URL like `https://gym-onboarding-ai-production.up.railway.app`
4. Your webhook URL is: `https://gym-onboarding-ai-production.up.railway.app/webhook`
5. Update this URL in Fillout's webhook settings

### Verify it is working

Visit `https://your-railway-url.up.railway.app/health` in your browser. You should see:
```json
{"status":"ok","service":"gym-onboarding-ai"}
```

Submit a test Fillout form — the full pipeline will run on Railway's servers.

---

## Folder Structure

```
gym-onboarding-ai/
├── src/
│   ├── index.js              Express server & routes
│   ├── webhook.js            Webhook handler & async pipeline coordinator
│   ├── downloadFile.js       Downloads InBody image from Fillout's S3 URL
│   ├── extractInBody.js      Gemini Vision — extracts body composition metrics
│   ├── generateAssessment.js Gemini — writes the trainer assessment
│   ├── generateWorkout.js    Gemini — generates the weekly workout plan
│   ├── generateNutrition.js  Gemini — generates the nutrition plan
│   ├── sendEmail.js          Gmail API — sends trainer and client emails
│   ├── logSheets.js          Google Sheets API — logs each submission
│   └── auth/
│       └── googleAuth.js     OAuth2 client setup (shared by Gmail + Sheets)
├── .env                      Your private credentials (never commit this)
├── .env.example              Template showing which variables are needed
├── .gitignore                Keeps .env and node_modules out of git
└── README.md                 This file
```

---

## Troubleshooting

**"Cannot find module" error**
Run `npm install` again. Make sure you are in the project folder when you run it.

**Emails not sending**
- Double-check your `GOOGLE_REFRESH_TOKEN` is correct — it expires if unused for 6+ months
- Make sure Gmail API is enabled in Google Cloud Console
- Check that you selected the `gmail.send` scope in OAuth Playground

**Sheets not logging**
- Make sure Google Sheets API is enabled in Google Cloud Console
- Confirm the Sheet ID in `.env` is correct (the long string from the URL)
- The sheet must have a tab named `Sheet1` (the default name)

**Gemini errors**
- Confirm your `GEMINI_API_KEY` is correct
- Check https://aistudio.google.com to make sure your account is active

**ngrok URL not working**
- Make sure your local server is running (`npm run dev`) before starting ngrok
- The ngrok URL and the server must both be running at the same time
