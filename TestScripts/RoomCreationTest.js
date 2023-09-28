const ioClient = require('socket.io-client'); // Importing Client Side Socket API
const socket = ioClient('http://localhost:3000'); // Connecting to My Server
// Connected To Socket.IO Server.
socket.on('connect', () => {
    console.log('Room Creation, Connected Successfully');

    socket.emit('create-room','International Students');
    socket.on('room-created', (newRoom) => {
        console.log('Room created:', newRoom);
    });
    socket.on('room-creation-error', (errorMessage) => {
        console.error('Room Creation Error:', errorMessage);
    });
});
// Disconnected From Socket.IO Server.
socket.on('disconnect', () => {
    console.log('Room Creation,Disconnected');
});
