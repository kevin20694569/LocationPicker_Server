const express = require("express");
const router = express.Router();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();
const Mongodb_chatRoomsCollectionService = require("../../util/mongoose/chatRoomsCollection.js");
const chatRoomsCollectionService = new Mongodb_chatRoomsCollectionService();
const Mongodb_usersCollectionService = require("../../util/mongoose/usersCollection.js");
const usersCollectionService = new Mongodb_usersCollectionService();
const Mongodb_messagesCollection = require("../../util/mongoose/messagesCollection.js")
const messagesCollectionService = new Mongodb_messagesCollection()

router.get('/preview', async (req, res) => {
    try {
        let { date } = req.query;
        let request_user_id = req.body;
        //getPreview 用requestuserid, date用mongoose關聯查詢 先查user有的聊天室 再用這些聊天室拿到所有聊天室的最後一則訊息 再排序回傳
        //user mongodb表 還要有imageurl, name 
        let results = await chatRoomsCollectionService.getPreview(request_user_id, date)
      } catch (error) {
        res.status(404).send(error.message);
        console.log(error);
      } finally {
        res.end();
      }
})

router.get("/:id", async (req, res) => {
  try {
    let { date } = req.query;
    let { from_user_id, to_user_id } = req.body;
    let user_ids = [from_user_id, to_user_id];
    let room_id = await chatRoomsCollectionService.getRoomIdByUserIds(user_ids)
    if (room_id) {
      chatRoomsCollectionService;
      let messages = await chatRoomsCollectionService.getRoomMessage(room_id, date);
    res.json(messages);
    } else {
      room_id = `${to_user_id}_${from_user_id}`;
      let room = await chatRoomsCollectionService.createRoom(room_id, user_ids);
      let users = await usersCollectionService.insertRoomIdToUser(user_ids, room_id);
    }
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error);
  } finally {
    res.end();
  }
});

module.exports = router;
