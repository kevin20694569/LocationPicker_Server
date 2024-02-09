const express = require("express");
const router = express.Router();
const mysqlRestaurantsTableService = require("../../util/mysql/restaurantsTabel.js");
const restaurantTableService = new mysqlRestaurantsTableService();
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js");
const mysqlUserTableService = require("../../util/mysql/usersTable.js");
const userTableService = new mysqlUserTableService();
const postsCollectionService = new Mongodb_postsCollectionService();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const friendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();
const common_functionObject = new require("../../util/extension/common_functionObject.js");
const common_utils = new common_functionObject();

router.get("/:id", async (req, res) => {
  try {
    let user_id = req.params.id;
    let { longitude, latitude, date } = req.query;
    let friends = await friendShipsService.searchFriendsByUserID(user_id);
    friends = FriendShipsService.transFormToJSONNeo4jResults(friends, "friends");
    const frined_Ids = friends.map((friend) => {
      return friend.user_ID;
    });
    let posts = await postsCollectionService.getFriendsPostByCreatedTime(frined_Ids, date, longitude, latitude);
    const users_Ids = posts.map((post) => {
      return post.user_id;
    });
    const restaurants_Ids = posts.map((post) => {
      return post.restaurant_id;
    });
    const [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurants_Ids);
    let users = await userTableService.getUserByIDs(users_Ids);
    let jsonData = common_utils.mergeJsonProperties(posts, users, restaurants);
    res.json(jsonData);
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error);
  } finally {
    res.end();
  }
});

module.exports = router;
