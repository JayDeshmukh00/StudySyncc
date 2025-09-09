import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from './Icon';

export const Header = ({ onToggleTheme, currentTheme, onHomeClick, onLogout, user }) => {
    // ... Header is unchanged
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.split(' ');
        const initials = names.map(n => n[0]).join('').toUpperCase();
        return initials.length > 2 ? initials.substring(0, 2) : initials;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <header className="bg-white/30 dark:bg-black/50 backdrop-blur-lg shadow-lg dark:shadow-blue-900/20 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={onHomeClick}>
                    <Icon path="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" className="w-8 h-8 text-blue-500" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">StudySync</h1>
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold text-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-blue-500">
                                {getInitials(user.name)}
                            </button>
                            {isDropdownOpen && (
                                <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in">
                                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={user.name}>{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email || 'no-email@provided.com'}</p>
                                    </div>
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                                            <span>Toggle Theme</span>
                                            <button onClick={onToggleTheme} className="p-2 rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-gray-300/70 dark:hover:bg-gray-600/70 transition-colors">
                                                {currentTheme === 'dark' 
                                                    ? <Icon path="M12 1v2m0 18v2m8.9-10.9l-1.42 1.42M4.52 4.52l-1.42 1.42M23 12h-2M3 12H1m18.5-7.5l-1.42-1.42M4.52 19.48l-1.42-1.42M12 6a6 6 0 100 12 6 6 0 000-12z" className="w-5 h-5"/> 
                                                    : <Icon path="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" className="w-5 h-5"/>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={() => { onLogout(); setIsDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export const Footer = () => (
    <footer className="bg-transparent mt-8">
      <div className="container mx-auto px-4 py-4 text-center text-gray-500">
        <p>© 2025 Study Sync. All Rights Reserved.</p>
      </div>
    </footer>
);

export const Chatbot = ({ currentView, onQuickAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');
    
    const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('chatHistory')) || []);

    const getWelcomeMessage = useCallback(() => {
        return { role: 'assistant', content: 'Welcome to StudySync! How can I help you?' };
    }, []);

    const [messages, setMessages] = useState([getWelcomeMessage()]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [suggestion, setSuggestion] = useState(null);
    const conversationIdRef = useRef(null);

    const handleNewChat = useCallback((switchToChatTab = true) => {
        setMessages([getWelcomeMessage()]);
        conversationIdRef.current = Date.now();
        if (switchToChatTab) {
            setActiveTab('chat');
        }
    }, [getWelcomeMessage]);
    
    useEffect(() => {
        if (input.toLowerCase().includes('flashcard')) {
            setSuggestion({ text: 'Generate flashcards for this topic?', action: 'CREATE_FLASHCARDS' });
        } else if (input.toLowerCase().includes('quiz')) {
            setSuggestion({ text: 'Create a quiz for this topic?', action: 'GENERATE_QUIZ' });
        } else {
            setSuggestion(null);
        }
    }, [input]);

    useEffect(() => {
        if(isOpen) {
            handleNewChat(false);
            setHistory(JSON.parse(localStorage.getItem('chatHistory')) || []);
        }
    }, [isOpen, handleNewChat]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

   // The corrected useEffect for your Chatbot component
useEffect(() => {
    if (!isOpen || messages.length <= 1 || activeTab !== 'chat') return;

    // --- FIX: This check prevents the infinite loop on error ---
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.startsWith('Sorry, I ran into an error.')) {
        return; // Don't save history if the chat ended in an error
    }
    // --- End of FIX ---

    const currentId = conversationIdRef.current;
    if (!currentId) return;

    const firstUserMessage = messages.find(m => m.role === 'user');
    const currentTitle = firstUserMessage ? firstUserMessage.content.substring(0, 40) + '...' : 'New Chat';

    const existingChatIndex = history.findIndex(chat => chat.id === currentId);

    let newHistory = [...history];
    const newChatEntry = { id: currentId, title: currentTitle, messages: messages };

    if (existingChatIndex !== -1) {
        newHistory[existingChatIndex] = newChatEntry;
    } else {
        newHistory.unshift(newChatEntry); // Use unshift to add to the beginning for easier sorting later
    }

    setHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
}, [messages, history, isOpen, activeTab]);

    const handleListen = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Sorry, your browser doesn't support speech recognition.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        setIsListening(true);
        recognition.start();

        recognition.onresult = (event) => {
            setInput(Array.from(event.results).map(result => result[0].transcript).join(''));
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
    }, []);
    
    const handleSend = useCallback(async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
                body: JSON.stringify({ history: newMessages, currentView }),
            });

            if (!response.ok || !response.body) {
                throw new Error("Failed to connect to the chat API.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantResponse = { role: 'assistant', content: '' };
            setMessages(prev => [...prev, assistantResponse]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));
                        if(data.content) {
                           assistantResponse.content += data.content;
                           setMessages(prev => [...prev.slice(0, -1), { ...assistantResponse }]);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Chat fetch error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, currentView]);
    
    const handleDeleteHistory = useCallback((e, idToDelete) => {
        e.stopPropagation();
        const updatedHistory = history.filter(chat => chat.id !== idToDelete);
        setHistory(updatedHistory);
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
        if (conversationIdRef.current === idToDelete) {
            handleNewChat(false);
        }
    }, [history, handleNewChat]);

    const handleLoadHistory = useCallback((chatToLoad) => {
        setMessages(chatToLoad.messages);
        conversationIdRef.current = chatToLoad.id;
        setActiveTab('chat');
    }, []);
    
    const renderMessageContent = (content) => {
        if (!content) return null;
        const actionRegex = /\[ACTION:(\w+)\]/;
        const match = content.match(actionRegex);
        const createMarkup = (text) => {
            const sanitizedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const boldedText = sanitizedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return { __html: boldedText };
        };

        if (match) {
            const text = content.replace(actionRegex, '').trim();
            const action = match[1];
            return (
                <div>
                    <p dangerouslySetInnerHTML={createMarkup(text)} />
                    <button 
                        onClick={() => onQuickAction(action)}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                    >
                        {action.replace(/_/g, ' ')}
                    </button>
                </div>
            );
        }
        return <div dangerouslySetInnerHTML={createMarkup(content)} />;
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="fixed bottom-5 right-5 z-50 w-16 h-16 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" aria-label="Open Chatbot">
                <Icon path="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25S3 16.556 3 12s4.03-8.25 9-8.25 9 3.694 9 8.25Z" className="w-8 h-8"/>
            </button>
        );
    }
    
    return (
        <div className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-md flex flex-col animate-slide-in-right bg-gray-400/10 dark:bg-black/50 backdrop-blur-xl shadow-2xl border-l border-white/20">
            <div className="flex justify-between items-center p-4 border-b border-white/20 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">StudySync Assistant</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 transition-colors" aria-label="Close Chatbot">
                        <Icon path="M6 18 18 6M6 6l12 12" className="w-6 h-6" type="outline"/>
                    </button>
                </div>
            </div>

            <div className="flex border-b border-white/20 flex-shrink-0">
                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'chat' ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10'}`}>Chat</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'history' ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10'}`}>History</button>
            </div>

            <div className="flex-grow flex flex-col overflow-y-auto min-h-0">
                <div className={`flex-grow flex-col p-4 space-y-4 ${activeTab === 'chat' ? 'flex' : 'hidden'}`}>
                    <div className="flex-grow space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{renderMessageContent(msg.content)}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    {isLoading && <div className="flex-shrink-0 flex justify-start text-gray-400 p-2">Assistant is typing...</div>}
                    {suggestion && !isLoading && (
                        <div className="flex-shrink-0 pt-2">
                           <button onClick={() => { onQuickAction(suggestion.action); setSuggestion(null); }} className="w-full text-left px-4 py-2 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/40">💡 {suggestion.text}</button>
                        </div>
                    )}
                </div>
                
                <div className={`overflow-y-auto ${activeTab === 'history' ? 'block' : 'hidden'}`}>
                     <div className="p-4 space-y-2">
                        <button onClick={() => handleNewChat(true)} className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500">
                            <Icon path="M12 4.5v15m7.5-7.5h-15" type="outline" className="w-5 h-5"/>
                            New Chat
                        </button>
                        {history.length > 0 ? (
                            history.slice().reverse().map(chat => (
                                <div key={chat.id} onClick={() => handleLoadHistory(chat)} className="bg-white/5 p-3 rounded-lg flex justify-between items-center gap-2 cursor-pointer hover:bg-white/10">
                                    <p className="text-sm truncate flex-grow">{chat.title}</p>
                                    <div className="flex-shrink-0">
                                        <button onClick={(e) => handleDeleteHistory(e, chat.id)} className="p-1.5 bg-red-600/80 rounded hover:bg-red-600"><Icon path="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" className="w-4 h-4 text-white" type="outline"/></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-sm text-gray-500 pt-4">No saved chats yet.</p>
                        )}
                    </div>
                </div>
            </div>
            
            {activeTab === 'chat' && (
                <form onSubmit={handleSend} className="p-4 border-t border-white/20 flex-shrink-0 flex items-center gap-2">
                    <div className="relative w-full">
                        <input
                            type="text" value={input} onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Ask me anything..."}
                            className="w-full pl-3 pr-10 py-2 rounded-lg bg-white/20 dark:bg-black/20 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="button" onClick={handleListen} className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}>
                            <Icon path="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5" className="w-5 h-5" type="outline"/>
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                        Send
                    </button>
                </form>
            )}
        </div>
    );
};