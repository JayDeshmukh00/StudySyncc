// src/routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Existing route for the main chat stream
router.post('/', authMiddleware, chatController.streamChat);

// --- NEW: Route for summarizing the conversation ---
router.post('/summarize', authMiddleware, chatController.summarizeChat);

module.exports = router;