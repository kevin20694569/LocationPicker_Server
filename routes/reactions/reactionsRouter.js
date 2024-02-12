const express = require("express");
const router = express.Router();
const Mongodb_reactionsCollectionService = require("../../util/mongoose/reactionsCollection");
const reactionsCollectionService = new Mongodb_reactionsCollectionService();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();

router.get("/:id", async (req, res) => {
  let post_id = req.params.id;
  let { user_id } = req.body;
  let friends_idsObject = await FriendShipsService.searchFriendsByUserID(user_id);
  let jsonArray = await FriendShipsService.transFormToJSONNeo4jResults(friends_idsObject, "friends");
  let friends_ids = jsonArray.map((json) => {
    let { user_ID } = json;
    return user_ID;
  });
  console.log(friends_ids);
  let reactions = await reactionsCollectionService.getPostReactions(post_id, user_id, friends_ids);
  res.status(200);
  res.send(reactions);
  res.end();
});

router.post("/:id", async (req, res) => {
  let post_id = req.params.id;
  let { user_id, reaction, liked } = req.body;
  try {
    await reactionsCollectionService.updateReaction(post_id, user_id, reaction, liked);
    res.status(200);
    res.send("updateReaction成功");
  } catch (error) {
    console.log(error);
    res.status(404);
    res.send("updateReactiont失敗");
  } finally {
    res.end();
  }
});

module.exports = router;
