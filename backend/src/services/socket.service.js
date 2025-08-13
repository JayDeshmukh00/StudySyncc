// src/services/socket.service.js
module.exports = function(io) {
    const rooms = {};

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on('join-room', ({ roomId, userName }) => {
            if (!rooms[roomId]) {
                rooms[roomId] = {
                    users: {},
                    chatHistory: [],
                    pomodoroState: { mode: 'work', timeLeft: 25 * 60, isRunning: false },
                    whiteboardData: null
                };
                console.log(`Room created: ${roomId}`);
            }

            // CHANGE: More robust logic for handling user joining
            const currentUser = { id: socket.id, name: userName };
            rooms[roomId].users[socket.id] = currentUser;
            socket.roomId = roomId;
            socket.join(roomId);

            console.log(`User ${userName} (${socket.id}) joined room ${roomId}`);

            // Get a list of everyone else *already* in the room
            const otherUsers = Object.values(rooms[roomId].users).filter(u => u.id !== socket.id);

            // 1. Send the list of existing users ONLY to the new user
            socket.emit('all-users', otherUsers);
            
            // 2. Send the complete room state to the new user
            socket.emit('room-state', {
                host: Object.keys(rooms[roomId].users)[0],
                whiteboard: rooms[roomId].whiteboardData,
                chatHistory: rooms[roomId].chatHistory,
                pomodoroState: rooms[roomId].pomodoroState
            });
        });

        socket.on('sending-signal', payload => {
            io.to(payload.userToSignal).emit('user-joined', {
                signal: payload.signal,
                callerID: payload.callerID,
                name: payload.name
            });
        });

        socket.on('returning-signal', payload => {
            io.to(payload.callerID).emit('receiving-returned-signal', {
                signal: payload.signal,
                id: socket.id
            });
        });

        socket.on('send-chat-message', ({ roomId, message }) => {
            if (rooms[roomId]) {
                rooms[roomId].chatHistory.push(message);
                socket.to(roomId).emit('receive-chat-message', message);
            }
        });

        socket.on('request-chat-history', (roomId) => {
            if (rooms[roomId]) {
                socket.emit('chat-history', rooms[roomId].chatHistory);
            }
        });

        socket.on('sync-pomodoro', ({ roomId, newState }) => {
            if (rooms[roomId]) {
                rooms[roomId].pomodoroState = newState;
                socket.to(roomId).emit('sync-pomodoro', newState);
            }
        });

        socket.on('whiteboard-draw', (data) => {
            if (data.roomId && rooms[data.roomId]) {
                rooms[data.roomId].whiteboardData = data.data;
                socket.to(data.roomId).emit('whiteboard-draw', data.data);
            }
        });

        socket.on('disconnect', () => {
            const roomId = socket.roomId;
            if (roomId && rooms[roomId]?.users[socket.id]) {
                console.log(`User ${rooms[roomId].users[socket.id].name} (${socket.id}) disconnected from room ${roomId}`);
                delete rooms[roomId].users[socket.id];
                
                socket.to(roomId).emit('user-left', { id: socket.id });

                if (Object.keys(rooms[roomId].users).length === 0) {
                    delete rooms[roomId];
                    console.log(`Room deleted: ${roomId}`);
                }
            } else {
                console.log(`Socket disconnected: ${socket.id}`);
            }
        });
    });
};