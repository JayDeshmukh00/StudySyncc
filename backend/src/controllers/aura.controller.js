const { AuraNote, AuraDocument } = require('../models/auraNote.model');
const pdf = require('pdf-parse');
const { v2: cloudinary } = require('cloudinary');
const axios = require('axios');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// --- Cloudinary Configuration ---
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// --- Helper function to upload a buffer to Cloudinary ---
const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'aura-pdfs',
                resource_type: 'raw',
                type: 'authenticated',
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};


// --- Helper Function for AI Calls ---
const generateTextWithRetries = async (prompt, model, logIdentifier) => {
    let attempt = 0;
    const maxRetries = 3;
    while (attempt < maxRetries) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: model,
            });
            const content = completion.choices[0]?.message?.content;
            if (!content) throw new Error("AI returned empty content.");
            return content;
        } catch (error) {
            attempt++;
            console.error(`Error generating text for '${logIdentifier}' (Attempt ${attempt}/${maxRetries}):`, error.message);
            if (attempt >= maxRetries) throw error;
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// --- Document-Level Controllers ---

exports.uploadAndProcessPdf = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded.' });
    }
    try {
        const buffer = req.file.buffer;

        // --- PERFORMANCE FIX: Use the 'pagerender' method for a single, efficient pass ---
        const data = await pdf(buffer, {
            pagerender: (pageData) => {
                // This callback is executed for each page during a single read-through.
                return pageData.getTextContent({ normalizeWhitespace: true })
                    .then(textContent => {
                        // We return the text content of the page.
                        return textContent.items.map(item => item.str).join(' ');
                    });
            }
        });

        // The 'pagerender' option separates pages with a double newline. We split by this to get our pages.
        const originalContent = data.text.split('\n\n').map((text, index) => ({
            page: index + 1,
            text: text.trim(),
        })).filter(page => page.text.length > 20); // Filter out blank or near-blank pages

        if (originalContent.length === 0) {
             return res.status(400).json({ msg: 'Could not extract any meaningful text content from the PDF.' });
        }

        const cloudinaryResult = await uploadBufferToCloudinary(buffer);

        const newDocument = new AuraDocument({
            user: req.user.id,
            fileName: req.file.originalname,
            cloudinaryUrl: cloudinaryResult.secure_url,
            cloudinaryPublicId: cloudinaryResult.public_id,
            totalPages: originalContent.length, // Total pages is now the count of successfully extracted pages
            originalContent: originalContent,
        });

        await newDocument.save();
        res.status(201).json(newDocument);

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ msg: 'Server error while processing PDF.' });
    }
};


exports.getDocuments = async (req, res) => {
    try {
        const documents = await AuraDocument.find({ user: req.user.id }).select('-originalContent -translations').sort({ createdAt: -1 });
        res.json(documents);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const document = await AuraDocument.findOne({ _id: req.params.docId, user: req.user.id });
        if (!document) return res.status(404).json({ msg: 'Document not found' });
        res.json(document);
    } catch (err) {
         res.status(500).send('Server Error');
    }
};

exports.streamDocument = async (req, res) => {
    try {
        const document = await AuraDocument.findOne({ _id: req.params.docId, user: req.user.id });
        if (!document || !document.cloudinaryPublicId) {
            return res.status(404).json({ msg: 'Document not found or is missing a public ID.' });
        }

        const signedUrl = cloudinary.utils.url(document.cloudinaryPublicId, {
            resource_type: 'raw',
            type: 'authenticated',
            sign_url: true,
            secure: true
        });

        const response = await axios({
            method: 'GET',
            url: signedUrl,
            responseType: 'stream',
        });

        res.setHeader('Content-Type', 'application/pdf');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error streaming document:', error);
        res.status(500).send('Server Error while streaming document');
    }
};


// In auraNote.controller.js

// List of supported languages for cleaning up the AI response
const SUPPORTED_LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Russian', 'Arabic'];

