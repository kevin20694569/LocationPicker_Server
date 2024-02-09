const express = require("express");
const router = express.Router();
const ServerIP = require("../../util/extension/constant.js").ServerIP;
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();
const mysql_usersTable = require("../../util/mysql/usersTable.js");
const usersTable = new mysql_usersTable();

router.get("/:id", async (req, res) => {
  try {
    let user_id = req.params.id;
    let results = await FriendShipsService.searchFriendsByUserID(user_id);
    let friends = FriendShipsService.transFormToJSONNeo4jResults(results, "friends");
    let ids = friends.map((friend) => {
      return friend.user_ID;
    });
    let users = await usersTable.getUserByIDs(ids);
    friends.forEach((friend, index) => {
      let user_imageurl = users[index].user_imageurl;
      friend["user_imageurl"] = user_imageurl; // ServerIP + `userimage/${imageid}`
    });
    res.json(friends);
  } catch (error) {
    res.send(error.message);
  } finally {
    res.end();
  }
});

module.exports = router;
