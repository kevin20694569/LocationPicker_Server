const axios = require("axios");
const { GoogleMapAPIKey } = require("../extension/constant");
const fs = require("fs");

class GoogleMapAPIService {
  constructor() {
    this.apiKey = GoogleMapAPIKey;
  }
  async searchPlacesByText(query) {
    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/textsearch/json",
        {
          params: {
            query: query,
            key: this.apiKey,
            language: "zh-TW",
          },
        }
      );
      const results = response.data.results;
      if (results.length > 0) {
        return results[0];
      } else {
        throw new Error("找不到地點");
      }
    } catch (error) {
      throw error;
    }
  }

  async searchPlaceByID(ID) {
    try {
      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: ID,
            key: this.apiKey,
            language: "zh-TW",
          },
        }
      );

      const result = response.data.result;
      if (result) {
        return result;
      } else {
        throw new Error("找不到地點");
      }
    } catch (error) {
      throw error;
    }
  }

  async downloadPhoto(photoReference, restaurant_id) {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/photo`;

    const response = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "stream",
      params: {
        maxwidth: 400,
        photoreference: photoReference,
        key: this.apiKey,
        language: "zh-TW"
      }
    });
    let filename = `${restaurant_id}.jpg`;
    const filePath =
      __dirname + `../../../public/media/restaurantimage/${filename}`;
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", resolve(filename));
      writer.on("error", reject);
    });
  }
}

module.exports = GoogleMapAPIService;
