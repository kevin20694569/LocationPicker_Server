const express = require("express");
const router = express.Router();
const mysqlUserTableService = require('../../util/mysql/usersTable');
const userTableService = new mysqlUserTableService()
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js")
const postsCollectionService = new Mongodb_postsCollectionService()

router.get("/:id", async (req, res, next) => {
  try {
    let  restaurantid  = req.params.id
    let { date } = req.query;
    if (date == undefined || date == "") {
      date = new Date();
    } else {
      date = new Date(date);
    }
    let results = await postsCollectionService.getRestaurantPostsFromRestaurantID(
      restaurantid,
      date
    );
    let Array = [];
    for (const result of results) {
      Array.push(result.user_id);
    }
    let userResults = await userTableService.getUserByIDs(Array);
    for (const [index, user_id] of Array.entries() ) {
      let user;
      if (userResults[index]) {
        user = userResults[index]
      } else {
        for (const value of userResults) {
          if (value.user_id == user_id) {
            user = value
          }
        }
      }
      let json = {
        ...results[index],
        ...user,
      };
      Array[index] = json;
    }
    res.json(Array);
    res.status(200);
  } catch (error) {
    res.status(404);
    res.send(error.message);
    console.log(error);
  }
  res.end();
} )

module.exports = router