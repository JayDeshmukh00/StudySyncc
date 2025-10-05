const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// --- Defines the structure for an uploaded PDF document ---
const AuraDocumentSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fileName: { 
        type: String, 
        required: true 
    },
    cloudinaryUrl: { 
        type: String, 
        required: true 
    },
    // --- FIXED: This field is essential for securely accessing the file ---
    cloudinaryPublicId: { 
        type: String, 
        required: true 
    },
    totalPages: { 
        type: Number, 
        required: true 
    },
    originalContent: [{
        page: Number,
        text: String,
    }],
    // This field is not currently used but is good for future caching
    translations: {
        type: Map,
        of: String,
    },
}, { timestamps: true });


// --- Defines the structure for a user's note, linked to a document ---
const auraNoteSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    document: { 
        type: Schema.Types.ObjectId, 
        ref: 'AuraDocument', 
        required: true 
    },
    originalText: {
        type: String,
        required: true,
        trim: true,
    },
    explanation: {
        type: String,
        required: true,
        trim: true,
    },
    language: {
        type: String,
        required: true,
        default: 'English',
    },
}, { timestamps: true });

const AuraDocument = model('AuraDocument', AuraDocumentSchema);
const AuraNote = model('AuraNote', auraNoteSchema);

// --- Export both models ---
module.exports = { AuraNote, AuraDocument };
