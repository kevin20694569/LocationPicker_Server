const mongoose = require("mongoose");
const constant = require("../extension/constant");
const ServerIP = constant.ServerIP;
const locationpickermongoDB = require("./mongodb");

let projectOutput = {
  _id: 0,
  post_id: "$_id",
  post_content: "$post_content",
  media_data: {
    $map: {
      input: "$media_data",
      as: "media",
      in: {
        url: { $concat: [ServerIP, "media/", "$$media.media_id"] },
        itemtitle: "$$media.itemtitle",
      },
    },
  },
  distance: "$distance",
  user_id: "$user_id",
  restaurant_id: "$restaurant_id",
  created_at: "$created_at",
  reactions: "$reactions",
};

let randomPostProjectOutput = {
  post_id: "$randomPost._id",
  post_title: "$randomPost.post_title",
  post_content: "$randomPost.post_content",
  media_data: {
    $map: {
      input: "$randomPost.media_data",
      as: "media",
      in: {
        url: { $concat: [ServerIP, "media/", "$$media.media_id"] },
        itemtitle: "$$media.itemtitle",
      },
    },
  },
  distance: "$randomPost.distance",
  user_id: "$randomPost.user_id",
  restaurant_id: "$randomPost.restaurant_id",
  location: "$distance",
  created_at: "$randomPost.created_at",
  reactions: "$reactions",
};

let reactionProject = {
  post_id: 0,
  user_id: 1,
  liked: 1,
  reaction: 1,
  updated_at: 1,
  isFriend: 1,
  _id: 0,
};

const mediaSchema = new mongoose.Schema({
  media_id: {
    type: String,
    required: true,
  },
  itemtitle: {
    type: String,
    default: null,
  },
});
const PostSchema = new mongoose.Schema({
  post_title: {
    type: String,
    default: null,
  },
  post_content: {
    type: String,
    default: null,
  },
  media_data: {
    type: [mediaSchema],
    require: true,
  },
  user_id: {
    type: Number,
    require: true,
  },
  restaurant_id: {
    type: String,
    require: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  created_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    vomit: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    surprise: { type: Number, default: 0 },
  },
  grade: {
    type: Number,
    default: null,
  },
});

const messageSchema = new mongoose.Schema({
  room_id: {
    type: String,
    require: true,
  },
  sender_id: {
    type: Number,
    require: true,
  },
  message: {
    type: String,
    require: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  created_time: {
    type: Date,
    require: true,
  },
});

const userSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    require: true,
  },
  chatRoomIds: [
    {
      type: String,
    },
  ],
});

const chatroomSchema = new mongoose.Schema({
  room_id: {
    type: String,
    require: true,
  },
  room_users: [
    {
      type: Number,
    },
  ],
});

const reactionsSchema = new mongoose.Schema({
  post_id: {
    type: String,
    require: true,
  },
  user_id: {
    type: Number,
    require: true,
  },
  reaction: {
    type: Number,
    default: null,
  },
  liked: {
    type: Boolean,
    require: true,
    default: false,
  },
  updated_at: {
    type: Date,
    require: true,
    default: new Date(),
  },
});

const business_day_hoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: false,
    default: null,
  },
  close: {
    type: String,
    required: false,
    default: null,
  },
});

const business_timeSchema = new mongoose.Schema({
  place_id: {
    type: String,
    require: true,
  },
  opening_hours: {
    type: {
      mon: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      tues: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      wed: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      thur: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      fri: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sat: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
      sun: [{ type: mongoose.Schema.Types.ObjectId, ref: "business_day_hours" }],
    },
    require: false,
    default: null,
  },
});

var Post = locationpickermongoDB.model("posts", PostSchema);
var message = locationpickermongoDB.model("messages", messageSchema);
var user = locationpickermongoDB.model("users", userSchema);
var chatroom = locationpickermongoDB.model("chatRooms", chatroomSchema);
var reaction = locationpickermongoDB.model("reactions", reactionsSchema);
var business_day_hours = locationpickermongoDB.model("business_day_hours", business_day_hoursSchema);
var business_times = locationpickermongoDB.model("business_times", business_timeSchema);

module.exports = {
  Post,
  message,
  user,
  chatroom,
  reaction,
  business_day_hours,
  reactionProject,
  business_times,
  locationpickermongoDB,
  projectOutput,
  randomPostProjectOutput,
};
