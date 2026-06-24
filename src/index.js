require('dotenv').config();
const express = require('express');
const { webhookHandler } = require('./webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON bodies up to 10 MB (InBody images can be large)
app.use(express.json({ limit: '10mb' }));

// Health check — useful for Railway and uptime monitors
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'gym-onboarding-ai',
    timestamp: new Date().toISOString()
  });
});

// Main webhook endpoint — Fillout posts here after every form submission
app.post('/webhook', webhookHandler);

// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ┌─────────────────────────────────────────┐');
  console.log('  │        Gym Onboarding AI — Ready        │');
  console.log(`  │  Server listening on port ${PORT}          │`);
  console.log(`  │  Health: http://localhost:${PORT}/health   │`);
  console.log(`  │  Webhook: POST http://localhost:${PORT}/webhook │`);
  console.log('  └─────────────────────────────────────────┘');
  console.log('');
});

module.exports = app;
