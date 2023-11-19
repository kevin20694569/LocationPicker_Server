const redis = require("redis");
const redisclient = redis.createClient(6379);
function connect() {
  redisclient.connect();
}
redisclient.on("connect", function () {
  console.log("成功連接到 Redis 伺服器");
});

module.exports = {
    connect
};
