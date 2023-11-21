const mongoose = require("mongoose");
const constant = require("../constant");
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
  user_id: "$user_id",
  restaurant_id: "$restaurant_id",
  created_at: "$created_at",
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
  user_id: "$randomPost.user_id",
  restaurant_id: "$randomPost.restaurant_id",
  created_at: "$randomPost.created_at",
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
  created_at: {
    type: Date,
    require: true,
    default: new Date(),
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
    default: new Date(),
  },
});

const userSchema = new mongoose.Schema({
  user_id : {
    type : Number,
    require : true,
  },
  chatRoomIds : [
    {
      type : String,
    }
  ]
});

const chatroomSchema = new mongoose.Schema({
  room_id : {
    type : String,
    require : true
  },
  room_users : [
    {
      type : Number
    }
  ]
})

var Post = locationpickermongoDB.model("posts", PostSchema);
var message = locationpickermongoDB.model("messages", messageSchema);
var user = locationpickermongoDB.model("users", userSchema);
var chatroom = locationpickermongoDB.model("chatRooms", chatroomSchema);

module.exports = {
  Post,
  message,
  user,
  chatroom,
  projectOutput,
  randomPostProjectOutput,
};
