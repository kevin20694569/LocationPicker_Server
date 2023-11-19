const { chatroom, message } = require("./mongodbModel");

class Mongodb_chatRoomsCollectionService {
  constructor() {
    this.chatroom = chatroom;
    this.message = message;
  }
  async createRoom(room_id, user_ids ) {
    try {
        let chatroomModel = {
            room_id : room_ID,
            room_users : user_ids
        }
      let result = await this.chatroom.create(chatroomModel);
      return result;
    } catch (error) {
    console.log(error)
      throw new Error("創建聊天室失敗");
    }
  }

  async getRoomMessage(room_id, date, limit) {
    try {
      let results = await this.message.find({ 
        room_id: room_id,
        created_time: { $lte: date } })
        .sort({ created_time: -1 })
        .limit(limit);
      return results;
    } catch (error) {
    console.log(error)
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async getRoomIdByUserIds(user_ids) {
    try {
      let result = await Room.findOne({
        room_users: { $size: 2, $all: user_ids }
      });
      return result;
    } catch (error) {
      throw new Error("查不到這個聊天室roomid");
    }

  }
}

module.exports = Mongodb_chatRoomsCollectionService