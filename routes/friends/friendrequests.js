var express = require("express");
var router = express.Router();
const ServerIP = require("../../util/extension/constant.js").ServerIP;
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();
const mysql_usersTable = require("../../util/mysql/usersTable.js");
const usersTable = new mysql_usersTable();

router.get("/:id", async (req, res) => {
  try {
    let user_id = req.params.id;
    let { date } = req.query;
    let results = await FriendShipsService.searchFriendRequestsByUserID(user_id, date);
    let request = FriendShipsService.transFormToJSONNeo4jResults(results, "request");
    let from_user = FriendShipsService.transFormToJSONNeo4jResults(results, "from_user");
    let json = [];
    let ids = from_user.map((user) => {
      return user["user_ID"];
    });
    let users = await usersTable.getUserByIDs(ids);
    console.log(users);

    for (const [index, element] of request.entries()) {
      delete from_user[index].from_user_ID;
      let object = {
        ...request[index],
        ...from_user[index],
        user_imageurl: /* ServerIP +  "userimage/" +*/ users[index].user_imageurl,
      };
      json.push(object);
    }
    res.json(json);
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  } finally {
    res.end();
  }
});
router.post("/", async (req, res) => {
  try {
    let { from_user_id, to_user_id } = req.body;
    let results = await FriendShipsService.sendFriendRequest(from_user_id, to_user_id);
    let json = FriendShipsService.transFormToJSONNeo4jResults(results, "request");
    res.json(json[0]);
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  } finally {
    res.end();
  }
});

router.delete("/", async (req, res) => {
  try {
    let { from_user_id, to_user_id } = req.body;
    let results = await FriendShipsService.deleteFriendRequest(from_user_id, to_user_id);
    if (results.records.length > 0) {
      res.status(200).send("刪除成功");
    } else {
      throw new Error("預期外的錯誤");
    }
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  } finally {
    res.end();
  }
});
module.exports = router;
