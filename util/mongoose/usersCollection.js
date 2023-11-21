const { user } = require("./mongodbModel");

class Mongodb_usersCollectionService {
  constructor() {
    this.user = user;
  }
  async createUser(user_id) {
    try {
      user_id = parseInt(user_id)
        let user = {
            user_id : user_id
        }
      let result = await this.user.create(user);
      return result;
    } catch (error) {
      throw new Error("創建user失敗");
    }
  }

  async searchUserHaveRoomId(user_id, room_id) {
    console.log(user_id, room_id)
    let result = await this.user.findOne(
      { user_id: user_id },
      {chatRoomIds: { $elemMatch: { $nin:  [room_id]} }}
    )
    console.log(result)
    return result.user_id;
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
      console.log(error)
      throw new Error("user文檔新增roomid失敗");
    }
  }


}

module.exports = Mongodb_usersCollectionService;
