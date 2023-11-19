const { user } = require("./mongodbModel");

class Mongodb_usersCollectionService {
  constructor() {
    this.user = user;
  }
  async createUser(user_id) {
    try {
        let user = {
            user_id : user_id
        }
      let result = await this.user.create(user);
      return result;
    } catch (error) {
      throw new Error("創建user失敗");
    }
  }

  async insertRoomIdToUser(user_ids, room_id) {
    try {
      let results = await this.user.updateMany(
        { user_id : user_ids },
        { $push: { chatRoomIds : room_id } },
        { new: true } 
      )
      return results;
    } catch (error) {
      throw new Error("user文檔新增roomid失敗");
    }
  }


}

module.exports = Mongodb_usersCollectionService;
