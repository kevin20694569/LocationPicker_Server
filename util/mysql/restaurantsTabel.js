const mysqlServer = require("./mysqlDBPool");

const googleMapAPIService = require("../googlemap/googleMapAPIService");
const googleMapService = new googleMapAPIService()
const constant = require("../extension/constant");
const { ServerIP } = constant


class mysqlRestaurantsTableService {
  async release() {
    try {
      this.connection.release();
    } catch (error) {
      console.log(error.message);
      throw new Error("關閉mysql 失敗");
    }
  }
  async getConnection() {
    try {
      this.connection = await mysqlServer.getConnection();
    } catch (error) {
      console.log(error.message);
      throw new Error("mysql伺服器連接失敗");
    }
  }

  async findrestaurantIDByMySQL(restaurant_ID) {
    try {
      await this.getConnection();
      let query = `select * from restaurants where restaurant_id = ?;`;
      let params = [restaurant_ID];
      let [results, fileds] = await this.connection.query(query, params);
      if (results.length > 0) {
        return results[0];
      } else {
        let { place_id, name, formatted_address, geometry, lat, lng, photos } =
          await restaurantsearchfromgoogleByID(restaurant_ID);
        if (place_id == undefined || place_id == null) {
          throw new Error("找不到地點");
        }
        let { photo_reference } = photos[0];
        let imageID = await googleMapService.downloadPhoto(photo_reference, place_id);
        let [results, fileds] = await this.createnewrestaurant(
          place_id,
          name,
          formatted_address,
          lat,
          lng
        );
        if (results.serverStatus == 2) {
          let result = {
            "restaurant_id" : place_id,
            "restaurant_latitude" : lat,
            "restaurant_longitude" : lng
          }
          return result;
        } else {
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
      restaurant["restaurant_imageurl"] =
      ServerIP +
        "restaurantimage/" +
        restaurant.restaurant_id +
        ".jpg";
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

  async createnewrestaurant(place_id, name, formatted_address, lat, lng) {
    try {
      await this.getConnection();
      let query = `insert into restaurants (restaurant_id, restaurant_name, restaurant_address, restaurant_latitude, restaurant_longitude) VALUES(?, ?, ?, ?, ?);`;
      let params = [place_id, name, formatted_address, lat, lng];
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

  async getnearlocactionRestaurants( latitude, longitude, offset, lastrestaurantid, limit ) {
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
        var params = [ longitude, latitude, longitude, latitude, offset, lastrestaurantid, limit];
      } else {
        var params = [longitude, latitude, longitude, latitude, 0, "", limit];
      }

      let [results, fileds] = await this.connection.query(query, params);

      for (const value of results) {
        value[
          "restaurant_imageurl"
        ] = ServerIP + `restaurantimage/${value.restaurant_id}.jpg`;
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.release();
    }
  }
}


async function restaurantsearchfromgoogleByID(location_ID) {
  let result = await googleMapService.searchPlaceByID(location_ID);
  let { place_id, name, formatted_address, geometry, photos } = result;
  let { lat, lng } = geometry.location;
  return { place_id, name, formatted_address, geometry, lat, lng, photos };
}

module.exports = mysqlRestaurantsTableService;
