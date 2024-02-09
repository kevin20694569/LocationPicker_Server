const express = require("express");
const router = express.Router();
const mysqlRestaurantsTableService = require("../../util/mysql/restaurantsTabel");
const restaurantTableService = new mysqlRestaurantsTableService();
const business_timesCollection = require("../..//util/mongoose/business_timesCollection");
const business_TimesCollectionService = new business_timesCollection.Mongodb_Business_TimesCollectionService();

router.get("/:id", async (req, res, next) => {
  try {
    let place_id = req.params.id;
    let { latitude, longitude } = req.query;

    let result = await restaurantTableService.getrestaurant(place_id, latitude, longitude);
    let business_times = await business_TimesCollectionService.getPlaceBusinessTimes(place_id);
    let mergedResult = {
      ...result,
      ...business_times["_doc"],
    };
    if (result == null) {
      res.send("找不到餐廳");
      console.log("找不到餐廳");
      res.status(404);
    } else {
      res.json(mergedResult);
      res.status(200);
    }
  } catch (error) {
    console.log(error);
  }
  res.end();
});

module.exports = router;
