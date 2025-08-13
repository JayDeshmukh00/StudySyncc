import React, { useEffect, useRef } from 'react';

export const Video = ({ peer, name }) => {
    const ref = useRef();

    useEffect(() => {
        if (peer) {
            const handleStream = (stream) => {
                if (ref.current) {
                    ref.current.srcObject = stream;
                    ref.current.play().catch(error => console.error("Video play failed:", error));
                }
            };
            
            peer.on('stream', handleStream);

            return () => {
                peer.off('stream', handleStream);
            };
        }
    }, [peer]);

    // CHANGE: Removed the outer div wrapper. The parent component now controls the container styling.
    return (
        <>
            <video
                ref={ref}
                autoPlay
                playsInline
                className="w-full h-full rounded-lg object-cover"
            />
            <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
                {name || '...'}
            </div>
        </>
    );
};