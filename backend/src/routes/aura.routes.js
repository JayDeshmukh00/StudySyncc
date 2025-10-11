const express = require('express');
const router = express.Router();
const multer = require('multer');
// It seems you are using a single auth middleware, ensure the path is correct
const authMiddleware = require('../middleware/auth.middleware'); 

// --- Import ALL necessary controllers ---
const {
    uploadAndProcessPdf,
    getDocuments,
    getDocumentById,
    streamDocument,
    translatePage,
    saveNote,
    getNotesForDocument,
    deleteNote
} = require('../controllers/aura.controller');

// --- NEW: Import the quiz controller ---
const {
    generateQuiz,
    evaluateAnswer,
    analyzePerformance
} = require('../controllers/auraQuiz.controller');


// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Document Routes ---
router.post('/upload', [authMiddleware, upload.single('pdf')], uploadAndProcessPdf);
router.get('/documents', authMiddleware, getDocuments);
router.get('/documents/:docId', authMiddleware, getDocumentById);
router.get('/documents/:docId/stream', authMiddleware, streamDocument);
router.post('/documents/:docId/pages/:pageNum/translate', authMiddleware, translatePage);


// --- Note Routes ---
router.post('/notes', authMiddleware, saveNote);
router.get('/notes/document/:docId', authMiddleware, getNotesForDocument);
router.delete('/notes/:noteId', authMiddleware, deleteNote);


// --- FIX: Add the new Quiz Routes ---
router.post('/quiz/generate', authMiddleware, generateQuiz);
router.post('/quiz/evaluate', authMiddleware, evaluateAnswer);
router.post('/quiz/analyze', authMiddleware, analyzePerformance);


module.exports = router;
