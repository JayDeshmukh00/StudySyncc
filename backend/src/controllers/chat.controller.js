// src/controllers/chat.controller.js
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- UPDATED: New, more flexible system prompt ---
const getSystemPrompt = (currentView) => {
    let context = `You are StudySync Assistant, a friendly and knowledgeable AI study partner. Your primary goal is to help users with the StudySync application. 
    You can also answer general knowledge questions, especially if they are related to studying or learning. 
    When appropriate, you can offer the user a special quick action by ending your message with the format [ACTION:ACTION_NAME].`;

    switch(currentView) {
        case 'dashboard':
            context += " Currently available actions are: [ACTION:CREATE_PLAN] and [ACTION:VIEW_ANALYTICS].";
            break;
        case 'plan':
            context += " Currently available actions are: [ACTION:GENERATE_QUIZ] and [ACTION:CREATE_FLASHCARDS].";
            break;
        default:
            // No page-specific actions to add.
            break;
    }
    return context;
};

exports.streamChat = async (req, res) => {
    try {
        const { history, currentView } = req.body;
        const systemMessage = {
            role: 'system',
            content: getSystemPrompt(currentView || 'default')
        };
        const messagesWithSystemPrompt = [systemMessage, ...history];

        const stream = await groq.chat.completions.create({
            messages: messagesWithSystemPrompt,
            model: 'llama-3.3-70b-versatile',
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
        res.end();

    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).end();
    }
};

exports.summarizeChat = async (req, res) => {
    try {
        const { history } = req.body;
        const summaryPrompt = {
            role: 'system',
            content: 'You are a summarization expert. The user has provided a conversation they had with a study assistant. Your task is to summarize the key topics and important points from the conversation into a concise bulleted list. Do not include conversational filler.'
        };
        const messagesForSummary = [summaryPrompt, ...history];

        const completion = await groq.chat.completions.create({
            messages: messagesForSummary,
            model: 'l',
            stream: false, 
        });

        const summary = completion.choices[0]?.message?.content || 'Could not generate a summary.';
        res.json({ summary });

    } catch (error) {
        console.error('Summary API error:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
};