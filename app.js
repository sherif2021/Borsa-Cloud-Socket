const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const online = new Map()

io.on('connection', (socket) => {
    const userId = parseInt(socket.handshake.headers.authorization);
    if (userId) {
        socket.userId = userId
        if (online.has(userId)) {
            online.get(userId).sockets.push(socket)
        }
        else {
            online.set(userId, { 'sockets': [socket] })
        }
        console.log(`${userId} user connected`);
        socket.on('disconnect', () => closeConnection(socket));
        socket.on('new-message', (text) => onNewMessage(text));

    } else {
        socket.disconnect();
    }
});

function closeConnection(socket) {

    try {

        if (socket.userId && online.has(socket.userId)) {

            const user = online.get(socket.userId)

            const index = user.sockets.indexOf(socket)

            if (index !== -1) {
                user.sockets.splice(index, 1);
            }

            if (user.sockets.length == 0) {
                online.delete(socket.userId)
            }
        }
        console.log(`${socket.userId} disconnect`)
        socket.disconnect();

    } catch (e) {
        console.log(e)
    }
}

function onNewMessage(data) {

    const sender_id = parseInt(data.sender_id);
    const contact_id = parseInt(data.contact_id);

    if (sender_id && online.has(sender_id)) {
        const user = online.get(sender_id)
        user.sockets.forEach(socket => {
            socket.emit('new-message', data)
        })
    } else console.log(`here > ${sender_id}`);
    if (contact_id && online.has(contact_id)) {
        const user = online.get(contact_id)
        user.sockets.forEach(socket => {
            socket.emit('new-message', data)
        })
    } else console.log(`here2 > ${contact_id}`);
}
server.listen(8000, () => {
    console.log('listening on *:8000');
});