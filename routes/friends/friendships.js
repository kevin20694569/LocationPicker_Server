var express = require("express");
var router = express.Router();
const neo4jdb = require("../../util/neo4j/friendsDBNeo4j.js");
const { ResultSummary } = require("neo4j-driver");
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();


router.post("/accept/:id", async (req, res) => {
  try {
    let { user_id } = req.body;
    let request_id = req.params.id;
    let results = await FriendShipsService.acceptToCreateFriendship(
      user_id,
      request_id
    );
    let json = neo4jdb.transFormToJSONNeo4jResults(results, 'friendship')
    res.json(json[0]);
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  } finally {
    res.end();
  }
});

router.delete('/', async (req, res) => {
  try {
    let { from_user_id, to_user_id } = req.body;
    let results = await FriendShipsService.deleteFriendShip(from_user_id, to_user_id)
    
    if (results.records.length > 0) {
      res.status(200).send('刪除成功')
    } else {
      throw new Error('預期外的錯誤')
    }
  } catch (error) {
    res.status(404).send(error.message);
    console.log(error.message);
  } finally {
    res.end();
  }

})

module.exports = router;
