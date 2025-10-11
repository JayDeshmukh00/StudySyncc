const { AuraDocument } = require('../models/auraNote.model');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ensure this helper function is present in this file or imported from a shared utility file.
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


exports.generateQuiz = async (req, res) => {
    const { documentId, numQuestions = 5, difficulty = 'medium' } = req.body;

    try {
        const document = await AuraDocument.findById(documentId);
        if (!document || document.user.toString() !== req.user.id) {
            return res.status(404).json({ msg: 'Document not found' });
        }

        const fullText = document.originalContent.map(p => p.text).join('\n\n');

        const prompt = `
            You are "BerryBot Mastermind", an expert quiz creator.
            Based on the following text, generate a quiz with exactly ${numQuestions} questions.
            The difficulty should be ${difficulty}.
            For each question, provide a concise but comprehensive correct answer derived strictly from the text.
            
            Respond with ONLY a valid JSON array of objects. Each object must have "question" and "answer" keys.

            DOCUMENT TEXT:
            ---
            ${fullText.substring(0, 8000)} 
        `; // Limit text length to ensure faster processing

        // --- THE FIX: Use a faster AI model for quiz generation ---
        const quizJsonString = await generateTextWithRetries(prompt, 'llama-3.1-8b-instant', 'Quiz Generation');
        
        const quiz = JSON.parse(quizJsonString);
        res.json(quiz);

    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ msg: 'Failed to generate quiz. The AI may have returned an invalid format.' });
    }
};

// ... (evaluateAnswer and analyzePerformance functions remain the same) ...

exports.evaluateAnswer = async (req, res) => {
    const { question, correctAnswer, userAnswer } = req.body;

    if (!question || !correctAnswer || !userAnswer) {
        return res.status(400).json({ msg: 'Missing required fields for evaluation.' });
    }

    try {
        const prompt = `
            You are an impartial quiz judge. A student was asked a question and gave an answer.
            Analyze the student's answer based on the provided correct answer.
            The student's answer must be semantically and factually correct.
            
            Respond with ONLY a valid JSON object with two keys:
            1. "isCorrect": a boolean (true or false).
            2. "feedback": a short, encouraging, one-sentence explanation.

            Question: "${question}"
            Correct Answer: "${correctAnswer}"
            Student's Answer: "${userAnswer}"
        `;

        const evaluationJsonString = await generateTextWithRetries(prompt, 'llama-3.1-8b-instant', 'Answer Evaluation');
        const evaluation = JSON.parse(evaluationJsonString);
        res.json(evaluation);

    } catch (error) {
        console.error('Error evaluating answer:', error);
        res.status(500).json({ msg: 'Failed to evaluate the answer.' });
    }
};

exports.analyzePerformance = async (req, res) => {
    const { quizResults } = req.body;

    try {
        const prompt = `
            You are "BerryBot Mastermind", a helpful study coach.
            A student has just completed a quiz. Here is their performance data:
            ${JSON.stringify(quizResults, null, 2)}

            Provide a brief, insightful, and encouraging overall analysis for the student.
            - Summarize their score.
            - Identify topics they understand well.
            - Gently point out areas for review.
            - End with an encouraging closing statement.
            Keep the entire analysis to 3-4 sentences.
        `;
        const analysisText = await generateTextWithRetries(prompt, 'llama-3.3-70b-versatile', 'Performance Analysis');
        res.json({ analysis: analysisText });
    } catch (error) {
        console.error('Error generating analysis:', error);
        res.status(500).json({ msg: 'Failed to generate performance analysis.' });
    }
};

