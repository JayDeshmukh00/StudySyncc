const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/auth.middleware');
const {
    uploadAndProcessPdf,
    getDocuments,
    getDocumentById,
    streamDocument, // Correctly included for streaming
    translatePage,
    saveNote,
    getNotesForDocument,
    deleteNote
} = require('../controllers/aura.controller');

// Use multer's memory storage to process the file before uploading
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Document Routes ---
router.post('/upload', [authMiddleware, upload.single('pdf')], uploadAndProcessPdf);
router.get('/documents', authMiddleware, getDocuments);
router.get('/documents/:docId', authMiddleware, getDocumentById);

// --- NEW/FIXED: Securely streams the PDF content through your server ---
router.get('/documents/:docId/stream', authMiddleware, streamDocument);

router.post('/documents/:docId/pages/:pageNum/translate', authMiddleware, translatePage);


// --- Note Routes ---
router.post('/notes', authMiddleware, saveNote);
router.get('/notes/document/:docId', authMiddleware, getNotesForDocument);
router.delete('/notes/:noteId', authMiddleware, deleteNote);

module.exports = router;

