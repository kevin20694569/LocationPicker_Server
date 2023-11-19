const express = require('express');
const router = express.Router();
const mysqlUserTableService = require('../../util/mysql/usersTable');
const userTableService = new mysqlUserTableService()
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const key = "LocationPicker"

router.post('/', async (req, res, next) => {
  const { email, password } = req.body
  try {
    let [users, fileds] = await userTableService.selectuserfromemail(email)
    if (users.length > 0 && await bcrypt.compare(password, users[0].user_password)) {
      const token = jwt.sign({
        email,
        username: users[0].username
      }, key);
      res.send(
        {
        message: "成功",
        token
      })
    } else {
      throw new Error("帳號或密碼錯誤")
    }
  } catch (error) {
    res.send(error.message)
    console.log(error)


  }
  res.end()
})

module.exports = router