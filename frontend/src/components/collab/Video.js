import React, { useEffect, useRef } from 'react';
import { Icon } from '../Icon'; // Make sure to import the Icon component

export const Video = ({ stream, name }) => {
    const ref = useRef();

    useEffect(() => {
        if (stream && ref.current) {
            ref.current.srcObject = stream;
            ref.current.play().catch(error => console.error("Video play failed:", error));
        }
    }, [stream]);

    // Function to handle the fullscreen toggle
    const handleFullScreen = () => {
        if (ref.current && !document.fullscreenElement) {
            ref.current.requestFullscreen().catch(err => console.error("Fullscreen failed:", err));
        } else if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };

    return (
        // Add `relative` and `group` for the hover effect
        <div className="relative w-full h-full group">
            <video
                ref={ref}
                autoPlay
                playsInline
                className="w-full h-full rounded-lg object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                {name || '...'}
            </div>
            {/* This button will appear on hover */}
            <button 
                onClick={handleFullScreen}
                className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Toggle Fullscreen"
            >
                <Icon path="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" className="w-4 h-4"/>
            </button>
        </div>
    );
};