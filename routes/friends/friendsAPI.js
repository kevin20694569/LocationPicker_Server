const express = require('express');
const router = express.Router();
const FriendshipRouter = require('./friendships.js');
const FriendRequestRouter = require('./friendrequests.js')
const FriendsRouter = require('./friendsRouter.js');

router.use('/friendrequests', FriendRequestRouter)
router.use('/friendships', FriendshipRouter);
router.use('/',FriendsRouter)



module.exports = router