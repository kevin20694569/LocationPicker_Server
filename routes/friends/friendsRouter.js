const express = require('express');
const router = express.Router();
const friendsDBNeo4j = require("../../util/neo4j/friendsDBNeo4j.js");
const FriendShipsService = new friendsDBNeo4j.Neo4j_FriendShipsService();

router.get('/:id', async (req, res) => {
    try {
    let user_id = req.params.id
    let results = await FriendShipsService.searchFriendsByUserID(user_id)
    let json = friendsDBNeo4j.transFormToJSONNeo4jResults(results, 'friends')
    res.json(json)
    } catch (error) {
        res.send(error.message)
    } finally {
        res.end()
    }
})


module.exports = router