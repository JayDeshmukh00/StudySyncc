import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../Icon';
import FloatingToolbar from './FloatingToolbar';

const ToggleSwitch = ({ isToggled, onToggle, labelOn, labelOff }) => (
    <div className="flex items-center">
        <span className={`mr-3 text-sm font-medium ${!isToggled ? 'text-white' : 'text-gray-400'}`}>{labelOff}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={isToggled} onChange={onToggle} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
        <span className={`ml-3 text-sm font-medium ${isToggled ? 'text-white' : 'text-gray-400'}`}>{labelOn}</span>
    </div>
);

const TranslatedTextViewer = ({
    translatedContent,
    originalContent,
    sourceLanguage,
    targetLanguage,
    currentPage,
    totalPages,
    onPageChange,
    onSaveNote,
    onAskBuddy,
}) => {
    const [selection, setSelection] = useState(null);
    const [toolbarPosition, setToolbarPosition] = useState(null);
    const contentRef = useRef(null);
    const [showOriginal, setShowOriginal] = useState(false);

    const handleMouseUp = useCallback(() => {
        const currentSelection = window.getSelection();
        const selectedText = currentSelection.toString().trim();

        if (selectedText.length > 0 && contentRef.current) {
            const range = currentSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = contentRef.current.getBoundingClientRect();

            setSelection({ text: selectedText });
            setToolbarPosition({
                top: rect.top - containerRect.top + contentRef.current.scrollTop - 60,
                left: rect.left - containerRect.left + (rect.width / 2) - 150,
            });
        } else {
            setToolbarPosition(null);
            setSelection(null);
        }
    }, []);

    const contentToDisplay = showOriginal ? originalContent : translatedContent;

    return (
        <div className="flex flex-col h-full bg-gray-900/50 text-gray-200">
            <FloatingToolbar
                position={toolbarPosition}
                selection={selection}
                onAskBuddy={onAskBuddy}
                onSaveNote={onSaveNote}
                onAddHighlight={() => {}} // Not used in text view
            />
            <div
                ref={contentRef}
                onMouseUp={handleMouseUp}
                className="flex-1 overflow-y-auto p-8 lg:p-12 text-lg leading-relaxed selection:bg-blue-400/50"
            >
                {contentToDisplay ? (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{contentToDisplay}</p>
                ) : (
                    <p className="text-gray-500">No content to display for this page.</p>
                )}
            </div>

            <div className="flex items-center justify-between p-4 bg-black/50 border-t border-blue-900/50">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-600 flex items-center"
                >
                    <Icon path="M15.75 19.5 8.25 12l7.5-7.5" className="w-5 h-5 mr-2" />
                    Previous
                </button>

                <div className="flex flex-col items-center">
                    <ToggleSwitch 
                        isToggled={!showOriginal}
                        onToggle={() => setShowOriginal(!showOriginal)}
                        labelOff={sourceLanguage || 'Original'}
                        labelOn={targetLanguage}
                    />
                     <span className="text-sm text-gray-400 mt-1">
                        Page {currentPage} of {totalPages}
                    </span>
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-600 flex items-center"
                >
                    Next
                    <Icon path="M8.25 4.5l7.5 7.5-7.5 7.5" className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

TranslatedTextViewer.propTypes = {
    translatedContent: PropTypes.string.isRequired,
    originalContent: PropTypes.string.isRequired,
    sourceLanguage: PropTypes.string.isRequired,
    targetLanguage: PropTypes.string.isRequired,
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onSaveNote: PropTypes.func.isRequired,
    onAskBuddy: PropTypes.func.isRequired,
};

ToggleSwitch.propTypes = {
    isToggled: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
    labelOn: PropTypes.string.isRequired,
    labelOff: PropTypes.string.isRequired,
};

export default TranslatedTextViewer;

