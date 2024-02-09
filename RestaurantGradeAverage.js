const mongoose = require("mongoose");
const restaurantTableService = require("./util/mysql/restaurantsTabel");
const googleMapAPIService = require("./util/googlemap/googleMapAPIService");
const postsCollection = require("./util/mongoose/postsCollection");
const Mongodb_Business_TimesCollectionService = require("./util/mongoose/business_timesCollection");
const restaurantTable = new restaurantTableService();
const googleMapService = new googleMapAPIService();
let Business_TimesCollectionService = new Mongodb_Business_TimesCollectionService.Mongodb_Business_TimesCollectionService();
const postsCollectionService = new postsCollection();

async function averagePlaceAverage() {
  try {
    let results = await postsCollectionService.calculateRestaurantAverage();
    for (const result of results) {
      let { restaurant_id, average_grade } = result;
      await restaurantTable.updateAverageGrade(restaurant_id, average_grade);
    }
  } catch (error) {
    console.log(error);
  }
}

averagePlaceAverage();
