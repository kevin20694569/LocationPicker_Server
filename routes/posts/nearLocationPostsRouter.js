var express = require("express");
var router = express.Router();
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js");
const postsCollectionService = new Mongodb_postsCollectionService();
const mysqlRestaurantsTableService = require("../../util/mysql/RestaurantsTable.js");
const restaurantTableService = new mysqlRestaurantsTableService();
const mysqlUserTableService = require("../../util/mysql/usersTable.js");
const userTableService = new mysqlUserTableService();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const Mongodb_reactionsCollectionService = require("../../util/mongoose/reactionsCollection.js");
const reactionsCollectionService = new Mongodb_reactionsCollectionService();
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();

const common_functionObject = new require("../../util/extension/common_functionObject");
const common_utils = new common_functionObject();

router.get("/", async (req, res) => {
  let { latitude, longitude, distance, lastrestaurantid, user_id } = req.query;
  try {
    let posts = await postsCollectionService.getRandomPublicPostsFromDistance(longitude, latitude, distance);
    let post_ids = [];
    let users_ids = [];
    let restaurant_ids = posts.map((post) => {
      post_ids.push(post.post_id);
      users_ids.push(post.user_id);
      return post.restaurant_id;
    });
    let [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurant_ids);
    let users = await userTableService.getUserByIDs(users_ids);
    let friends = await FriendShipsService.searchFriendsByUserID(user_id);
    let friends_id = FriendShipsService.transFormToJSONNeo4jResults(friends, "friends");
    friends_id = friends_id.map((friend) => {
      return friend.user_ID;
    });
    let selfreactions = await reactionsCollectionService.getManyPostsSelfReaction(post_ids, user_id);
    let publicReactions = await reactionsCollectionService.getPostsPublicReactions(post_ids, user_id, friends_id);
    let json = common_utils.mergeJsonProperties(posts, users, restaurants, selfreactions, publicReactions);
    res.json(json);
    res.status(200);
    res.end();
  } catch (error) {
    console.log(error);
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
      return Number(friend.user_ID);
    });
    let posts = await postsCollectionService.getNearLocationPostsFromFriendsByUserID(friend_ID_Array, distance, latitude, longitude);
    if (posts.length < 1) {
      res.send("沒有更多posts");
      return;
    }
    let post_ids = [];
    let restaurant_Ids = posts.map((post) => {
      post_ids.push(post.post_id);
      return post.restaurant_id;
    });
    let [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurant_Ids);
    for (const [index, post] of posts.entries()) {
      friend_ID_Array[index] = post.user_id;
    }
    let users = await userTableService.getUserByIDs(friend_ID_Array);
    let selfreactions = await reactionsCollectionService.getManyPostsSelfReaction(post_ids, user_id);
    let publicReactions = await reactionsCollectionService.getPostsPublicReactions(post_ids, user_id, friend_ID_Array);
    console.log(publicReactions);
    let json = common_utils.mergeJsonProperties(posts, users, restaurants, selfreactions, publicReactions);
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
