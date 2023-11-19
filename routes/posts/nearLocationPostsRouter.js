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
    let users = await userTableService.getUserByID([users_IDs]);
    let json = await mergeJsonProperties(posts, users, restaurants)
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

router.get("/:id", async (req, res) => {
  let user_id = req.params.id;
  let { latitude, longitude, distance, lastrestaurantid } = req.query;
  try {
    let userResults = await FriendShipsService.searchFriendsByUserID(user_id);
    let friends = friendsDBNeo4j.transFormToJSONNeo4jResults(userResults, "friends");
    let friend_ID_Array = friends.map((friend) => {
      return friend.user_ID;
    });

    let restaurants = await restaurantTableService.getnearlocactionRestaurants(
      latitude,
      longitude,
      distance,
      lastrestaurantid,
      20
    );
    let restaurant_IDs = [];
    for (const restaurant of restaurants) {
      restaurant_IDs.push(restaurant.restaurant_id);
    }

    let posts = await postsCollectionService.getNearLocationPostsFromFriendsByUserID(
      friend_ID_Array,
      restaurant_IDs
    );
    for (const [index, post] of posts.entries()) {
      friend_ID_Array[index] = post.user_id;
    }
    let users = await userTableService.getUserByID([friend_ID_Array]);
    let json = await mergeJsonProperties(posts, users, restaurants)
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

async function mergeJsonProperties(posts, users, restaurants)  {
  let json = []
  for (const [index, value] of posts.entries()) {
    let user;
    if (users[index]) {
      user = users[index];
    } else {
      for (const [index, result] of users.entries()) {
        if (result.user_id == value.user_id) {
          user = users[index];
        }
      }
    }
    const restautant = restaurants[index];
    const resultobject = {
      ...value,
      ...user,
      ...restautant,
    };
    json.push(resultobject);
  }
  return json
}

module.exports = router;