exports.translatePage = async (req, res) => {
    const { docId, pageNum } = req.params;
    const { targetLanguage } = req.body;

    try {
        const document = await AuraDocument.findById(docId);
        if (!document || document.user.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        const pageContent = document.originalContent.find(p => p.page === parseInt(pageNum));
        if (!pageContent || !pageContent.text) {
            return res.status(400).json({ 
                msg: 'This page has no readable text content, it might be an image or a blank page.' 
            });
        }
        
        // --- ROBUSTNESS FIX 1: Clean the language detection output ---
        const detectionPrompt = `Detect the primary language of the following text. Respond with only the name of the language (e.g., "Hindi", "Marathi", "English"). TEXT: "${pageContent.text}"`;
        const rawDetectedLanguage = await generateTextWithRetries(detectionPrompt, 'llama-3.1-8b-instant', `Page Language Detection`);
        
        // Find the first supported language mentioned in the AI's response. Default to 'English'.
        const detectedLanguage = SUPPORTED_LANGUAGES.find(lang => rawDetectedLanguage.includes(lang)) || 'English';

        // --- ROBUSTNESS FIX 2: Create a much smarter translation prompt ---
        const translationPrompt = `
            You are an expert academic translator. 
            A user wants to translate a page of a study document from ${detectedLanguage} to ${targetLanguage}.
            Translate the following text accurately, preserving the original formatting (like paragraphs and line breaks) and academic tone.
            
            IMPORTANT: If the text is nonsensical, garbled, or clearly not translatable (e.g., "asdfhjkl"), DO NOT attempt to translate it. Instead, respond with the single, exact phrase: UNTRANSLATABLE_CONTENT.

            TEXT TO TRANSLATE:
            "${pageContent.text}"
        `;
        const translatedText = await generateTextWithRetries(translationPrompt, 'llama-3.3-70b-versatile', `Translate Page ${pageNum} to ${targetLanguage}`);
        
        // --- ROBUSTNESS FIX 3: Handle the AI's signal for untranslatable content ---
        if (translatedText.trim() === 'UNTRANSLATABLE_CONTENT') {
            return res.status(400).json({ 
                msg: 'The text on this page appears to be corrupted or unreadable and could not be translated.' 
            });
        }

        res.json({ page: parseInt(pageNum), text: translatedText, sourceLanguage: detectedLanguage });

    } catch (error) {
        console.error(`Error translating page:`, error);
        res.status(500).json({ msg: 'An unexpected error occurred while translating the page.' });
    }
};

// --- Note-Level Controllers ---

exports.saveNote = async (req, res) => {
    const { originalText, documentId, language } = req.body;
    if (!originalText || !documentId || !language) {
        return res.status(400).json({ msg: 'Required fields are missing.' });
    }
    try {
        // --- INTELLIGENCE UPGRADE: Detect the source language first ---
        const detectionPrompt = `Detect the language of the following text. Respond with only the name of the language (e.g., "Hindi", "Marathi", "English"). TEXT: "${originalText}"`;
        // Use the faster model for the simple detection task
        const detectedLanguage = await generateTextWithRetries(detectionPrompt, 'llama-3.1-8b-instant', `Language Detection`);

        // --- Create a smarter prompt that provides more context to the AI ---
        const explanationPrompt = `
            You are "Buddy", a helpful study assistant. A user has selected text written in ${detectedLanguage}.
            Provide a clear, concise, and helpful explanation of this text IN ${language}.
            Be friendly and encouraging.
            TEXT TO EXPLAIN: "${originalText}"
        `;
        // Use the more powerful model for the detailed explanation
        const explanation = await generateTextWithRetries(explanationPrompt, 'llama-3.3-70b-versatile', `Note Explanation in ${language}`);

        const newNote = new AuraNote({
            user: req.user.id,
            document: documentId,
            originalText,
            explanation,
            language,
        });
        await newNote.save();
        
        // --- ENHANCEMENT: Return the new note and the detected source language ---
        res.status(201).json({ note: newNote, sourceLanguage: detectedLanguage });
        
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ msg: 'Server error while saving note.' });
    }
};

exports.getNotesForDocument = async (req, res) => {
    try {
        const notes = await AuraNote.find({ user: req.user.id, document: req.params.docId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const note = await AuraNote.findOne({ _id: req.params.noteId, user: req.user.id });
        if (!note) return res.status(404).json({ msg: 'Note not found' });
        await note.deleteOne();
        res.json({ msg: 'Note removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
}; 