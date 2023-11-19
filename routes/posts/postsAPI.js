const express = require('express');
const router = express.Router();
const postRouter = require('./postsRouter')
const nearLocationRouter = require('./nearLocationPostsRouter')
const usersPostsRouter = require('./userPostsRouter')
const restaurantsPostsRouter = require('./restaurantPostsRouter')


router.use('/restaurants', restaurantsPostsRouter)
router.use('/users', usersPostsRouter)
router.use('/nearlocation', nearLocationRouter)
router.use('/', postRouter)

module.exports = router;
