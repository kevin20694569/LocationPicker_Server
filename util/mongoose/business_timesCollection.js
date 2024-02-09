const mongoose = require("mongoose");
const { business_day_hours, business_day, business_times, projectOutput, randomPostProjectOutput, locationpickermongoDB } = require("./mongodbModel");
const googleMapAPIService = require("../googlemap/googleMapAPIService");
const { error } = require("neo4j-driver");

class Mongodb_Business_TimesCollectionService {
  constructor() {
    this.business_times = business_times;
    this.business_day = business_day;
    this.business_day_hours = business_day_hours;
  }

  async insertNewBusinessTime(place_id, periods) {
    try {
      let result = await this.business_times.findOne({ place_id: place_id });
      if (result != null) {
        return;
        //  throw new Error("此place的businessTime已被建立");
      }
      let daysModel = this.organizeOpeningHours(periods);
      let model = new this.business_times({
        place_id: place_id,
        opening_hours: daysModel,
      });
      await model.save();
      return model;
    } catch (error) {
      throw error;
    }
  }

  organizeOpeningHours(openingHours) {
    const daysOfWeek = ["mon", "tues", "wed", "thur", "fri", "sat", "sun"];
    const organizedHours = {};
    daysOfWeek.forEach((day) => {
      organizedHours[day] = [];
    });
    let firstOpen = openingHours[0]["open"];
    if (openingHours.length == 1 && firstOpen["day"] == 0 && firstOpen["time"] == "0000") {
      daysOfWeek.forEach((day) => {
        organizedHours[day].push({ open: "0000" });
      });
      return organizedHours;
    }

    openingHours.forEach((period) => {
      const dayOfWeek = daysOfWeek[period.open.day];
      const openingTime = period.open.time;
      if (period.close == null) {
        organizedHours[dayOfWeek].push({ open: openingTime });
        return;
      }
      const closingTime = period.close.time;
      organizedHours[dayOfWeek].push({ open: openingTime, close: closingTime });
    });

    return organizedHours;
  }

  async getPlaceBusinessTimes(place_id) {
    try {
      let result = await this.business_times.findOne({ place_id: place_id }, { _id: 0, __v: 0, "opening_hours._id": 0 });
      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = {
  Mongodb_Business_TimesCollectionService,
};
