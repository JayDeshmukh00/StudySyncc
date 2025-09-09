// src/controllers/flashcard.controller.js
const FlashcardSet = require('../models/flashcardSet.model');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pdf = require('pdf-parse');

// No changes needed for this function
exports.getAllFlashcardSets = async (req, res) => {
    try {
        const sets = await FlashcardSet.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(sets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.generateFlashcards = async (req, res) => {
    try {
        let topic;
        let generationContext;

        if (req.file) {
            console.log('Generating flashcards from uploaded PDF...');
            const pdfBuffer = req.file.buffer;
            const data = await pdf(pdfBuffer);
            generationContext = data.text;
            topic = req.body.topic || req.file.originalname.replace(/\.pdf$/i, '');
        } else if (req.body.topic) {
            console.log('Generating flashcards from topic string...');
            topic = req.body.topic;
            generationContext = topic;
        } else {
            return res.status(400).json({ msg: 'Please provide a topic or upload a PDF.' });
        }

        const maxChars = 8000;
        const truncatedContext = generationContext.substring(0, maxChars);

        const prompt = `Based on the following text, generate a set of 10-15 key flashcards for the topic "${topic}". Each card must have a "term", "definition", and a concise "example". Return a single JSON object with a "topic" string and a "cards" array. Text to analyze: """${truncatedContext}"""`;
        
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            // --- THIS IS THE ONLY CHANGE ---
            model: 'llama-3.3-70b-versatile', // Updated to a current, high-performance model
            response_format: { type: 'json_object' },
        });

        const flashcardData = JSON.parse(completion.choices[0].message.content);

        if (!flashcardData.cards || flashcardData.cards.length === 0) {
            return res.status(500).json({ msg: 'AI failed to return valid flashcard data.' });
        }

        const newSet = new FlashcardSet({
            topic: flashcardData.topic || topic,
            user: req.user.id,
            cards: flashcardData.cards
        });

        await newSet.save();
        res.status(201).json(newSet);

    } catch (err) {
        console.error("Error generating flashcards:", err);
        res.status(500).json({ msg: 'Server error during flashcard generation.' });
    }
};

// No changes needed for this function
exports.deleteFlashcardSet = async (req, res) => {
    try {
        const result = await FlashcardSet.deleteOne({ _id: req.params.id, user: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'Flashcard set not found' });
        }
        res.json({ msg: 'Flashcard set deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};