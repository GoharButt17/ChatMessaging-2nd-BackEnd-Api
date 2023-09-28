const ioClient = require('socket.io-client'); // Importing Client Side Socket API
const socket = ioClient('http://localhost:3000'); // Connecting to My Server 
// Connecting To My Socket.IO Server.
socket.on('connect', () => {
    console.log('Recieving Messages, Connected Successfully');
    socket.emit('get-chat-room-messages', { roomName: 'Tech Talk', userName: 'Gohar17' });
    socket.on('chat-room-messages', (messages) => {
        console.log('Chat room messages:', messages);
    });
    socket.on('chat-room-messages-error', (error) => {
        console.error('Error fetching chat room messages:', error);
    });
});
// Disconnect From Socket.Io Server
socket.on('disconnect', () => {
    console.log('Recieving Messages, Disconnected');
});
