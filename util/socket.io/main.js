const socketIO = require('socket.io')
const Mongodb_messagesCollection = require("../mongoose/messagesCollection");
const messagesCollectionService = new Mongodb_messagesCollection()
const API = require('../extension/constant').ServerIP
const cors = require('cors');
const { chatroom } = require('../mongoose/mongodbModel');

class SocketIOService {
  constructor(server) {
    this.io = socketIO(server, {
      cors : {
        origin : "*",
        methods: ["GET", "POST"],

      }
    })
    this.registerSocketEvents();
  }

  registerSocketEvents() {
    this.io.on('error', (error) => {
      console.log(error)
    })
    this.io.on('connection', (socket) => {
      console.log('一個客戶端連接');
      socket.on('error', (error) => {
        console.log(error)
      })

      socket.on("joinRoom", (chatRoomID) => {
        chatRoomID.forEach(id => {
          socket.join(id);
        });
      //  console.log(socket.adapter.rooms)
      });

      socket.on('isRead', async (roomid ,messageIds) => {
        const result = await messagesCollectionService.markMessagesAsRead(messageIds)
        socket.broadcast.to(roomid).emit('read', messageIds);
      })

      socket.on('message', async (data) => {
        console.log(data);
        const roomid = data.room_id;
        const message = data.message;
        const senderid = data.sender_id;
        const created_time = data.created_time
        await messagesCollectionService.saveMessage(roomid, senderid, message, created_time);
        this.io.to(roomid).emit('message', data);
      });

      socket.on('disconnect', () => {
        console.log('客戶端斷開連接');
      });
    });
  }
}

module.exports = SocketIOService;