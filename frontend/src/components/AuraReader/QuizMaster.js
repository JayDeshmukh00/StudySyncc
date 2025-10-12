import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

// --- ACTION REQUIRED: PLEASE VERIFY THE FOLLOWING ---

// 1. LOTTIE INSTALLATION:
//    Ensure you have installed lottie-react by running this command in your frontend terminal:
//    npm install lottie-react
import Lottie from 'lottie-react'; 

// 2. ICON PATH:
//    This path assumes your Icon.js file is located at 'src/components/Icon.js'.
//    If your file is elsewhere, please adjust the path. For example, if it's in the same folder, use './Icon'.
import { Icon } from '../Icon'; 

// 3. ANIMATION PATH:
//    This path assumes your animation file is at 'src/components/AuraReader/animations/bot.json'.
//    Please ensure this path is correct for your project structure.
import berryBotAnimation from './animations/bot.json'; 


// --- Browser API Setup for Voice ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

const QuizMaster = ({ documentId, onFinishQuiz }) => {
    // --- State Management ---
    const [quizState, setQuizState] = useState('idle');
    const [quizData, setQuizData] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userTranscript, setUserTranscript] = useState('');
    const [quizResults, setQuizResults] = useState([]);
    const [finalAnalysis, setFinalAnalysis] = useState('');
    const [currentFeedback, setCurrentFeedback] = useState('');
    const [currentCorrectAnswer, setCurrentCorrectAnswer] = useState('');
    const lottieRef = useRef(null);

    const [localDocument, setLocalDocument] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [forceUploadView, setForceUploadView] = useState(false);

    // --- Voice Synthesis (Text-to-Speech) ---
    const speak = useCallback((text, onEndCallback) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.1;
        utterance.onend = onEndCallback;
        window.speechSynthesis.speak(utterance);
    }, []);

    // --- Voice Recognition (Speech-to-Text) ---
    const startListening = useCallback(() => {
        if (!recognition) return;
        setUserTranscript('');
        setQuizState('listening');
        recognition.start();

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            setUserTranscript(prev => prev + finalTranscript);
        };
    }, []);

    // --- Animation Control ---
    useEffect(() => {
        if (!lottieRef.current) return;
        switch (quizState) {
            case 'asking':
            case 'evaluating':
            case 'result':
                lottieRef.current.play();
                break;
            default:
                lottieRef.current.pause();
                break;
        }
    }, [quizState]);
    
    // --- Logic to handle direct file upload ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Please select a valid PDF file.');
            return;
        }
        setIsUploading(true);
        setLocalDocument(null);
        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/upload`, {
                method: 'POST',
                headers: { 'x-auth-token': localStorage.getItem('token') },
                body: formData,
            });

            // --- THE FIX: Add robust error handling for the upload response ---
            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    errorMessage = errorData.msg || 'Failed to process PDF.';
                } else {
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage);
            }

            const docData = await response.json();
            setLocalDocument(docData);
            setForceUploadView(false); 
        } catch (error) {
            console.error("Error uploading document:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };


    // --- Core Quiz Logic ---
    const handleStartQuiz = async () => {
        const idToUse = localDocument?._id || documentId;

        if (!idToUse) {
            alert("Could not start quiz: No document has been selected. Please upload a PDF.");
            console.error("Attempted to start quiz with no documentId.");
            return;
        }

        setQuizState('generating');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/quiz/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                body: JSON.stringify({ documentId: idToUse, numQuestions: 10 }),
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage;
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errorData = await response.json();
                    errorMessage = errorData.msg || `Server error: ${response.status}`;
                } else {
                    errorMessage = await response.text();
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                 throw new Error("The AI returned an invalid or empty quiz format.");
            }

            setQuizData(data);
            setCurrentQuestionIndex(0);
            setQuizResults([]);
            setQuizState('asking');
        } catch (error) {
            console.error(error);
            alert(`Could not start quiz: ${error.message}`);
            setQuizState('idle');
        }
    };

    // Main Game Loop
    useEffect(() => {
        if (quizState === 'asking' && quizData.length > 0) {
            const questionText = quizData[currentQuestionIndex].question;
            speak(`Question ${currentQuestionIndex + 1}. ${questionText}`, () => {
                startListening();
            });
        }
    }, [quizState, quizData, currentQuestionIndex, speak, startListening]);

    const handleEvaluateAnswer = async () => {
        if (recognition) recognition.stop();
        setQuizState('evaluating');
        
        const currentQuestion = quizData[currentQuestionIndex];
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/quiz/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                body: JSON.stringify({
                    question: currentQuestion.question,
                    correctAnswer: currentQuestion.answer,
                    userAnswer: userTranscript,
                }),
            });
            const evaluation = await response.json();

            const result = { ...currentQuestion, userAnswer: userTranscript, isCorrect: evaluation.isCorrect };
            const updatedResults = [...quizResults, result];
            setQuizResults(updatedResults);

            setCurrentFeedback(evaluation.feedback);
            setCurrentCorrectAnswer(currentQuestion.answer);
            setQuizState('result');
            speak(`${evaluation.feedback} The correct answer is: ${currentQuestion.answer}`);
        } catch (error) {
            console.error('Evaluation failed:', error);
            alert('Sorry, there was an error evaluating your answer. Moving to the next question.');
             if (currentQuestionIndex < quizData.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setQuizState('asking');
                } else {
                    handleFinishQuiz(quizResults);
                }
        }
    };

    const handleNextQuestion = () => {
        setCurrentFeedback('');
        setCurrentCorrectAnswer('');
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuizState('asking');
        } else {
            handleFinishQuiz(quizResults);
        }
    };

    const handleFinishQuiz = async (finalResults) => {
        setQuizState('finished');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/quiz/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
                body: JSON.stringify({ quizResults: finalResults }),
            });
            const data = await response.json();
            setFinalAnalysis(data.analysis);
            speak(`Quiz complete! Here is your performance summary. ${data.analysis}`);
        } catch (error) {
            console.error('Analysis failed:', error);
            speak('Quiz complete! I was unable to generate a final analysis at this time.');
        }
    };

    // --- UI Rendering ---
    if (!recognition) {
        return <div className="p-8 text-center text-yellow-400 bg-yellow-900/50 rounded-lg">Your browser does not support the Web Speech API required for this feature. Please use Google Chrome or Microsoft Edge.</div>;
    }

    if (quizState === 'idle') {
        const showUploadView = (!documentId && !localDocument) || forceUploadView;
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Lottie lottieRef={lottieRef} animationData={berryBotAnimation} loop={true} autoplay={true} style={{ width: 200, height: 200 }} />
                
                {showUploadView ? (
                    <>
                        <h2 className="text-2xl mt-4 mb-4">Let's start a new quiz!</h2>
                        <p className="text-gray-400 mb-6">Upload a PDF document to begin.</p>
                        <label htmlFor="quiz-pdf-upload" className={`bg-blue-600 ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500'} text-white font-bold py-3 px-6 rounded-lg transition duration-300 cursor-pointer`}>
                            {isUploading ? 'Processing...' : 'Select PDF'}
                        </label>
                        <input id="quiz-pdf-upload" type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl mt-4 mb-4">Ready to test your knowledge?</h2>
                        <p className="text-gray-400 mb-2">I'll ask some questions about your document.</p>
                        {localDocument && <p className="text-sm text-green-400 mb-4">File ready: {localDocument.fileName}</p>}
                        <button onClick={handleStartQuiz} className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 font-bold">
                            Let's Begin!
                        </button>
                        <button onClick={() => { setLocalDocument(null); setForceUploadView(true); }} className="mt-4 text-sm text-gray-400 hover:text-white underline">
                            Use a different PDF
                        </button>
                    </>
                )}
                 <button onClick={onFinishQuiz} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times; Close</button>
            </div>
        );
    }
    
    if (quizState === 'generating') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Lottie animationData={berryBotAnimation} loop={true} style={{ width: 200, height: 200 }} />
                <p className="mt-4 text-lg">JD is preparing your quiz...</p>
            </div>
        );
    }
    
    if (quizState === 'finished') {
        return (
            <div className="p-8 text-center">
                <Lottie animationData={berryBotAnimation} loop={true} style={{ width: 150, height: 150, margin: '0 auto' }} />
                <h2 className="text-3xl font-bold mt-4 mb-4">Quiz Complete!</h2>
                <div className="bg-black/30 p-4 rounded-lg mb-6 text-left max-w-2xl mx-auto">
                    <h3 className="font-bold text-lg text-blue-300">Performance Analysis</h3>
                    <p className="mt-2 text-gray-300 whitespace-pre-wrap">{finalAnalysis}</p>
                </div>
                <button onClick={onFinishQuiz} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Back to Reader</button>
            </div>
        );
    }

    if (quizState === 'result') {
        return (
            <div className="flex flex-col h-full p-8 items-center text-center">
                <Lottie lottieRef={lottieRef} animationData={berryBotAnimation} loop={true} autoplay={false} style={{ width: 150, height: 150 }} />
                <div className="text-sm text-gray-400 mt-4">Question {currentQuestionIndex + 1} of {quizData.length}</div>
                <h2 className="text-2xl lg:text-3xl font-semibold my-6">{quizData[currentQuestionIndex]?.question}</h2>
                <div className="w-full max-w-2xl bg-black/30 rounded-lg p-4 text-left mb-4">
                    <h3 className="font-bold text-lg text-blue-300 mb-2">Your Answer:</h3>
                    <p className="text-gray-300">{userTranscript}</p>
                </div>
                <div className="w-full max-w-2xl bg-black/30 rounded-lg p-4 text-left mb-4">
                    <h3 className="font-bold text-lg text-green-300 mb-2">Feedback:</h3>
                    <p className="text-gray-300">{currentFeedback}</p>
                </div>
                <div className="w-full max-w-2xl bg-black/30 rounded-lg p-4 text-left mb-6">
                    <h3 className="font-bold text-lg text-yellow-300 mb-2">Correct Answer:</h3>
                    <p className="text-gray-300">{currentCorrectAnswer}</p>
                </div>
                <button onClick={handleNextQuestion} className="px-8 py-4 bg-blue-600 rounded-full hover:bg-blue-500 font-bold">
                    Next Question
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-8 items-center text-center">
            <Lottie lottieRef={lottieRef} animationData={berryBotAnimation} loop={true} autoplay={false} style={{ width: 150, height: 150 }} />
            <div className="text-sm text-gray-400 mt-4">Question {currentQuestionIndex + 1} of {quizData.length}</div>
            <h2 className="text-2xl lg:text-3xl font-semibold my-6">{quizData[currentQuestionIndex]?.question}</h2>
            <div className="w-full max-w-2xl min-h-[8rem] bg-black/30 rounded-lg p-4 text-left overflow-y-auto">
                <p className="text-gray-300">{userTranscript || "Your answer will appear here..."}</p>
            </div>
            {quizState === 'listening' && (
                 <button onClick={handleEvaluateAnswer} className="mt-8 px-8 py-4 bg-green-600 rounded-full hover:bg-green-500 font-bold flex items-center gap-3 animate-pulse">
                    <Icon path="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-十二 0v1.5" className="w-6 h-6" />
                    I'm Done Answering
                </button>
            )}
            {quizState === 'evaluating' && <p className="mt-8 text-lg text-blue-300">Let me think...</p>}
        </div>
    );
};

QuizMaster.propTypes = {
    documentId: PropTypes.string,
    onFinishQuiz: PropTypes.func.isRequired,
};

export default QuizMaster;

