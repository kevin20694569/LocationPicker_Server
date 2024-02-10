const MySQLDataBase = require("./mysqlDBPool").MySQLDataBase;

const googleMapAPIService = require("../googlemap/googleMapAPIService");
const googleMapService = new googleMapAPIService();
const constant = require("../extension/constant");
const { ServerIP } = constant;
const business_timesCollection = require("../mongoose/business_timesCollection");
const business_timeService = new business_timesCollection.Mongodb_Business_TimesCollectionService();

class mysqlRestaurantsTableService extends MySQLDataBase {
  constructor() {
    super();
    this.business_timeService = business_timeService;
    this.googleMapService = googleMapService;
  }

  async findrestaurantIDByMySQL(restaurant_ID, firstGrade) {
    try {
      await this.getConnection();
      let query = `select * from restaurants where restaurant_id = ?;`;
      let params = [restaurant_ID];
      let [results, fileds] = await this.connection.query(query, params);
      if (results.length > 0) {
        return results[0];
      } else {
        let { place_id, name, formatted_address, geometry, lat, lng, photos, opening_hours } = await this.restaurantsearchfromgoogleByID(
          restaurant_ID
        );
        if (place_id == undefined || place_id == null) {
          throw new Error("找不到地點");
        }
        if (opening_hours == undefined) {
          opening_hours = null;
        }
        let { photo_reference } = photos[0];
        await googleMapService.downloadPhoto(photo_reference, place_id);
        let [results, fileds] = await this.createnewrestaurant(place_id, name, formatted_address, lat, lng, firstGrade);
        if (results.serverStatus == 2) {
          await this.business_timeService.insertNewBusinessTime(place_id, opening_hours);
          let result = {
            restaurant_id: place_id,
            restaurant_latitude: lat,
            restaurant_longitude: lng,
          };
          return result;
        } else {
          await this.deleteRestaurant(place_id);
          throw new Error("新建餐廳失敗");
        }
      }
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }

  async getrestaurant(restaurant_id, lat, lng) {
    try {
      await this.getConnection();
      var params = [lng, lat, restaurant_id];
      let [restaurantresults, fileds] = await this.connection.query(
        `select *, ST_DISTANCE(POINT(restaurants.restaurant_longitude, restaurants.restaurant_latitude), POINT(?, ?)) AS distance
      from restaurants
      where restaurants.restaurant_id = ?;`,
        params
      );
      let restaurant = restaurantresults[0];
      let id = restaurant.restaurant_id;
      restaurant["restaurant_imageurl"] = ServerIP + "restaurantimage/" + restaurant.restaurant_id + ".jpg";
      if (restaurantresults.length > 0) {
        return restaurantresults[0];
      } else {
        throw new Error("找不到餐廳");
      }
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }

  async createnewrestaurant(place_id, name, formatted_address, lat, lng, firstGrade) {
    try {
      await this.getConnection();
      let query = `insert into restaurants (restaurant_id, restaurant_name, restaurant_address, restaurant_latitude, restaurant_longitude, average_grade) VALUES(?, ?, ?, ?, ?, ?);`;
      let params = [place_id, name, formatted_address, lat, lng, firstGrade];
      const [results, fileds] = await this.connection.query(query, params);
      return [results, fileds];
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }

  async deleteRestaurant(place_id) {
    try {
      await this.getConnection();
      let query = `DELETE FROM restaurants
      WHERE restaurant_id = ?;`;
      let params = [place_id];
      const [results, fileds] = await this.connection.query(query, params);
      return [results, fileds];
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }

  async getRestaurantsDetail(restaurant_Ids) {
    try {
      await this.getConnection();
      let query = `Select * from restaurants Where restaurant_id in (?)`;
      let params = [restaurant_Ids];
      const [results, fileds] = await this.connection.query(query, params);
      return [results, fileds];
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }

  async getnearlocactionRestaurants(latitude, longitude, offset, lastrestaurantid, limit) {
    try {
      await this.getConnection();
      let query = `select  *,
      ST_DISTANCE(POINT(restaurants.restaurant_longitude, restaurants.restaurant_latitude), POINT(?, ?)) AS distance
      from restaurants 
      WHERE restaurants.restaurant_id IS NOT NULL AND ST_DISTANCE(POINT(restaurants.restaurant_longitude, restaurants.restaurant_latitude),
      POINT(?, ?))  > ?
      AND restaurants.restaurant_id != ?
      ORDER BY distance
      limit ?`;

      if (offset) {
        var params = [longitude, latitude, longitude, latitude, offset, lastrestaurantid, limit];
      } else {
        var params = [longitude, latitude, longitude, latitude, 0, "", limit];
      }

      let [results, fileds] = await this.connection.query(query, params);

      for (const value of results) {
        value["restaurant_imageurl"] = ServerIP + `restaurantimage/${value.restaurant_id}.jpg`;
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }
  async getAllTableRestaurants() {
    try {
      await this.getConnection();
      let query = `select * from restaurants;`;
      const [results, fileds] = await this.connection.query(query);
      return results;
    } catch (error) {
      throw error;
    } finally {
      super.release();
    }
  }

  async updateAverageGrade(restaurant_id, averge_grade) {
    try {
      await this.getConnection();
      let query = `update restaurants set average_grade = ? where restaurant_id = ?;`;
      let params = [averge_grade, restaurant_id];
      const [results, fileds] = await this.connection.query(query, params);
      return results;
    } catch (error) {
      throw error;
    }
  }
  async restaurantsearchfromgoogleByID(location_ID) {
    let result = await this.googleMapService.searchPlaceByID(location_ID);
    let { place_id, name, formatted_address, geometry, photos, opening_hours } = result;
    let { lat, lng } = geometry.location;
    return { place_id, name, formatted_address, geometry, lat, lng, photos, opening_hours };
  }
}

module.exports = mysqlRestaurantsTableService;
