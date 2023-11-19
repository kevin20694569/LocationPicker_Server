const express = require('express');
const { chatroom } = require('../../util/mongoose/mongodbModel');
const router = express.Router();
const chatroomsRouter = require('./chatroomsRouter')


router.use('/', chatroomsRouter)




module.exports = router