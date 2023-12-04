const { message } = require("./mongodbModel");

class Mongodb_messagesCollectionService {
  constructor() {
    this.message = message;
  }
  async saveMessage(room_ID, sender_ID, message, created_time) {
    try {
      let messageModel = {
        room_id: room_ID,
        sender_id: sender_ID,
        message: message,
        created_time : created_time
      };
      let result = await this.message.create(messageModel);

      return result;
    } catch (error) {
      console.log(error);
      throw new Error("保存訊息失敗");
    }
  }

  async getRoomMessage(room_id, date, limit) {
    try {
      console.log(date)
      if (!date) {
        date = new Date();
      } else {
        date = new Date(date)
      }
      let results = await this.message
        .find({
          room_id: room_id,
          created_time: { $lt: date },
        })
        .sort({ created_time: -1 })
        .limit(limit);
      return results;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }

  async markMessagesAsRead(message_Ids) {
    try {
      const updateResult = await this.message.updateMany(
        { _id: { $in: messageIds }, isRead: false },
        { $set: { isRead: true } }
      );
      return updateResult;
    } catch (error) {
      console.log(error);
      throw new Error("獲取roomid訊息失敗");
    }
  }
}
module.exports = Mongodb_messagesCollectionService;
