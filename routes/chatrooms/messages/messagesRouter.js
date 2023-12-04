const express = require("express");
const router = express.Router();
const friendsDBNeo4j = require("../../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();
const Mongodb_chatRoomsCollectionService = require("../../../util/mongoose/chatRoomsCollection.js");
const chatRoomsCollectionService = new Mongodb_chatRoomsCollectionService();
const Mongodb_usersCollectionService = require("../../../util/mongoose/usersCollection.js");
const usersCollectionService = new Mongodb_usersCollectionService();
const Mongodb_messagesCollection = require("../../../util/mongoose/messagesCollection.js");
const messagesCollectionService = new Mongodb_messagesCollection()


router.get("/:id/message", async (req, res) => {
  try {
    let room_id = req.params.id
    let { date } = req.query;
    let id_array = room_id.split('_')
    if (id_array[0] == id_array[1]) {
      throw new Error('不得存取和自己的聊天室')
    }
    id_array = id_array.sort((a, b) => a - b)
    room_id = id_array.join('_')
    id_array = id_array.map( (id) => {
      return parseInt(id)
    })
    let room = await chatRoomsCollectionService.getRoomByRoomId(room_id)
    if (room) {
    let messages = await messagesCollectionService.getRoomMessage(room_id, date, 20);

    res.json(messages);
    } else {
      let room = await chatRoomsCollectionService.createRoom(room_id, id_array);
      let users = await usersCollectionService.insertRoomIdToUser(id_array, room_id);
      if (users.modifiedCount == id_array.length) {
        res.json(room)
      } else {
        throw new Error(`將roomid插入${id_array}的roomid失敗`)
      }

    }
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error);
  } finally {
    res.end();
  }
});

module.exports = router;
