const mongoose = require("mongoose");

const {
  Post,
  projectOutput,
  randomPostProjectOutput,
  locationpickermongoDB,
} = require("./mongodbModel");
const { ResultSummary } = require("neo4j-driver");

class Mongodb_postsCollectionService {
  constructor() {
    this.Post = Post;
    this.projectOutput = projectOutput;
    this.randomPostProjectOutput = randomPostProjectOutput;
    this.locationpickermongoDB = locationpickermongoDB;
  }
  async insertPost(post_content, media_data, user_id, location, restaurant_id) {
    try {
      let postmodel = new this.Post({
        post_content: post_content,
        media_data: media_data,
        user_id: user_id,
        location: location,
        restaurant_id: restaurant_id,
      });

      await postmodel.save();
      return postmodel;
    } catch (error) {
      console.log(error);
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

  async getPostFromID(Post_ID) {
    try {
      let id = new mongoose.Types.ObjectId(Post_ID);
      const results = await this.Post.aggregate([
        { $match: { _id: id } },
        { $project: this.projectOutput },
      ]);
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
  async getNearLocationPostsFromFriendsByUserID(
    friendIds,
    distanceThreshold,
    lat,
    long
  ) {
    try {
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
              $arrayElemAt: [
                "$posts",
                { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } },
              ],
            },
            
          },
        },
        { $sort: { distance: 1 } },
        { $project: { randomPost: this.randomPostProjectOutput } },
      ]); 
      
      console.log(results[0])

      if (results.length > 0) {
        return results.map((result) => result.randomPost);
      } else {
        throw new Error("錯誤朋友餐廳post");
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

  async getFriendsPostByCreatedTime(friend_Ids, date) {
    try {
      let match = [
        { $match: { user_id: { $in: friend_Ids } } },
        { $project: this.projectOutput },
        { $sort: { created_at: 1 } },
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

  getRandomPostaggregate = (orderby) => [
    {
      $group: { _id: "$restaurant_id", posts: { $push: "$$ROOT" } },
    },
    {
      $addFields: {
        randomPost: {
          $arrayElemAt: [
            "$posts",
            { $floor: { $multiply: [{ $rand: {} }, { $size: "$posts" }] } },
          ],
        },
        sortOrder: { $indexOfArray: [orderby, "$_id"] },
      },
    },
    { $sort: { sortOrder: 1 } },
    { $project: { randomPost: this.randomPostProjectOutput } },
  ];
}

module.exports = Mongodb_postsCollectionService;
