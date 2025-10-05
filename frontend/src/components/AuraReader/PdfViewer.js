import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

import FloatingToolbar from './FloatingToolbar';

// --- FIXED: This component now accepts a pdfUrl string instead of a local file object ---
const PdfViewer = ({ pdfUrl, highlights, onAddHighlight, onAskBuddy, onSaveNote }) => {
    const [selection, setSelection] = useState(null);
    const [toolbarPosition, setToolbarPosition] = useState(null);
    const viewerRef = useRef(null);

    // --- Highlighting functionality is preserved ---
    const renderHighlight = (props) => (
        <div
            key={props.key}
            style={{
                ...props.style,
                background: props.highlight.color || 'yellow',
                opacity: 0.4,
            }}
        />
    );

    const highlightPluginInstance = highlightPlugin({ renderHighlight });
    const { store } = highlightPluginInstance;

    useEffect(() => {
        // Keeps the visual highlights in sync with the main state
        if (store) {
            store.setHighlights(highlights);
        }
    }, [highlights, store]);

    const handleAddHighlight = (color) => {
        if (store) {
            const selectionRegion = store.getSelectionRegion();
            if (selectionRegion) {
                const newHighlight = {
                    ...selectionRegion,
                    color,
                    id: Date.now(),
                };
                onAddHighlight(newHighlight);
                store.addHighlight(newHighlight);
            }
        }
    };

    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    // --- REMOVED: The useEffect that incorrectly used URL.createObjectURL on a string ---
    // The Viewer component can now handle the Cloudinary URL directly from the pdfUrl prop.

    const handleMouseUp = useCallback(() => {
        const currentSelection = window.getSelection();
        const selectedText = currentSelection.toString().trim();

        if (selectedText.length > 0 && viewerRef.current) {
            const range = currentSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const viewerRect = viewerRef.current.getBoundingClientRect();

            setSelection({ text: selectedText });
            setToolbarPosition({
                top: rect.top - viewerRect.top - 60,
                left: rect.left - viewerRect.left + (rect.width / 2) - 150,
            });
        } else {
            setToolbarPosition(null);
            setSelection(null);
        }
    }, []);

    return (
        <div ref={viewerRef} className="relative w-full h-full" onMouseUp={handleMouseUp}>
            <FloatingToolbar 
                position={toolbarPosition}
                selection={selection}
                onAskBuddy={onAskBuddy}
                onSaveNote={onSaveNote}
                onAddHighlight={handleAddHighlight}
            />
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js`}>
                <div className="h-full">
                    {pdfUrl ? (
                        <Viewer
                            fileUrl={pdfUrl} // Directly use the URL from props
                            plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">Loading document...</div>
                    )}
                </div>
            </Worker>
        </div>
    );
};

PdfViewer.propTypes = {
    pdfUrl: PropTypes.string, // Changed from pdfFile to pdfUrl
    highlights: PropTypes.array.isRequired,
    onAddHighlight: PropTypes.func.isRequired,
    onAskBuddy: PropTypes.func.isRequired,
    onSaveNote: PropTypes.func.isRequired,
};

export default PdfViewer;

