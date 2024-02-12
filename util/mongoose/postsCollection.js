const mongoose = require("mongoose");

const { Post, projectOutput, randomPostProjectOutput, locationpickermongoDB } = require("./mongodbModel");

class Mongodb_postsCollectionService {
  constructor() {
    this.Post = Post;
    this.projectOutput = projectOutput;
    this.randomPostProjectOutput = randomPostProjectOutput;
    this.locationpickermongoDB = locationpickermongoDB;
  }

  async insertPost(post_title, post_content, media_data, user_id, location, restaurant_id, grade) {
    try {
      let postmodel = new this.Post({
        post_title: post_title,
        post_content: post_content,
        media_data: media_data,
        user_id: user_id,
        location: location,
        restaurant_id: restaurant_id,
        grade: grade,
      });
      await postmodel.save();

      return postmodel;
    } catch (error) {
      throw new Error("新建貼文失敗");
    }
  }

  async getRandomPostsFromRestautants(restaurantIds) {
    let searchqueryArray = this.getRandomPostaggregate(restaurantIds);
    let match = [{ $match: { restaurant_id: { $in: restaurantIds } } }];

    for (const element of searchqueryArray) {
      match.push(element);
    }
    let randomPosts = await this.Post.aggregate(match);
    if (randomPosts.length > 0) {
      return randomPosts.map((result) => result.randomPost);
    } else {
      throw new Error("錯誤nearlocation");
    }
  }

  async getRandomPublicPostsFromDistance(long, lat, distanceThreshold) {
    try {
      long = parseFloat(long);
      lat = parseFloat(lat);
      distanceThreshold = parseFloat(distanceThreshold);
      const results = await this.Post.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [long, lat] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            distance: { $gt: distanceThreshold },
          },
        },
        {
          $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
        },
        {
          $addFields: {
            randomPost: {
              $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
            },
          },
        },
        { $project: { randomPost: this.randomPostProjectOutput } },
        { $sort: { "randomPost.distance": 1 } },
        { $limit: 5 },
      ]);

      if (results.length > 0) {
        return results.map((result) => result.randomPost);
      } else {
        throw new Error("錯誤near餐廳post");
      }
    } catch (error) {
      throw error;
    }
  }

  async getPostFromID(Post_ID) {
    try {
      let id = new mongoose.Types.ObjectId(Post_ID);
      const results = await this.Post.aggregate([{ $match: { _id: id } }, { $project: this.projectOutput }]);
      if (results.length > 0) {
        return results;
      } else {
        throw new Error("無此Post 搜尋ID錯誤");
      }
    } catch (error) {
      throw error;
    }
  }

  async getRestaurantPostsFromRestaurantID(Restaurant_ID, dateThreshold) {
    try {
      const results = await this.Post.aggregate([
        {
          $match: {
            restaurant_id: Restaurant_ID,
            created_at: { $lt: dateThreshold },
          },
        },
        { $project: this.projectOutput },
        { $sort: { created_at: -1 } },
      ]);

      if (results.length > 0) {
        return results;
      } else {
        throw new Error("此餐廳無Post");
      }
    } catch (error) {
      throw error;
    }
  }
  async getNearLocationPostsFromFriendsByUserID(friendIds, distanceThreshold, lat, long) {
    try {
      distanceThreshold = parseFloat(distanceThreshold);
      long = parseFloat(long);
      lat = parseFloat(lat);
      const results = await this.Post.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [long, lat] },
            distanceField: "distance",
            spherical: true,
          },
        },
        {
          $match: {
            user_id: { $in: friendIds },
            distance: { $gt: distanceThreshold },
          },
        },
        {
          $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
        },
        {
          $addFields: {
            randomPost: {
              $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
            },
          },
        },
        { $sort: { "randomPost.distance": 1 } },
        { $project: { randomPost: this.randomPostProjectOutput } },
        { $limit: 6 },
      ]);

      if (results.length > 0) {
        return results.map((result) => result.randomPost);
      } else {
        return [];
      }
    } catch (error) {
      throw error;
    }
  }

  async getPostsByUserID(user_id, dateThreshold) {
    try {
      user_id = parseInt(user_id);
      const results = await this.Post.aggregate([
        {
          $match: {
            user_id: user_id,
            created_at: { $lt: dateThreshold },
          },
        },
        { $project: this.projectOutput },
        { $sort: { created_at: -1 } },
      ]);
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getFriendsPostByCreatedTime(friend_Ids, date, longtitude, latitude) {
    try {
      longtitude = parseFloat(longtitude);
      latitude = parseFloat(latitude);
      let gt_date;
      if (date == undefined || date == "" || date == 0) {
        gt_date = new Date();
      } else {
        gt_date = new Date(date);
      }
      let match = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [longtitude, latitude] },
            distanceField: "distance", // 将计算的距离保存在 "distance" 字段中
            spherical: true,
          },
        },
        {
          $match: {
            user_id: { $in: friend_Ids },
            created_at: { $lt: gt_date },
          },
        },
        { $project: this.projectOutput },
        { $sort: { created_at: 1 } },
        { $limit: 6 },
      ];
      const posts = await this.Post.aggregate(match);

      if (posts.length > 0) {
        return posts;
      } else {
        throw new Error("拿到朋友時間貼文 錯誤");
      }
    } catch (error) {
      throw error;
    }
  }

  async updatePostReactionCount(post_id, needIncreaseReactionType, needDecreaseReactionType, likeAddCount) {
    try {
      post_id = new mongoose.Types.ObjectId(post_id);
      const post = await this.Post.findById(post_id);
      if (needIncreaseReactionType) {
        post.reactions[needIncreaseReactionType]++;
      }
      if (needDecreaseReactionType) {
        post.reactions[needDecreaseReactionType]--;
      }
      if (likeAddCount) {
        post.reactions["like"] += likeAddCount;
      }
      await post.save();
      return post;
    } catch (error) {
      throw new Error("Failed to increase reaction: " + error.message);
    }
  }

  async calculateRestaurantAverage() {
    const result = await this.Post.aggregate([
      {
        $group: {
          _id: "$restaurant_id", // 根据 restaurant_id 进行分组
          average_grade: { $avg: "$grade" }, // 计算 grade 字段的平均值
        },
      },
      {
        $project: {
          restaurant_id: "$_id",
          _id: 0,
          average_grade: 1,
        },
      },
    ]);
    return result;
  }

  getRandomPostaggregate = (orderby) => [
    {
      $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
    },
    {
      $addFields: {
        randomPost: {
          $arrayElemAt: ["$posts", { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } }],
        },
        sortOrder: { $indexOfArray: [orderby, "$_id"] },
      },
    },
    { $sort: { sortOrder: 1 } },
    { $project: { randomPost: this.randomPostProjectOutput } },
  ];
}

module.exports = Mongodb_postsCollectionService;
