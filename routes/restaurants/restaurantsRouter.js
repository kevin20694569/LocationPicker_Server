const express = require("express");
const router = express.Router();
const mysqlRestaurantsTableService = require('../../util/mysql/restaurantsTabel');
const restaurantTableService = new mysqlRestaurantsTableService()

router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let {latitude, longitude} = req.query
    let result = await restaurantTableService.getrestaurant(id, latitude, longitude)
    if (result == null || result == undefined) {
      res.send([]);
      console.log("找不到餐廳");
      res.status(404);
    } else {
      res.json(result);
      res.status(200);
    }
  } catch (error) {
    console.log(error);
  }
  res.end();
});

module.exports = router;
