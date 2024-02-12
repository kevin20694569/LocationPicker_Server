const express = require("express");
const router = express.Router();
const multer = require("multer");
const mysqlRestaurantsTableService = require("../../util/mysql/RestaurantsTable.js");
const restaurantTableService = new mysqlRestaurantsTableService();
const shortid = require("short-uuid");
const mime = require("mime");
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js");
const { JsonWebTokenError } = require("jsonwebtoken");
const postsCollectionService = new Mongodb_postsCollectionService();
const friednsPostsRouter = require("./friendsPostsRouter.js");
const { error } = require("neo4j-driver");
var progressStream = require("progress-stream");

const fs = require("fs");
const io = require("../../util/socket.io/main.js");
const path = require("path");
const reactionsCollection = require("../../util/mongoose/reactionsCollection.js");

const reactionCollectionService = new reactionsCollection();

const postMediaFolder = "./public/media/postmedia";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, postMediaFolder);
  },
  filename: function (req, file, cb) {
    const shortUUID = shortid();
    const uuid = shortUUID.new();
    const mimeType = mime.lookup(file.mimetype);
    let ext = "";
    if (mimeType.startsWith("image/")) {
      ext = ".jpg";
    } else if (mimeType.startsWith("video/")) {
      ext = ".mp4";
    }
    cb(null, uuid + ext);
  },
});
let upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制 100 MB
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.match(/^image|video\//)) {
      console.log("檔案格式錯誤");
      callback(new Error("檔案格式錯誤"));
    } else {
      callback(null, true);
    }
  },
});

router.use("/friends", friednsPostsRouter);

router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let { user_id } = req.body;
    let data = await postsCollectionService.getPostFromID(id);
    let selfReaction = await reactionCollectionService.getSelfReaction(id, user_id);
    let reaction;
    if (selfReaction) {
      reaction = selfReaction["_doc"];
    }
    let json = {
      ...data[0],
      reaction: reaction,
    };
    res.send(json);
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error);
  } finally {
    res.end();
  }
});

router.post("/", getProgress, findRestaurantIDmiddleware, async (req, res, next) => {
  try {
    let files = req.files;
    if (files == undefined) {
      throw new Error("沒有選擇檔案上傳");
    }

    let media_data = files.map((file, index) => {
      const filename = `${file.filename}`;
      if (req.post_itemtitles[index] == "") {
        req.post_itemtitles[index] = null;
      }
      let model = {
        media_id: filename,
        itemtitle: req.post_itemtitles[index],
        _id: null,
      };
      return model;
    });

    const location = {
      type: "Point",
      coordinates: req.location,
    };

    let result = await postsCollectionService.insertPost(
      req.post_title,
      req.post_content,
      media_data,
      req.user_id,
      location,
      req.restaurant_id,
      req.grade
    );
    req.io.emitUploadTaskFinished(req.socket_id, true);
    res.status(200).json("上傳成功");
  } catch (error) {
    next(error);
  } finally {
    res.end();
  }
});

async function getProgress(req, res, next) {
  const progress = progressStream({ length: "0" }); // 设置初始长度为 0
  req.pipe(progress);
  progress.headers = req.headers;
  progress.body = req.body;
  upload.none()(req, res, (err) => {
    let json = JSON.parse(req.body.json);
    req.json = json;
    req.socket_id = json.socket_id;
    req.io = new io();
    progress.on("progress", function (obj) {
      req.io.emitUploadProgressToSocket(req.socket_id, obj.percentage);
    });
    upload.fields([{ name: "media" }])(progress, res, function (err) {
      req.files = progress.files.media;
      err = new Error("test uploadProgress");
      if (err) {
        next(err);
      }
      next();
    });
  });
}

async function findRestaurantIDmiddleware(req, res, next) {
  let { user_id, post_title, post_content, restaurant_address, post_itemtitles, restaurant_name, restaurant_ID, grade, socket_id } = req.json;

  let { restaurant_id, restaurant_latitude, restaurant_longitude } = await restaurantTableService.findrestaurantIDByMySQL(restaurant_ID, grade);

  if (restaurant_id) {
    req.socket_id = socket_id;
    req.post_title = post_title;
    req.post_content = post_content;
    req.grade = grade;
    req.post_itemtitles = post_itemtitles;
    req.restaurant_name = restaurant_name;
    req.restaurant_address = restaurant_address;
    req.user_id = user_id;
    req.restaurant_id = restaurant_id;
    req.location = [restaurant_longitude, restaurant_latitude];
    next();
  } else {
    console.log("error");
    next(error);
  }
}
router.use((err, req, res, next) => {
  console.error(err); // 在控制台输出错误信息
  req.files.forEach((file) => {
    const filepath = path.join(postMediaFolder, file.filename);
    fs.unlink(filepath, (err) => {
      if (err) {
        console.error("删除文件时出错：", err);
        return;
      }
      console.log("文件删除成功");
    });
  });
  console.log(error);
  req.io.emitUploadTaskFinished(req.socket_id, false);
  res.status(500).json({ message: "Internal server error" }); // 返回500状态码和错误信息给客户端
  res.end();
});

module.exports = router;
