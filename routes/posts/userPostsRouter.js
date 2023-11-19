const express = require('express')
const router = express.Router()
const Mongodb_postsCollectionService = require("../../util/mongoose/postsCollection.js")
const postsCollectionService = new Mongodb_postsCollectionService()

router.get('/:id', async (req, res) => {
    try {
    let id = req.params.id
    let { date } = req.query
    if (date == undefined || date == "" || date == null) {
        date = new Date();
      } else {
        date = new Date(date);
      }
    let results = await postsCollectionService.getPostsByUserID(id, date)
    if (results.length > 0) {
        res.json(results)
    } else {
        res.json([])
        throw new Error("沒有results")
    }
    res.end()
    } catch (error) {
        console.log(error.message)
        res.end()
    }
}) 

module.exports = router