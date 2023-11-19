const { message } = require("./mongodbModel");

class Mongodb_messagesCollectionService {
  constructor() {
    this.message = message;
  }
  async sendMessage( room_ID, sender_ID,  message) {
    try {
        let messageModel = {
            room_id: room_ID,
            sender_id: sender_ID,
            message: message
        }
      let result = await this.message.create(messageModel);

      return result;
    } catch (error) {
        console.log(error)
      throw new Error("發送訊息失敗");
    }
  }

}
module.exports = Mongodb_messagesCollectionService