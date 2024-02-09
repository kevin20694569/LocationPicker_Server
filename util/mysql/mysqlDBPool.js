const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "j1218s0725v0620",
  database: "mysql_test",
});

class MySQLDataBase {
  constructor() {
    this.pool = pool;
    this.connection = null;
  }

  async release() {
    try {
      this.connection.release();
    } catch (error) {
      throw new Error(`關閉mysql 失敗 messgae : ${error.message}`);
    }
  }
  async getConnection() {
    try {
      this.connection = await this.pool.getConnection();
    } catch (error) {
      throw new Error(`mysql伺服器連接失敗 messag${error.message}`);
    }
  }
}
module.exports = {
  MySQLDataBase,
};
