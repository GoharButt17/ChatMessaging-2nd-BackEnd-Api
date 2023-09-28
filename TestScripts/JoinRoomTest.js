const ioClient = require('socket.io-client'); // Importing Client Side Socket API
const socket = ioClient('http://localhost:3000'); // Connecting to My Server 
// Connecting To Socket.Io Server
socket.on('connect', () => {
    console.log('Join Chat Room, Connected Successfully');

    const userName = 'Arfa17'; 
    const roomName = 'International Students';

    // Join a Chat Room
    socket.emit('join-room', roomName, userName);
    
    socket.on('joined-room', (message) => {
        console.log('Joined Room:', message);
    });
    
    socket.on('join-room-error', (errorMessage) => {
        console.error('Error Joining Room:', errorMessage);
    });
});
// Disconnect From Socket.Io Server
socket.on('disconnect', () => {
    console.log('Join Chat Room, Disconnected');
});