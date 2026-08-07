/**
 * AI Routes - Voice Assistant API
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Chat with AI assistant
router.post('/chat', aiController.chatWithAI);

module.exports = router;