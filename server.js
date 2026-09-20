const express = require('express');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('API TikTok Live Bridge Online!');
});

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    let tiktokConnection = null;

    socket.on('connect_tiktok', (username) => {
        if (!username) return socket.emit('error', 'Username not provided');

        if (tiktokConnection) {
            tiktokConnection.disconnect();
        }

        console.log(`Connecting to: ${username}`);
        tiktokConnection = new WebcastPushConnection(username);

        tiktokConnection.connect().then(state => {
            socket.emit('tiktok_connected', { roomId: state.roomId });
            console.log(`Connected to ${username}`);
        }).catch(err => {
            socket.emit('tiktok_disconnected', `Connection error: ${err.message}`);
            console.log(`Error connecting to ${username}:`, err.message);
        });

        tiktokConnection.on('chat', (data) => {
            socket.emit('live_chat', data);
        });

        tiktokConnection.on('gift', (data) => {
            socket.emit('live_gift', data);
        });

        tiktokConnection.on('like', (data) => {
            socket.emit('live_like', data);
        });

        tiktokConnection.on('follow', (data) => {
            socket.emit('live_follow', data);
        });

        tiktokConnection.on('share', (data) => {
            socket.emit('live_share', data);
        });

        tiktokConnection.on('member', (data) => {
            socket.emit('live_member', data);
        });

        tiktokConnection.on('disconnected', (reason) => {
            socket.emit('tiktok_disconnected', `Live disconnected: ${reason}`);
        });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        if (tiktokConnection) {
            tiktokConnection.disconnect();
        }
    });
});
