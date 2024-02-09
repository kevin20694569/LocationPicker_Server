var express = require("express");
var router = express.Router();
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js");
const postsCollectionService = new Mongodb_postsCollectionService();
const mysqlRestaurantsTableService = require("../../util/mysql/restaurantsTabel.js");
const restaurantTableService = new mysqlRestaurantsTableService();
const mysqlUserTableService = require("../../util/mysql/usersTable.js");
const userTableService = new mysqlUserTableService();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const { logging } = require("neo4j-driver");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();

const common_functionObject = new require("../../util/extension/common_functionObject.js");
const common_utils = new common_functionObject();

router.get("/", async (req, res) => {
  let { latitude, longitude, distance, lastrestaurantid } = req.query;
  try {
    let posts = await postsCollectionService.getRandomPublicPostsFromDistance(longitude, latitude, distance);
    let restaurant_Ids = posts.map((post) => {
      return post.restaurant_id;
    });
    let [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurant_Ids);

    let users_IDs = posts.map((post) => {
      return post.user_id;
    });
    let users = await userTableService.getUserByIDs(users_IDs);
    let json = common_utils.mergeJsonProperties(posts, users, restaurants);
    res.json(json);
    res.status(200);
    res.end();
  } catch (error) {
    console.log(error.message);
    res.status(404);
    res.send(error.message);
    res.end();
  }
});

router.get("/friends/:id", async (req, res) => {
  let user_id = req.params.id;
  let { latitude, longitude, distance } = req.query;
  try {
    let userResults = await FriendShipsService.searchFriendsByUserID(user_id);
    let friends = FriendShipsService.transFormToJSONNeo4jResults(userResults, "friends");
    let friend_ID_Array = friends.map((friend) => {
      return friend.user_ID;
    });
    let posts = await postsCollectionService.getNearLocationPostsFromFriendsByUserID(friend_ID_Array, distance, latitude, longitude);
    if (posts.length < 1) {
      res.send("沒有更多posts");
      return;
    }
    let restaurant_Ids = posts.map((post) => {
      return post.restaurant_id;
    });
    let [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurant_Ids);
    for (const [index, post] of posts.entries()) {
      friend_ID_Array[index] = post.user_id;
    }
    let users = await userTableService.getUserByIDs(friend_ID_Array);
    let json = common_utils.mergeJsonProperties(posts, users, restaurants);
    res.json(json);
    res.status(200);
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500);
    res.send(error.message);
    res.end();
  }
});

module.exports = router;
