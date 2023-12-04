const neo4j = require("neo4j-driver");

class Neo4j_FriendShipsService {
  static driver;
  constructor() {
    if (!Neo4j_FriendShipsService.driver) {
      this.driver = neo4j.driver(
        "neo4j://localhost:7687",
        neo4j.auth.basic("neo4j", "j1218s0725v0620")
      );
      Neo4j_FriendShipsService.instance = this;
    }
    return Neo4j_FriendShipsService.instance;
  }

  async close() {
    await this.driver.close();
  }
  async createSession() {
    return this.driver.session();
  }

  async createUser(user_id, user_name) {
    try {
      this.session = await this.createSession();
      let query = `
        MERGE (user:User {
          user_ID: $user_id,
          name : $user_name
        }) RETURN user
      `;
      let results = await this.session.run(query, {
        user_id,
        user_name,
      });
      if (results.records.length <= 0) {
        throw new Error("創建User失敗");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }

  async sendFriendRequest(from_user_id, to_user_id) {
    try {
      this.session = await this.createSession();
      if (from_user_id == to_user_id) {
        throw new Error("不得寄好友邀請給自己");
      }
      let query = `
      MATCH (user1:User {user_ID: $from_user_id})
      MATCH (user2:User {user_ID: $to_user_id})
      OPTIONAL MATCH (user1)-[*1]-(request:FriendRequest)-[*1]-(user2)
      OPTIONAL MATCH (user1)-[*1]-(friendship:Friendship)-[*1]-(user2)
      
      WITH user1, user2, request, friendship
      WHERE request IS NULL AND friendship IS NULL
      CREATE (user1)-[:SENT_FRIEND_REQUEST]->(newRequest:FriendRequest {sent_time: apoc.date.toISO8601(datetime().epochMillis, "ms")})
      CREATE (newRequest)-[:TO_USER]->(user2)
      RETURN newRequest as request ;
      `;

      let results = await this.session.run(query, {
        from_user_id,
        to_user_id,
      });
      console.log(results)
      if (results.records.length <= 0) {
        throw new Error("寄送邀請失敗");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }

  async acceptToCreateFriendship(accept_user_id, friend_request_id) {
    this.session = await this.createSession();
    accept_user_id = parseInt(accept_user_id)
    friend_request_id = parseInt(friend_request_id)
    try {
      let query = `
      MATCH (user2: User { user_ID : $accept_user_id })
      OPTIONAL MATCH (user1:User)-[:SENT_FRIEND_REQUEST]->(request:FriendRequest)-[:TO_USER]->(user2)
      WITH user1, user2, request
      WHERE id(request) = $friend_request_id
      WITH user1, user2, request
      CREATE (user1)-[:USER1]->(friendship:Friendship {friendship_time: apoc.date.toISO8601(datetime().epochMillis, "ms")})-[:USER2]->(user2)
      WITH request, friendship
      DETACH DELETE request
      return friendship;
      `;
      let results = await this.session.run(query, {
        accept_user_id,
        friend_request_id,
      });
      if (results.records.length <= 0) {
        throw new Error("接受邀請失敗");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }

  async searchFriendsByUserID(user_id) {
    try {
      user_id = parseInt(user_id);
      this.session = await this.createSession();
      let query = `
        MATCH (u:User)-[*1]-(friendship:Friendship)-[*1]-(friends:User)
        WHERE u.user_ID = $user_id
        RETURN friends
      `;
      let results = await this.session.run(query, { user_id });
      if (results.records.length <= 0) {
        throw new Error("沒有朋友");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }

  async searchFriendRequestsByUserID(user_id, date) {
    user_id = parseInt(user_id);
    if (date) {
    } else {
      date = new Date().toISOString();
    }

    try {
      this.session = await this.createSession();
      let query = `
      MATCH (u: User)-[:SENT_FRIEND_REQUEST]->(f:FriendRequest)-[*1]->(user2: User { user_ID : $user_id}) 
      WHERE f.sent_time < $date
      RETURN u AS from_user , f AS request;
      `;
      let results = await this.session.run(query, { user_id, date });
      if (results.records.length <= 0) {
        throw new Error("沒有任何邀請");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }
  async deleteFriendShip(from_user_id, to_user_id) {
    try {
      this.session = await this.createSession();
      let query = `
      MATCH (from_user : User {user_ID: $from_user_id})-[from:USER1|USER2]-(friendship:Friendship)-[to:USER1|USER2]-(to_user :User {user_ID: $to_user_id})
      DELETE from, to, friendship
      Return from_user, to_user;      
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id });
      if (results.records.length <= 0) {
        throw new Error("刪除朋友失敗");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }

  async deleteFriendRequest(from_user_id, to_user_id) {
    try {
      this.session = await this.createSession();
      let query = `
      MATCH (from_user : User {user_ID: $from_user_id})-[from: SENT_FRIEND_REQUEST]-(request: FriendRequest)-[to: TO_USER]-(to_user :User {user_ID: $to_user_id})
      DELETE from, to, request
      Return from_user, to_user;      
      `;
      let results = await this.session.run(query, { from_user_id, to_user_id });
      console.log(results)

      if (results.records.length <= 0) {
        throw new Error("刪除朋友邀請失敗");
      }
      return results;
    } catch (error) {
      throw error;
    } finally {
      this.session.close();
    }
  }
  
}



function transFormToJSONNeo4jResults(searchResults, key) {
  try {
    let results = searchResults.records.map((record) => {
      var result = record.get(`${key}`);
      let id = (result.identity.high << 32) + result.identity.low;
      let json = {
        [`${key}_ID`]: id,
        ...result.properties,
      };
      return json;
    });
    return results;
  } catch {
    throw new Error("transform results 失敗");
  }
}

module.exports = {
  Neo4j_FriendShipsService,
  transFormToJSONNeo4jResults
};
