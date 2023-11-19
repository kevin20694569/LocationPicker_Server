const httpIP = require('../constant').ServerIP
const mysqlServer = require("./mysqlDBPool");

class mysqlUsersTableService {
  async release() {
    try {
      await this.connection.release();
    } catch (error) {
      console.log(error.message);
      throw new Error("關閉mysql 失敗");
    }
  }
  async getConnection() {
    try {
      this.connection = await mysqlServer.getConnection();
    } catch (error) {
      console.log(error.message);
      throw new Error("mysql伺服器連接失敗");
    }
  }

  async insertuser(username, imageid, email, hashPassword) {

    try {
      await this.getConnection()
      let query = `INSERT INTO users (user_name, user_imageid, user_email, user_password) VALUES (?, ?, ?, ?)`;
      let params = [username, imageid, email, hashPassword];
      let [header, fields] = await this.connection.query(query, params);
      return [header, fields];
    } catch (error) {

      throw error;
    } finally {
      await this.release()
    }
  }
  
  async selectuserfromemail(email) {
   
    try {
      await this.getConnection()
      let query = `SELECT user_email FROM users WHERE user_email = ?`;
      let params = [email];
      let [results, fields] = await this.connection.query(query, params);
  
      return [results, fields];
    } catch (error) {
      throw error; // 抛出错误
    } finally {
      await this.release()
    }
  }
  
  async selectuserfromemail(email) {
    try {
      await this.getConnection()
      let query = `SELECT * FROM users Where user_email = ?`;
      let params = [email];
      let [results, fields] = await this.connection.query(query, params);
      return [results, fields];
    } catch (error) {
      throw error;
    } finally {
      await this.release()
    }
  }
  
  async getUserPostsProfileByID(userid) {
      try {
        await this.getConnection()
        let userquery =
          "select user_id, user_name, user_imageid, user_email from users where user_id = ?";
        let userparams = [userid];
        
        let [userresults, userfileds] = await this.connection.query(userquery, userparams);
        let user = userresults[0]
        user["user_imageurl"] = httpIP + "userimage/" + `${user.user_imageid}`
        return user
      } catch (error) {
        throw error;
      } finally {
        await this.release()
      }
    }
  
  async getUserByID(user_id) {
    try {
      await this.getConnection()
      let array = user_id.join(',');
      let query = `select user_id, user_name, user_imageid from users where user_id in (?);`;
      var params = [array];
      let [results, fileds] = await this.connection.query(query, params);
      if ( results.length > 0 ) {
        return results
      }
    } catch (error) {
      throw error
    } finally {
      await this.release()
    }
  }
}



module.exports = mysqlUsersTableService
