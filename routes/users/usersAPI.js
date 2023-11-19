var express = require('express');
var router = express.Router();
const loginRouter = require('./loginRouter')
const registerRouter = require('./registerRouter')
const usersRouter = require('./usersRouter')

router.use('/login', loginRouter)
router.use('/register', registerRouter)
router.use('/', usersRouter)


module.exports = router;
