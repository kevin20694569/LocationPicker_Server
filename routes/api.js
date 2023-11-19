var express = require('express');
var router = express.Router();

var usersAPI = require('./users/usersAPI');
var postsAPI = require('./posts/postsAPI');
var restaurantsAPi = require('./restaurants/restaurantsAPI')
//var chatRouter = require('../socket.io/main')
const friendsRouter = require('./friends/friendsAPI')


router.use('/media', express.static('./public/media/postmedia'));
router.use('/restaurantimage', express.static('./public/media/restaurantimage'));
router.use('/userimage',  express.static('./public/media/userimage'))

router.use('/posts', postsAPI);
router.use('/users', usersAPI);
router.use('/restaurants', restaurantsAPi);
//router.use('/chat', chatRouter)

router.use('/friends',friendsRouter)


router.use('/', (req, res) => {
  res.end("未輸入路徑")
})

module.exports = router
