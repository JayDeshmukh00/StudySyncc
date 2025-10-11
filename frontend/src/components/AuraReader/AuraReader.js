import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
// --- FIX: Corrected import paths based on a more standard project structure ---
import { useBuddy } from '../../context/BuddyContext';
import PdfViewer from './PdfViewer';
import NotesPanel from './NotesPanel';
import TranslatedTextViewer from './TranslatedTextViewer';
import { Icon } from '../Icon';
import QuizMaster from './QuizMaster';

const LanguageSelector = ({ onSelect, selected, disabled }) => {
    const languages = [
        { code: 'Original', name: 'Original PDF' },
        { code: 'English', name: 'English' },
        { code: 'Hindi', name: 'हिन्दी' },
        { code: 'Marathi', name: 'मराठी' },
        { code: 'Gujarati', name: 'ગુજરાતી' },
    ];
    return (
        <div className="relative">
            {/* --- FIX: Added id and name attributes to satisfy accessibility warnings --- */}
            <select
                id="language-selector"
                name="language-selector"
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
                disabled={disabled}
                className="appearance-none w-full md:w-auto bg-blue-900/50 border border-blue-700/60 rounded-md pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
                {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Icon path="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" className="w-5 h-5 text-gray-400" />
            </div>
        </div>
    );
};
LanguageSelector.propTypes = {
    onSelect: PropTypes.func.isRequired,
    selected: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
};


const AuraReader = ({ onBack }) => {
    const [document, setDocument] = useState(null);
    const [pdfObjectUrl, setPdfObjectUrl] = useState('');
    const [notes, setNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { onHighlight: askBuddy } = useBuddy();
    
    const [viewMode, setViewMode] = useState('pdf');
    const [currentLanguage, setCurrentLanguage] = useState('Original');
    const [currentPage, setCurrentPage] = useState(1);
    const [translatedContent, setTranslatedContent] = useState('');
    const [translationCache, setTranslationCache] = useState({});
    const [detectedSourceLang, setDetectedSourceLang] = useState('');

    const [isQuizActive, setIsQuizActive] = useState(false);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            console.error('Please select a valid PDF file.');
            return;
        }
        setIsLoading(true);
        setDocument(null); 
        setPdfObjectUrl('');
        setNotes([]);
        setCurrentLanguage('Original');
        setViewMode('pdf');

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/upload`, {
                method: 'POST',
                headers: { 'x-auth-token': localStorage.getItem('token') },
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to process PDF.');
            const docData = await response.json();
            setDocument(docData);
        } catch (error) {
            console.error("Error uploading document:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const fetchAndSetTranslatedPage = useCallback(async (docId, pageNum, language) => {
        const cacheKey = `${language}-${pageNum}`;
        if (translationCache[cacheKey]) {
            setTranslatedContent(translationCache[cacheKey].text);
            setDetectedSourceLang(translationCache[cacheKey].sourceLanguage);
            return;
        }
        
        setIsLoading(true);
        setTranslatedContent('');
        setDetectedSourceLang('');
        try {
             const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/documents/${docId}/pages/${pageNum}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token'),
                },
                body: JSON.stringify({ targetLanguage: language }),
            });
            if (!response.ok) throw new Error('Translation failed');
            const data = await response.json();
            setTranslatedContent(data.text);
            setDetectedSourceLang(data.sourceLanguage);
            setTranslationCache(prev => ({ ...prev, [cacheKey]: { text: data.text, sourceLanguage: data.sourceLanguage } }));
        } catch (error) {
            console.error(error);
            setTranslatedContent("Sorry, we couldn't translate this page. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [translationCache]);

    useEffect(() => {
        let objectUrl = '';
        const fetchDependencies = async () => {
            if (!document || !document._id) return;

            try {
                const notesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes/document/${document._id}`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                if (notesResponse.ok) setNotes(await notesResponse.json());
            } catch (error) {
                console.error("Failed to fetch notes:", error);
            }

            try {
                const pdfResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/documents/${document._id}/stream`, {
                    headers: { 'x-auth-token': localStorage.getItem('token') }
                });
                if (!pdfResponse.ok) throw new Error('Failed to fetch PDF stream.');
                
                const blob = await pdfResponse.blob();
                objectUrl = URL.createObjectURL(blob);
                setPdfObjectUrl(objectUrl);
            } catch (error) {
                console.error("Failed to load PDF:", error);
            }
        };

        fetchDependencies();
        
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    // --- FIX: Removed pdfObjectUrl from the dependency array to prevent an infinite loop ---
    }, [document]);

    const handleLanguageSelect = useCallback(async (language) => {
        if (!document || !document._id) return;
        setCurrentLanguage(language);
        if (language === 'Original') {
            setViewMode('pdf');
            setTranslatedContent('');
            setDetectedSourceLang('');
        } else {
            setViewMode('translated');
            await fetchAndSetTranslatedPage(document._id, currentPage, language);
        }
    }, [document, currentPage, fetchAndSetTranslatedPage]);

    const handlePageChange = async (newPage) => {
        if (document && newPage > 0 && newPage <= document.totalPages) {
            setCurrentPage(newPage);
            if (viewMode === 'translated') {
                await fetchAndSetTranslatedPage(document._id, newPage, currentLanguage);
            }
        }
    };
    
    const saveNote = useCallback(async (selection) => {
        if (!document || !document._id) return;
        const noteLanguage = currentLanguage === 'Original' ? 'English' : currentLanguage;
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    originalText: selection.text,
                    documentId: document._id,
                    language: noteLanguage
                }),
            });
            if (response.ok) {
                const { note: newNote } = await response.json();
                setNotes(prev => [newNote, ...prev]);
            } else {
                throw new Error('Failed to save note.');
            }
        } catch (error) {
            console.error("Error saving note:", error);
        }
    }, [document, currentLanguage]);

    const handleDeleteNote = async (noteId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/aura/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            if (response.ok) {
                setNotes(prev => prev.filter(note => note._id !== noteId));
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const originalPageContent = document?.originalContent.find(p => p.page === currentPage)?.text || '';

    if (!document) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-fade-in">
                 <div className="w-full max-w-lg p-8 bg-black/50 border border-blue-800/30 rounded-2xl text-center">
                    <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" className="w-16 h-16 mx-auto text-blue-400 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Welcome to Aura Reader</h2>
                    <p className="text-gray-400 mb-6">Upload a PDF to begin your interactive study session.</p>
                    <label htmlFor="pdf-upload" className={`bg-blue-600 ${isLoading ? 'opacity-50' : 'hover:bg-blue-500'} text-white font-bold py-3 px-6 rounded-lg transition duration-300 cursor-pointer`}>
                        {isLoading ? 'Processing...' : 'Select PDF'}
                    </label>
                    <input id="pdf-upload" type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" disabled={isLoading} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex h-[calc(100vh-100px)] animate-fade-in">
            <div className={`flex-1 flex flex-col ${isQuizActive ? 'w-full' : ''}`}>
                <div className="p-4 bg-black/30 border-b border-blue-900/50 flex justify-between items-center space-x-4">
                    <button onClick={onBack} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
                         <Icon path="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" className="w-5 h-5 mr-2" /> Back
                    </button>
                    <div className="flex items-center space-x-4">
                        {!isQuizActive && (
                            <button 
                                onClick={() => setIsQuizActive(true)} 
                                disabled={!document || !document._id}
                                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon path="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" className="w-5 h-5 mr-2" />
                                Quiz Me
                            </button>
                        )}
                        <LanguageSelector onSelect={handleLanguageSelect} selected={currentLanguage} disabled={isLoading || isQuizActive} />
                    </div>
                </div>

                <div className="flex-1 relative">
                    {isQuizActive ? (
                        <QuizMaster 
                            documentId={document._id} 
                            onFinishQuiz={() => setIsQuizActive(false)} 
                        />
                    ) : (
                        <>
                            {isLoading && viewMode === 'translated' && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                                    <div className="flex items-center gap-3 text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>Translating...</div>
                                </div>
                            )}
                            {viewMode === 'pdf' ? (
                                <PdfViewer
                                    pdfUrl={pdfObjectUrl}
                                    onSaveNote={saveNote}
                                    onAskBuddy={askBuddy}
                                    highlights={[]} 
                                    onAddHighlight={() => {}}
                                />
                            ) : (
                                <TranslatedTextViewer
                                    translatedContent={translatedContent}
                                    originalContent={originalPageContent}
                                    sourceLanguage={detectedSourceLang}
                                    targetLanguage={currentLanguage}
                                    currentPage={currentPage}
                                    totalPages={document.totalPages}
                                    onPageChange={handlePageChange}
                                    onSaveNote={saveNote}
                                    onAskBuddy={askBuddy}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
            {!isQuizActive && <NotesPanel notes={notes} onDeleteNote={handleDeleteNote} />}
        </div>
    );
};
AuraReader.propTypes = {
    onBack: PropTypes.func.isRequired,
};

export default AuraReader;

