import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import { Video } from './Video';
import { Chat } from './Chat';
import { Whiteboard } from './Whiteboard';
import { PomodoroTimer } from './PomodoroTimer';
import { Icon } from '../Icon';

const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const peerConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.openrelay.org:3478' },
    {
      urls: 'turn:openrelay.turn.serv.net:3478',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
  ]
};

// ControlBar component remains unchanged
const ControlBar = ({ onToggleAudio, isAudioMuted, onToggleVideo, isVideoOn, onShareScreen, isScreenSharing, onStopScreenShare, onToggleLayout, onToggleSidebar, onLeaveRoom }) => {
    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 flex items-center justify-center gap-4 bg-gray-900/80 backdrop-blur-sm p-3 rounded-xl border border-gray-700">
            <button onClick={onToggleAudio} title={isAudioMuted ? "Unmute" : "Mute"} className={`p-3 rounded-full transition-colors ${isAudioMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <Icon path={isAudioMuted ? "M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M12 18.75h-6a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 6 5.25h6.75m-6.75 0H4.5" : "M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"} className="w-6 h-6" />
            </button>
            <button onClick={onToggleVideo} title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"} disabled={isScreenSharing} className={`p-3 rounded-full transition-colors ${!isVideoOn ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} disabled:bg-gray-800 disabled:cursor-not-allowed`}>
                <Icon path={isVideoOn ? "M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9A2.25 2.25 0 0 0 4.5 18.75Z" : "M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 4.5 5.25H12a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25Z"} className="w-6 h-6" />
            </button>
            {isScreenSharing ? (
                <button onClick={onStopScreenShare} title="Stop Sharing" className="p-3 rounded-full bg-red-700 text-white flex items-center gap-2 transition-colors hover:bg-red-600">
                    <Icon path="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="w-6 h-6" />
                </button>
            ) : (
                <button onClick={onShareScreen} title="Share Screen" className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center gap-2 transition-colors">
                     <Icon path="M10.5 19.5h3m-6.75 0h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" className="w-6 h-6" />
                </button>
            )}
             <div className="h-6 w-px bg-gray-600"></div>
            <button onClick={onToggleLayout} title="Change Layout" className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                <Icon path="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6A2.25 2.25 0 0 1 15.75 3.75H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" className="w-6 h-6" />
            </button>
             <button onClick={onToggleSidebar} title="Toggle Sidebar" className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                <Icon path="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h1.5M3.75 12h1.5M3.75 18h1.5" className="w-6 h-6" />
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <button onClick={onLeaveRoom} title="Leave Room" className="p-3 rounded-full bg-red-600 hover:bg-red-500 transition-colors">
                <Icon path="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3h12" className="w-6 h-6" />
            </button>
        </div>
    );
};

export const StudyRoom = ({ roomId, userName, onLeaveRoom }) => {
    const [peers, setPeers] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [myStream, setMyStream] = useState(null);
    const [mediaError, setMediaError] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenStream, setScreenStream] = useState(null);
    const [pomodoroState, setPomodoroState] = useState({ mode: 'work', timeLeft: 25 * 60, isRunning: false });
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [layout, setLayout] = useState('whiteboard');

    const socketRef = useRef();
    const myVideoRef = useRef();
    const peersRef = useRef({});
    const screenTrackRef = useRef();
    const mainStageRef = useRef();
    const remoteScreenRef = useRef();

    useEffect(() => {
        let streamAccess;
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                streamAccess = stream;
                setMyStream(stream);
                if (myVideoRef.current) {
                    myVideoRef.current.srcObject = stream;
                    myVideoRef.current.play().catch(e => console.error("Local video play failed:", e));
                }
            })
            .catch(err => {
                console.error("getUserMedia error:", err);
                setMediaError("Camera and microphone access is required. Please allow access and refresh the page.");
            });
        
        return () => {
            streamAccess?.getTracks().forEach(track => track.stop());
        }
    }, []);
    
    useEffect(() => {
        if (!myStream) {
            return;
        }

        if (!socketRef.current) {
            socketRef.current = io(SOCKET_SERVER_URL, {
                transports: ['websocket'],
                withCredentials: true,
                autoConnect: false
            });
        }
        
        const socket = socketRef.current;

        function createPeer(userToSignal, callerID, name) {
            const peer = new Peer({ initiator: true, trickle: false, config: peerConfig });
            peer.addStream(myStream);
            peer.on('signal', signal => {
                socket.emit('sending-signal', { userToSignal, callerID, signal, name });
            });
            peer.on('stream', stream => {
                setPeers(prevPeers => 
                    prevPeers.map(p => 
                        p.peerID === userToSignal ? { ...p, stream } : p
                    )
                );
            });
            return peer;
        }

        function addPeer(incomingSignal, callerID, name) {
            const peer = new Peer({ initiator: false, trickle: false, config: peerConfig });
            peer.addStream(myStream);
            peer.on('signal', signal => {
                socket.emit('returning-signal', { signal, callerID });
            });
            peer.on('stream', stream => {
                 setPeers(prevPeers => 
                    prevPeers.map(p => 
                        p.peerID === callerID ? { ...p, stream } : p
                    )
                );
            });
            peer.signal(incomingSignal);
            return peer;
        }

        socket.on('connect', () => console.log('✅ Socket connected successfully:', socket.id));
        socket.on('connect_error', (err) => console.error('❌ Socket connection error:', err.message));
        
        socket.on('all-users', (otherUsers) => {
            const newPeersData = [];
            otherUsers.forEach(user => {
                const peer = createPeer(user.id, socket.id, userName);
                peersRef.current[user.id] = { peer, name: user.name };
                newPeersData.push({ peerID: user.id, name: user.name, stream: null });
            });
            setPeers(newPeersData);
            setParticipants([{ id: socket.id, name: userName }, ...otherUsers]);
        });

        socket.on('user-joined', (payload) => {
            if (peersRef.current[payload.callerID]) return;
            const peer = addPeer(payload.signal, payload.callerID, payload.name);
            peersRef.current[payload.callerID] = { peer, name: payload.name };
            setPeers(prev => [...prev, { peerID: payload.callerID, name: payload.name, stream: null }]);
            setParticipants(prev => [...prev, { id: payload.callerID, name: payload.name }]);
        });

        socket.on('receiving-returned-signal', (payload) => {
            peersRef.current[payload.id]?.peer.signal(payload.signal);
        });

        socket.on('user-left', ({ id }) => {
            if (peersRef.current[id]) {
                peersRef.current[id].peer.destroy();
                delete peersRef.current[id];
            }
            setPeers(prev => prev.filter(p => p.peerID !== id));
            setParticipants(prev => prev.filter(p => p.id !== id));
        });

        socket.on('room-state', (roomState) => {
            setPomodoroState(roomState.pomodoroState || { mode: 'work', timeLeft: 25 * 60, isRunning: false });
        });
        
        socket.connect();
        socket.emit('join-room', { roomId, userName });

        const currentPeersRef = peersRef.current;
        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('all-users');
            socket.off('user-joined');
            socket.off('receiving-returned-signal');
            socket.off('user-left');
            socket.off('room-state');
            socket.disconnect();
            Object.values(currentPeersRef).forEach(p => p.peer.destroy());
        };
    }, [myStream, roomId, userName]);

    const toggleAudio = () => {
        myStream?.getAudioTracks().forEach(track => {
            track.enabled = !track.enabled;
        });
        setIsAudioMuted(prevState => !prevState);
    };
    const toggleVideo = () => {
        if (!isScreenSharing) {
            myStream?.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOn(prevState => !prevState);
        }
    };
    const startScreenShare = () => { navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => { setIsScreenSharing(true); setScreenStream(stream); const screenTrack = stream.getVideoTracks()[0]; screenTrackRef.current = screenTrack; Object.values(peersRef.current).forEach(({ peer }) => { peer.replaceTrack(myStream.getVideoTracks()[0], screenTrack, myStream); }); screenTrack.onended = () => stopScreenShare(stream); }).catch(err => { if (err.name === 'NotAllowedError') { console.log('Screen share permission denied by user.'); } else { console.error("Screen share failed:", err); } setIsScreenSharing(false); setScreenStream(null); }); };
    const stopScreenShare = (streamToStop) => { const tracks = streamToStop ? streamToStop.getTracks() : screenTrackRef.current ? [screenTrackRef.current] : []; tracks.forEach(track => track.stop()); if (screenTrackRef.current && myStream) { Object.values(peersRef.current).forEach(({ peer }) => { peer.replaceTrack(screenTrackRef.current, myStream.getVideoTracks()[0], myStream); }); } setIsScreenSharing(false); setScreenStream(null); screenTrackRef.current = null; };
    const toggleLayout = () => { setLayout(prev => prev === 'tiled' ? 'whiteboard' : 'tiled'); };
    const handleCopyRoomId = () => { navigator.clipboard.writeText(roomId); alert("Room ID copied to clipboard!"); };
    
    // **UPDATED**: Renamed one handler to avoid confusion
    const handleFullScreen = (elementRef) => { 
        const elem = elementRef.current;
        if (!elem) return; 
        if (document.fullscreenElement) { 
            document.exitFullscreen(); 
        } else { 
            elem.requestFullscreen().catch(err => console.error(err)); 
        } 
    };

    // Find if a remote peer is screen sharing
    const screenSharingPeer = peers.find(p => 
        p.stream && p.stream.getVideoTracks()[0]?.getSettings().displaySurface
    );
    
    if (mediaError) { 
        return ( <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-4 gap-4"> <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="w-16 h-16 text-red-500" /> <h2 className="text-2xl font-bold text-red-400">Permission Error</h2> <p className="text-center text-lg">{mediaError}</p> </div> );
    }
    
    // --- Main JSX ---
    return (
        <div className="h-screen max-h-screen bg-black text-white flex flex-col overflow-hidden">
            <header className="flex-shrink-0 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700 m-4 mb-0">
                 <h1 className="text-xl font-bold">Study Room: <span className="text-blue-400 font-mono">{roomId}</span></h1>
                 <div className="flex items-center gap-4">
                     <PomodoroTimer socket={socketRef.current} roomId={roomId} initialState={pomodoroState} onStateChange={setPomodoroState} />
                     <button onClick={handleCopyRoomId} title="Copy Room ID" className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                         <Icon path="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.03 1.125 0 1.131.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H8.25Z" className="w-6 h-6" />
                     </button>
                 </div>
            </header>

            <div className="flex-grow flex p-4 gap-4 min-h-0 relative">
                <main ref={mainStageRef} className="flex-grow flex flex-col bg-gray-900/50 rounded-lg border border-gray-700 relative">
                    {/* Case 1: The local user is sharing their screen */}
                    {isScreenSharing ? (
                        <div className="w-full h-full bg-black flex items-center justify-center rounded-lg relative group">
                            <video srcObject={screenStream} autoPlay playsInline className="w-full h-full object-contain" />
                            {/* **FIX**: Pass the correct ref (mainStageRef) to the handler */}
                            <button onClick={() => handleFullScreen(mainStageRef)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon path="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" className="w-6 h-6"/>
                            </button>
                        </div>
                    // Case 2: A remote user is sharing their screen
                    ) : screenSharingPeer ? (
                        <div className="w-full h-full bg-black flex items-center justify-center rounded-lg relative group">
                            <video ref={remoteScreenRef} srcObject={screenSharingPeer.stream} autoPlay playsInline className="w-full h-full object-contain" />
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                {screenSharingPeer.name} is sharing their screen
                            </div>
                            {/* **FIX**: Pass the correct ref (remoteScreenRef) to the handler */}
                            <button onClick={() => handleFullScreen(remoteScreenRef)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Icon path="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" className="w-6 h-6"/>
                            </button>
                        </div>
                    // Case 3: No one is sharing, show the normal layout
                    ) : (
                        <div className="w-full h-full relative">
                            <div className={`absolute inset-0 w-full h-full ${layout === 'whiteboard' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                <Whiteboard socket={socketRef.current} roomId={roomId} />
                            </div>
                            <div className={`absolute inset-0 w-full h-full p-4 grid grid-cols-1 sm:grid-cols-2 md-grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto ${layout === 'tiled' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                               <div className="relative bg-gray-800 rounded-lg aspect-video shadow-md group">
    <video ref={myVideoRef} muted autoPlay playsInline className="w-full h-full rounded-lg object-cover" />
    <div className="absolute bottom-0 left-0 bg-black/60 text-white text-xs px-2 py-1 rounded-br-lg rounded-tl-lg">
        {userName} (You)
    </div>
    {/* This button uses the handleFullScreen function already in StudyRoom.js */}
    <button
        onClick={() => handleFullScreen(myVideoRef)}
        className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Toggle Fullscreen"
    >
        <Icon path="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" className="w-4 h-4"/>
    </button>
</div>
                                {peers.map(({ peerID, name, stream }) => (
                                    <div key={peerID} className="relative bg-gray-800 rounded-lg aspect-video">
                                        <Video stream={stream} name={name} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                <aside className={`flex-shrink-0 flex flex-col gap-4 min-h-0 transition-all duration-300 ${isSidebarOpen ? 'w-80' : 'w-0'}`}>
                    <div className={`h-full w-full flex flex-col gap-4 bg-gray-900/50 rounded-lg border border-gray-700 p-3 overflow-hidden ${!isSidebarOpen && 'invisible'}`}>
                        <h2 className="text-lg font-bold">Participants ({participants.length})</h2>
                        <div className="space-y-2 overflow-y-auto">
                           {participants.map(p => (
                                <div key={p.id} className="flex items-center gap-2 truncate">
                                    <Icon path="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{p.name} {p.id === socketRef.current?.id && '(You)'}</span>
                                </div>
                           ))}
                        </div>
                        <div className="flex-grow min-h-0">
                           <Chat socket={socketRef.current} roomId={roomId} myName={userName} />
                        </div>
                    </div>
                </aside>

                <ControlBar
                    onToggleAudio={toggleAudio}
                    isAudioMuted={isAudioMuted}
                    onToggleVideo={toggleVideo}
                    isVideoOn={isVideoOn}
                    onShareScreen={startScreenShare}
                    isScreenSharing={isScreenSharing}
                    onStopScreenShare={() => stopScreenShare(screenStream)}
                    onToggleLayout={toggleLayout}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                    onLeaveRoom={onLeaveRoom}
                />
            </div>
        </div>
    ); 
};