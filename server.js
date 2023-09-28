const express = require('express');
const http = require('http'); 
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

//Communicating With Database
const knex = require('knex')({
    client: 'pg',
    connection: {
        host : 'john.db.elephantsql.com',
        user : 'ksrqwzkg',
        password : 'Pv1Ltj9Tw-1fjp4sZU5HYZlQLlIV_GTe',
        database : 'ksrqwzkg'
    }
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// My MiddleWares
app.use(bodyParser.json());
app.use(cors());

// My Socket Server To Handle Messages From Users.
io.on('connection', (socket) => {
    console.log('User Is Connected');

    // Create Chat Room Event Handler
    socket.on('create-room', async (roomName) => {
        if (!roomName) {
            socket.emit('room-creation-error', 'Room Name is required');
            return;
        } else {
            try {
                //Communicating To My Create Room Route.
                const response = await axios.post('http://localhost:3000/chatrooms', {
                    name: roomName
                });
                const newRoom = response.data.chatRoom;
                const [name] = newRoom;
                io.emit('room-created', name); // Send Success Message of Room Creation to Users.
            } catch (error) {
                console.error('Room Creation Error', error.message);
                socket.emit('room-creation-error', 'Failed to create room, Either it is a server error or room already exists, Re-Check if the Room Exists Already and then try Again!');
            }
        }
    });

    // Send Message In The Room Event Handler
    socket.on('send-message', async (message) => {
        try {
            // Communicating To My Send Message Route.
            const response = await axios.post('http://localhost:3000/chat-room/send-message', message);
            const result = response.data;
            if (result.Success) {
                io.emit('message-sent', result.message); // Send Success Message To Users.
            } else {
                socket.emit('message-sent-error', 'Failed to send message');
            }
        } catch (error) {
            console.error('Message Sending Error', error.newMessage);
            socket.emit('message-sent-error', 'Failed to send message, Make Sure You Have Entered Correct UserName or RoomName.');
        }
    });

    //Create a New Chat Room Event Handler
    socket.on('join-room', async (roomName, userName) => {
        try {
            // Make a request to the /chat-room/join route to join the room
            const response = await axios.post('http://localhost:3000/chat-room/join', {
                roomName: roomName,
                userName: userName
            });
    
            const message = response.data.Message;
            socket.emit('joined-room', message); // Sending Success Message Of Room Joining To Users.
        } catch (error) {
            const errorMessage = error.response.data.Error || 'Failed to join room';
            socket.emit('join-room-error', errorMessage);
        }
    });

    // Get The Available Chat Rooms Event Handler
    socket.on('get-available-chat-rooms',async () => {
        try {
            // Communicating To the Get Available Chat Rooms Route
            const response = await axios.get('http://localhost:3000/chatrooms');
            const availableChatRooms = response.data.AvailableChatRooms;
            socket.emit('available-chat-rooms',availableChatRooms); // Sending Available Chat Rooms To Users.
        } catch (error) {
            console.error('Error-Fetching-Available-Chat-Rooms',error.message);
            socket.emit('Failed-Fetching-Available-Chat-Rooms','Failed to fetch available chat rooms');
        }
    });

    // Get Messages From The Chat Room Event Handler
    socket.on('get-chat-room-messages', async ({ roomName, userName }) => {
        try {
            // Communicating to my Get Chat Messages From Chat Room Route
            const response = await axios.get(`http://localhost:3000/chat-room/messages/${roomName}`, {
                headers: {
                    'user-name': userName,
                },
            });

            const messages = response.data.messages;
            socket.emit('chat-room-messages', messages); // Sending Messages To The Users.
        } catch (error) {
            console.error('Error fetching chat room messages:', error.message);
            socket.emit('chat-room-messages-error', 'Failed to fetch chat room messages');
        }
    });
    // When User Disconnects From Server
    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

// Getting Available Chat Rooms from Database
app.get('/chatrooms', async (req, res) => {
    try {
        const chatRooms = await knex('chat_rooms').select('*');
        res.status(200).json({AvailableChatRooms : chatRooms});
    } catch (error) {
        console.error('Error fetching chat rooms:', error.message);
        res.status(500).json({Error : 'Internal Server Error'});
    }
})
// Creating New Chat Room 
app.post('/chatrooms', async (req, res) => {
    const {name} = req.body;
    if (!name){
        res.status(404).json({Error : 'Room Name is Required!'});
        return;
    }
    else {
        const chatRoom = await knex('chat_rooms').where('name', name).first();

        if (chatRoom) {
            res.status(403).json({ Error: 'Room already exists' });
            return;
        }
        else{
            try {
                const chatRoom = await knex('chat_rooms').returning('*').insert({name});
                res.status(200).json({chatRoom});
            } catch (error) {
                console.error('Error Creating chat room:', error.message);
                res.status(500).json({Error : 'Internal Server Error'});
            }
        }
    }
})
// Joining Chat Room
app.post('/chat-room/join', async (req, res) => {
    const {roomName , userName} = req.body;
    const chatRoom = await knex('chat_rooms').where('name', roomName).first();
    if (!chatRoom) {
        res.status(404).json({Error : 'Room not found'});
        return;
    }
    else {
        try {
            let checkUser = await knex('users').where('username', userName).first();
            if (!checkUser) {
                [checkUser] = await knex('users').returning('*').insert({username : userName});
            }
            const checkParticipation = await knex('participants').where('user_id', checkUser.id).first();
            if (!checkParticipation) {
                await knex('participants').insert({user_id : checkUser.id, chat_room_id : chatRoom.id});
                res.status(200).json({ Message: `Joined ${chatRoom.name} Successfully` });
            }
            else{
                res.status(403).json({Error : 'User Already Joined a Room'});
            }
        }
            catch (error) {
                console.error('Join Room Error:', error.message);
                res.status(500).json({ Error: 'Internal Server Error' });
            }
    }
})

// Sending Message and Save In The Database
app.post('/chat-room/send-message', async (req, res) => {
    const { RoomName, userName, Message } = req.body;

    try {
        // Find the chat room by name in the database
        const chatRoom = await knex('chat_rooms').where('name', RoomName).first();

        if (!chatRoom) {
            res.status(404).json({ Error: 'Chat Room not found' });
            return;
        }

        // Find the user by name in the database
        const user = await knex('users').where('username', userName).first();

        if (!user) {
            res.status(404).json({ Error: 'User not found' });
            return;
        }

        // Check if the user is a participant in the chat room
        const participant = await knex('participants')
            .where('user_id', user.id)
            .where('chat_room_id', chatRoom.id)
            .first();

        if (!participant) {
            res.status(403).json({ Error: 'Sender is not a participant of this ChatRoom' });
            return;
        }

        // Insert the new message into the 'messages' table
        const newMessage = {
            user_id: user.id,
            chat_room_id: chatRoom.id,
            content: Message,
            timestamp: new Date().toISOString(),
        };

        await knex('messages').insert(newMessage);

        res.status(200).json({ Success: newMessage.content });
    } catch (error) {
        console.error('Send Message Error:', error.message);
        res.status(500).json({ Error: 'Internal Server Error' });
    }
});

// Getting Messages From database
app.get('/chat-room/messages/:chatRoomName', async (req, res) => {
    const chatRoomName = req.params.chatRoomName;
    const userName = req.headers['user-name']; // Use 'user-name' (lowercase) for consistency

    try {
        // Find the chat room by name in the database
        const chatRoom = await knex('chat_rooms').where('name', chatRoomName).first();

        if (!chatRoom) {
            res.status(404).json({ Error: 'Chat Room not found' });
            return;
        }

        // Find the user by name in the database
        const user = await knex('users').where('username', userName).first();

        if (!user) {
            res.status(404).json({ Error: 'User not found' });
            return;
        }

        // Check if the user is a participant in the chat room
        const participant = await knex('participants')
            .where('user_id', user.id)
            .where('chat_room_id', chatRoom.id)
            .first();

        if (!participant) {
            res.status(403).json({ Error: 'Access denied' });
            return;
        }

        // Fetch messages for the specified chat room
        const messages = await knex('messages')
            .select('messages.content', 'messages.timestamp', 'users.username')
            .innerJoin('users', 'messages.user_id', 'users.id')
            .where('messages.chat_room_id', chatRoom.id)
            .orderBy('messages.timestamp', 'asc');

        res.status(200).json({ messages });
    } catch (error) {
        console.error('Get Messages Error:', error.message);
        res.status(500).json({ Error: 'Internal Server Error' });
    }
});

// Starting My Express Server.
const PORT = process.env.PORT || 3000;

server.listen(PORT,() => {
    console.log(`Server in running on ${PORT}`);
});