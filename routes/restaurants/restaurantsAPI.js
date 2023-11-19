var express = require('express');
var router = express.Router();
const restaurantRouter = require('./restaurantsRouter')


router.use('/', restaurantRouter)

module.exports = router;
