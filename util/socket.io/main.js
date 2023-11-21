const socketIO = require('socket.io')
const Mongodb_messagesCollection = require("../mongoose/messagesCollection");
const messagesCollectionService = new Mongodb_messagesCollection()

class SocketIOService {
  constructor(server) {
    this.io = socketIO(server);
    this.registerSocketEvents();
  }

  registerSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log('一個客戶端連接');

      socket.on("joinRoom", (chatRoomID) => {
        socket.join(chatRoomID);
      });

      socket.on('isRead', async (roomid ,messageIds) => {
        const result = await messagesCollectionService.markMessagesAsRead(messageIds)
        socket.broadcast.to(roomid).emit('read', messageIds);
      })

      socket.on('message', async (data) => {
        console.log(data);
        const roomid = data.roomid;
        const message = data.message;
        const senderid = data.senderid;
        await messagesCollectionService.saveMessage(roomid, senderid, message);
        this.io.to(roomid).emit('message', data);
      });

      socket.on('disconnect', () => {
        console.log('客戶端斷開連接');
      });
    });
  }
}

module.exports = SocketIOService;