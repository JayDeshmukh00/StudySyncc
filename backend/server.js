// --- 1. IMPORTS ---
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
require('dotenv').config();

// --- 2. SETUP ---
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

const PORT = process.env.PORT || 3001;

// --- 3. DATABASE & SERVICES ---
require('./src/config/db'); // Initialize and connect to the database
require('./src/services/socket.service')(io); // Initialize Socket.IO logic

// --- 4. MIDDLEWARE ---
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 5. API ROUTES ---
const authRoutes = require('./src/routes/auth.routes');
const planRoutes = require('./src/routes/plan.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const assessmentRoutes = require('./src/routes/assessment.routes');
const chatRoutes = require('./src/routes/chat.routes');
const flashcardRoutes = require('./src/routes/flashcard.routes');
const buddyRoutes = require('./src/routes/buddy.js');
const auraRoutes = require('./src/routes/aura.routes.js');

app.use('/api/auth', authRoutes);
app.use('/api', planRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', assessmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', flashcardRoutes);
app.use('/api/buddy', buddyRoutes);
app.use('/api/aura', auraRoutes);

// --- 6. HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
    res.status(200).send('Backend is running 🚀');
});


// --- 8. START SERVER ---
// MODIFIED FOR RENDER: Added '0.0.0.0' as the host
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});