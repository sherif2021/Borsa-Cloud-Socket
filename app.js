const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const online = new Map()

io.on('connection', (socket) => {
    const officeId = parseInt(socket.handshake.headers.authorization);
    if (officeId) {
        socket.officeId = officeId
        if (online.has(officeId)) {
            online.get(officeId).sockets.push(socket)
        }
        else {
            online.set(officeId, { 'sockets': [socket] })
        }
        console.log(`${officeId} user connected`);
        socket.on('disconnect', () => closeConnection(socket));
        socket.on('new-message', (text) => onNewMessage(text));

    } else {
        socket.disconnect();
    }
});

function closeConnection(socket) {

    try {

        if (socket.officeId && online.has(socket.officeId)) {

            const user = online.get(socket.officeId)

            const index = user.sockets.indexOf(socket)

            if (index !== -1) {
                user.sockets.splice(index, 1);
            }

            if (user.sockets.length == 0) {
                online.delete(socket.officeId)
            }
        }
        console.log(`${socket.officeId} disconnect`)
        socket.disconnect();

    } catch (e) {
        console.log(e)
    }
}

function onNewMessage(data) {

    const sender_office_id = parseInt(data.sender_office_id);
    const received_office_id = parseInt(data.received_office_id);

    if (sender_office_id && online.has(sender_office_id)) {
        const user = online.get(sender_office_id)
        user.sockets.forEach(socket => {
            socket.emit('new-message', data)
        })
    } else console.log(`here > ${sender_office_id}`);
    if (received_office_id && online.has(received_office_id)) {
        const user = online.get(received_office_id)
        user.sockets.forEach(socket => {
            socket.emit('new-message', data)
        })
    } else console.log(`here2 > ${received_office_id}`);
}
server.listen(8000, () => {
    console.log('listening on *:8000');
});