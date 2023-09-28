const ioClient = require('socket.io-client'); // Importing Client Side Socket API
const socket = ioClient('http://localhost:3000'); // Connecting to My Server 
// Connecting To My Socket.IO Server.
socket.on('connect', () => {
    console.log('Sending Message, Connected Successfully');
    const userName = 'Arfa17';
    const RoomName = 'International Students';
    // Send a message
    const message = {
        RoomName: RoomName,
        Message: 'Hello!!',
        userName: userName,
    };
    socket.emit('send-message', message);
    socket.on('message-sent', (sentMessage) => {
        console.log('Message Sent:', message.Message);
    });
    socket.on('message-sent-error', (errorMessage) => {
        console.error('Error Sending Message:', errorMessage);
    });
});
// Disconnect From Socket.Io Server
socket.on('disconnect', () => {
    console.log('Sending Message, Disconnected');
});
