const mongoose = require("mongoose");
const { business_day_hours, business_times, projectOutput, randomPostProjectOutput, locationpickermongoDB } = require("./mongodbModel");
const googleMapAPIService = require("../googlemap/googleMapAPIService");
const { error } = require("neo4j-driver");
const { query } = require("express");
const { compareSync } = require("bcrypt");

class Mongodb_Business_TimesCollectionService {
  constructor() {
    this.business_times = business_times;
    this.business_day_hours = business_day_hours;
  }

  async insertNewBusinessTime(place_id, opening_hours) {
    let currentPeriods = null;
    if (opening_hours != null) {
      let { periods } = opening_hours;
      currentPeriods = periods;
    }

    try {
      let result = await this.business_times.findOne({ place_id: place_id });
      if (result != null) {
        console.log(`${place_id} businessTime已被建立過`);
        return;
      }
      let daysModel = await this.organizeOpeningHours(currentPeriods);
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

  async organizeOpeningHours(periods) {
    if (periods == null) {
      return null;
    }
    const daysOfWeek = ["mon", "tues", "wed", "thur", "fri", "sat", "sun"];
    const periodHash = {};
    periods.forEach((period) => {
      if (period.close == null) {
        periodHash[`${period.open.time}`] = { open: period.open.time };
        return;
      }
      periodHash[`${period.open.time}-${period.close.time}`] = { open: period.open.time, close: period.close.time };
    });
    let periodHashArray = Object.values(periodHash);

    const results = await business_day_hours.aggregate([
      {
        $match: {
          $or: [
            ...periodHashArray.map((period) => ({ $or: [{ open: period.open, close: period.close }] })),
            { $or: [{ open: "0000", close: null }] },
          ],
        },
      },
      {
        $project: { _id: 1, open: 1, close: 1 },
      },
    ]);
    let resultsHash = {};
    results.forEach((period) => {
      if (period.close == null) {
        resultsHash[`${period.open}`] = { _id: period._id, open: period.open, close: null };
        return;
      }
      resultsHash[`${period.open}-${period.close}`] = period;
    });
    let missedArray = periodHashArray.filter((period) => {
      if (periodHash["0000"] != null && resultsHash["0000"] != null) {
        return false;
      }
      if (periodHash[`${period.open}-${period.close}`] != null && resultsHash[`${period.open}-${period.close}`] != null) {
        return false;
      }
      return true;
    });
    let insertedBusinessHoursModels;
    if (missedArray.length > 0) {
      insertedBusinessHoursModels = await this.business_day_hours.insertMany(missedArray);
      insertedBusinessHoursModels.forEach((period) => {
        if (period.close == null) {
          resultsHash[`${period.open}`] = period;
          return;
        }
        resultsHash[`${period.open}-${period.close}`] = period;
      });
    }
    let organizedHours = {};
    periods.forEach((period) => {
      const dayOfWeek = daysOfWeek[period.open.day];
      const openingTime = period.open.time;
      if (organizedHours[dayOfWeek] == null) {
        organizedHours[dayOfWeek] = [];
      }
      let hoursModel;
      if (period.close == null) {
        hoursModel = resultsHash[`${openingTime}`];
        organizedHours[dayOfWeek].push(hoursModel);
        return;
      }
      let closingTime = period.close.time;
      hoursModel = resultsHash[`${openingTime}-${closingTime}`];
      organizedHours[dayOfWeek].push(hoursModel);
    });
    return organizedHours;
  }

  async getPlaceBusinessTimes(place_id) {
    try {
      let result = await this.business_times.findOne({ place_id: place_id }, { _id: 0, __v: 0, "opening_hours._id": 0 }).populate({
        path: "opening_hours.mon opening_hours.tues opening_hours.wed opening_hours.thur opening_hours.fri opening_hours.sat opening_hours.sun",
        select: "-__v -_id",
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
  isOpenNow(hoursObject) {
    // 获取当前日期的字符串表示形式，例如 'mon'
    const currentDay = new Date().toLocaleString("tw", { weekday: "short" }).toLowerCase();

    // 获取当前时间的小时和分钟
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, "0");
    const currentMinute = now.getMinutes().toString().padStart(2, "0");
    const currentTime = currentHour + currentMinute;
    if (hoursObject[currentDay]) {
      for (const period of hoursObject[currentDay]) {
        if (period.open <= currentTime && currentTime <= period.close) {
          return true; // 当前时间在某个开门时间段内
        }
      }
    }
    return false; // 当前时间不在任何开门时间段内
  }
}

module.exports = {
  Mongodb_Business_TimesCollectionService,
};
