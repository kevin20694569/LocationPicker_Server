var express = require("express");
var router = express.Router();
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js")
const postsCollectionService = new Mongodb_postsCollectionService()
const mysqlRestaurantsTableService = require('../../util/mysql/restaurantsTabel.js');
const restaurantTableService = new mysqlRestaurantsTableService()
const mysqlUserTableService = require('../../util/mysql/usersTable.js');
const userTableService = new mysqlUserTableService()
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();

const common_functionObject = new require('../../util/extension/common_functionObject.js')
const common_utils = new common_functionObject()

router.get("/", async (req, res) => {
  let { latitude, longitude, distance, lastrestaurantid } = req.query;
  try {
    let restaurants = await restaurantTableService.getnearlocactionRestaurants(
      latitude,
      longitude,
      distance,
      lastrestaurantid,
      4
    );
    let restaurants_IDs = [];
    for (const restaurant of restaurants) {
      restaurants_IDs.push(restaurant.restaurant_id);
    }
    let posts = await postsCollectionService.getRandomPostsFromRestautants(restaurants_IDs);
    let users_IDs = []
    for (const [index, post] of posts.entries()) {
      users_IDs[index] = post.user_id;
    }
    let users = await userTableService.getUserByID(users_IDs);
    let json = common_utils.mergeJsonPropertiesForPostsLengthEqualRestaurantLength(posts, users, restaurants)
    res.json(json);
    res.status(200);
    res.end();
  } catch (error) {
    console.log(error.message);
    res.status(500);
    res.send(error.message);
    res.end();
  }
});

router.get("/friends/:id", async (req, res) => {
  let user_id = req.params.id;
  let { latitude, longitude, distance } = req.query;
  try {
    let userResults = await FriendShipsService.searchFriendsByUserID(user_id);
    let friends = friendsDBNeo4j.transFormToJSONNeo4jResults(userResults, "friends");
    let friend_ID_Array = friends.map((friend) => {
      return friend.user_ID;
    });

    let posts = await postsCollectionService.getNearLocationPostsFromFriendsByUserID(
      friend_ID_Array,
      0,
      latitude,
      longitude
    );
    let restaurant_Ids = posts.map( post => {
      return post.restaurant_id
    });
    let [restaurants, fileds] = await restaurantTableService.getRestaurantsDetail(restaurant_Ids)
    for (const [index, post] of posts.entries()) {
      friend_ID_Array[index] = post.user_id;
    }
    let users = await userTableService.getUserByID(friend_ID_Array);
    let json = common_utils.mergeJsonPropertiesForPostsLengthEqualRestaurantLength(posts, users, restaurants)
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
