const express = require("express");
const router = express.Router();
const bycript = require(`bcrypt`);
const multer = require("multer");
const path = require("path");
const mysqlUserTableService = require('../../util/mysql/usersTable.js');
const userTableService = new mysqlUserTableService()
const neo4jdb = require("../../util/neo4j/friendsDBNeo4j.js");
const Neo4jService = new neo4jdb.Neo4j_FriendShipsService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/media/userimage");
  },
  filename: function (req, file, cb) {
    let { name, ext } = path.parse(file.originalname);
    cb(null, name + "-" + Date.now() + ext);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.match(/^image\//)) {
      callback(new Error("檔案格式錯誤"));
    } else {
      callback(null, true);
    }
  },
});

router.post("/", upload.single("userimage"), async (req, res, next) => {
  const { username, email, password } = req.body;
  let imageid =
    req.file !== undefined && req.file !== null ? `${req.file.filename}` : null;
  try {
    let [results, _] = await userTableService.selectuserfromemail(email);
    if (results.length > 0) {
      throw new Error("email已被註冊過 請直接登入");
    }
    const hashPassword = await bycript.hash(password, 10);
    let [header, fields] = await userTableService.insertuser(
      username,
      imageid,
      email,
      hashPassword
    );
    let user_id = header["insertId"];
    let users = await Neo4jService.createUser(user_id, username);
    let json = neo4jdb.transFormToJSONNeo4jResults(users, 'user');
    console.log(json[0]);
    res.send("註冊成功");
  } catch (error) {
    console.log(error.message)
    res.send(error.message);
  } finally {
    res.end();
  }
});

module.exports = router;
