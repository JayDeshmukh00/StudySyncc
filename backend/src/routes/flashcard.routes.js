const express = require('express');
const router = express.Router();
const flashcardController = require('../controllers/flashcard.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

// --- FEATURE: Multer Configuration ---
// Configure multer for in-memory file storage to handle PDF uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

router.get('/flashcard-sets', authMiddleware, flashcardController.getAllFlashcardSets);

// --- UPDATE: Add Multer Middleware ---
// The `upload.single('pdf')` middleware will process the uploaded file 
// and make it available as `req.file` in the controller.
router.post('/generate-flashcards', authMiddleware, upload.single('pdf'), flashcardController.generateFlashcards);

router.delete('/flashcard-sets/:id', authMiddleware, flashcardController.deleteFlashcardSet);

module.exports = router;
