const { chatroom, message, user } = require("./mongodbModel");

class Mongodb_chatRoomsCollectionService {
  constructor() {
    this.chatroom = chatroom;
    this.user = user;
    this.message = message
  }
  async createRoom(room_id, user_ids) {
    try {
      let chatroom = await this.chatroom.findOne({
        room_id : room_id
      });
      if (chatroom) {
        throw new Error('已經有這個chatroom')
      }
      let chatroomModel = {
        room_id: room_id,
        room_users: user_ids,
      };
      let result = await this.chatroom.create(chatroomModel);
      return result;
    } catch (error) {
      console.log(error);
      throw new Error("創建聊天室失敗")
    }
  }

  async getRoomIdByUserIds(user_ids) {
    try {
      let result = await this.chatroom.findOne({
        room_users: { $size: 2, $all: user_ids },
      });
      return result;
    } catch (error) {
      throw new Error("查詢聊天室roomid錯誤");
    }
  }

  async getRoomByRoomId(room_id) {
    
    try {
      let result = await this.chatroom.findOne({
        room_id : room_id
      });
      return result;
    } catch (error) {
      throw new Error("查詢聊天室錯誤");
    }
  }

  async getPreviewByUserId(user_id, date) {
    try {
      var user = await this.user.findOne({ user_id: user_id });
      var chatRoomIds = user.chatRoomIds;

      if (!date) {
        date = new Date();
      }
      var results = await this.message.aggregate([
        {
          $match: {
            room_id: { $in: chatRoomIds },
            created_time: { $lt: date },
          },
        },
        {
          $group: {
            _id: "$room_id",
            lastMessage: { $last: "$message" },
            lastMessageTime: { $last: "$created_time" },
            senderId: { $last: "$sender_id" },
            isRead : { $last : "$isRead"}
          },
        },
        {
          $project: {
            _id: 0,
            room_id: "$_id",
            lastMessage: "$lastMessage",
            lastMessageTime: "$lastMessageTime",
            senderId: "$senderId",
            isRead : "$isRead"
          },
        },
        { $sort: { lastMessageTime: -1 } },
      ]);
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("查不到這個Preview");
    }
  }

  async getChatRoomsFromUserId(user_id) {
    try {
      let results = await this.user.findOne({
        user_id : user_id
      });
      return results;
    } catch (error) {
      console.log(error)
      throw new Error("查詢聊天室錯誤");
    }
  }
}

module.exports = Mongodb_chatRoomsCollectionService;
