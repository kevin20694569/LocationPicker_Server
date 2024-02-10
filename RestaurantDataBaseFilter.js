const mongoose = require("mongoose");
const restaurantTableService = require("./util/mysql/restaurantsTabel");
const googleMapAPIService = require("./util/googlemap/googleMapAPIService");
const Mongodb_Business_TimesCollectionService = require("./util/mongoose/business_timesCollection");
const restaurantTable = new restaurantTableService();
const googleMapService = new googleMapAPIService();
const { business_times } = require("./util/mongoose/mongodbModel");
let Business_TimesCollectionService = new Mongodb_Business_TimesCollectionService.Mongodb_Business_TimesCollectionService();

//正規化sql Restaurants 和 mongod business_time
async function standardPlace() {
  try {
    let results = await restaurantTable.getAllTableRestaurants();
    let place_ids = results.map((place) => {
      return place.restaurant_id;
    });
    let result = await Business_TimesCollectionService.getPlaceBusinessTimes(place_ids[2]);
    let { opening_hours } = result;
    console.log(opening_hours);
    return;

    let newInit = 0;
    for (i = 0; i < place_ids.length; i++) {
      let id = place_ids[i];
      let time = await Business_TimesCollectionService.getPlaceBusinessTimes(id);
      if (time != null) {
        continue;
      }
      let { place_id, name, formatted_address, geometry, lat, lng, photos, opening_hours } = await googleMapService.searchPlaceByID(id);
      await Business_TimesCollectionService.insertNewBusinessTime(place_id, opening_hours);
      newInit += 1;
      console.log(`${(place_id, name)}正規完成`);
    }
    console.log(`總共正規${newInit}個Place`);
  } catch (error) {
    console.log(error);
  }
}

standardPlace();
