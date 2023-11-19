const express = require("express");
const router = express.Router();
const mysqlUserTableService = require('../../util/mysql/usersTable');
const userTableService = new mysqlUserTableService()

router.get("/:id", async (req, res, next) => {
  let id = req.params.id;
  let { date } = req.query;
  if (date == undefined || date == "" || date == null) {
    date = new Date();
  } else {
    date = new Date(date);
  }
  try {
    let results = await userTableService.getUserPostsProfileByID(id);
    if (results.length <= 0) {
      res.send("獲取user失敗");
      res.status(404);
    } else {
      res.json(results);
      res.status(200);
    }
  } catch (error) {
    console.log(error);
  }
  res.end();
});

module.exports = router;
