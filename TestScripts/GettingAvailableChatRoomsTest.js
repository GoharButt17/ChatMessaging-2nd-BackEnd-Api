const ioClient = require('socket.io-client'); // Importing Client Side Socket API
const socket = ioClient('http://localhost:3000'); // Connecting to My Server 

// Connecting To The Socket.IO Server
socket.on('connect', () => {
    console.log('Getting Chat Rooms, Connected Successfully');
    // Request available chat rooms
    socket.emit('get-available-chat-rooms');
    socket.on('available-chat-rooms', (availableChatRooms) => {
        console.log('Available chat rooms:', availableChatRooms);
    });
    socket.on('available-chat-rooms-error', (error) => {
        console.error('Error fetching available chat rooms:', error);
    });
});
// Disconnect From Socket.Io Server
socket.on('disconnect', () => {
    console.log('Getting Chat Rooms, Disconnected');
});
