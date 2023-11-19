const express = require("express");
const router = express.Router();
const multer = require("multer");
const mysqlRestaurantsTableService = require('../../util/mysql/restaurantsTabel.js');
const restaurantTableService = new mysqlRestaurantsTableService()
const shortid = require("short-uuid");
const mime = require('mime');
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js")
const postsCollectionService = new Mongodb_postsCollectionService()
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/media/postmedia');
  },
  filename: function (req, file, cb) {
    const shortUUID = shortid();
    const uuid = shortUUID.new();
    const mimeType = mime.lookup(file.mimetype);
    let ext = "";
    if (mimeType.startsWith("image/")) {
      ext = '.jpg'
    } else if (mimeType.startsWith('video/')) {
      ext = '.mp4'
    }
    console.log(uuid + ext)
    cb(null, uuid + ext);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制 100 MB
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.match(/^image|video\//)) {
      callback(new Error("檔案格式錯誤"));
    } else {
      callback(null, true);
    }
  },
});


router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let data = await postsCollectionService.getPostFromID(id);
    res.json(data);
  } catch (error) {
    res.status(404).send(error.message)
    console.log(error);
  }
  res.end();
});

router.post("/", upload.array(`media`, 5), findRestaurantIDmiddleware, async (req, res, next) => {
    try {
    let files = req.files;
    if (files == undefined) {
      throw new Error("沒有選擇檔案上傳");
    }
    let media_data = [];
    files.forEach((value, index, array) => {
      const filename = `${value.filename}`;
      if (req.post_itemtitles[index] == "") {
        req.post_itemtitles[index] = null;
      }
      let object = {
        media_id: filename,
        itemtitle: req.post_itemtitles[index],
        _id : null
      };
      media_data.push(object);
    });
    if (media_data.length < 1) {
      throw new Error("沒有上傳影像 新建Post失敗");
    }
    let result = await postsCollectionService.insertPost(
      req.post_content,
      media_data,
      req.user_id,
      req.restaurant_id
    );
    res.status(200).send("插入成功")
    } catch (error) {
      res.end(error.message)
      return
    }
    res.end();
  }
);

async function findRestaurantIDmiddleware(req, res, next) {
  try {
    let json = JSON.parse(req.body.json);
    let {
      user_id,
      post_content,
      restaurant_address,
      post_itemtitles,
      restaurant_name,
      restaurant_ID,
      grade,
    } = json;

    if (restaurant_name == undefined || restaurant_address == undefined) {
      res.status(400);
    }

    let restaurant_id = await restaurantTableService.findrestaurantIDByMySQL(
      restaurant_ID
    );

    if (restaurant_id) {
      req.post_content = post_content;
      req.grade = grade;
      req.post_itemtitles = post_itemtitles;
      req.restaurant_name = restaurant_name;
      req.restaurant_address = restaurant_address;
      req.user_id = user_id;
      req.restaurant_id = restaurant_id;
      next();
    } else {
      throw new Error("未預期的錯誤")
    }
  } catch (error) {
    res.status(404)
    res.end(error.message);
    console.log(error);
  }
}






module.exports = router;
