const mongoose = require("mongoose");
const restaurantTableService = require("../mysql/RestaurantsTable");
const googleMapAPIService = require("../googlemap/googleMapAPIService");
const postsCollection = require("../mongoose/postsCollection");
const Mongodb_Business_TimesCollectionService = require("../mongoose/business_timesCollection");
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

async function updateAvergeWithSingleInput() {
  try {
    let inputGrade = 3.2;
    let restaurants = await restaurantTable.getAllTableRestaurants();
    let { restaurant_id, lastaverage_grade } = restaurants[0];
    let result = await restaurantTable.updateRestaurantAverage_GradeWithInputGrade(restaurant_id, inputGrade);
    console.log(result);
  } catch (error) {
    console.log(error);
  }
}
averagePlaceAverage();
