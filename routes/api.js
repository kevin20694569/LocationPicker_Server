var express = require("express");
var router = express.Router();

var usersAPI = require("./users/usersAPI");
var postsAPI = require("./posts/postsAPI");
var restaurantsAPI = require("./restaurants/restaurantsAPI");
const friendsAPI = require("./friends/friendsAPI");
const chatroomsAPI = require("./chatrooms/chatroomsAPI");
const reactionsAPI = require("./reactions/reactionsAPI");

router.get("/index", async (req, res) => {
  res.render("index.ejs");
  res.status("200");
  res.end();
});

router.use("/media", express.static("./public/media/postmedia"));
router.use("/restaurantimage", express.static("./public/media/restaurantimage"));
router.use("/userimage", express.static("./public/media/userimage"));

router.use("/posts", postsAPI);
router.use("/users", usersAPI);
router.use("/restaurants", restaurantsAPI);
router.use("/chatrooms", chatroomsAPI);
router.use("/reactions", reactionsAPI);
//router.use('/chat', chatRouter)

router.use("/friends", friendsAPI);

router.use("/", (req, res) => {
  res.end("未輸入路徑");
});
module.exports = router;
