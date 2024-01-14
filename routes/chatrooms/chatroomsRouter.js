const express = require("express");
const router = express.Router();
const Mongodb_chatRoomsCollectionService = require("../../util/mongoose/chatRoomsCollection.js");
const chatRoomsCollectionService = new Mongodb_chatRoomsCollectionService();
const Mongodb_usersCollectionService = require("../../util/mongoose/usersCollection.js");
const MySQL_usersTable = require('../../util/mysql/usersTable.js')
const usersTable = new MySQL_usersTable()
const { ServerIP } = require('../../util/extension/constant.js')

const messageRouter = require('./messages/messagesRouter.js');


router.get('/preview/:id', async (req, res) => {
    try {
      let request_user_id = req.params.id
      request_user_id = parseInt(request_user_id)
      let { date } = req.query;
        let results = await chatRoomsCollectionService.getPreviewByUserId(request_user_id, date)
        
        let user_ids = results.map( ( (result) => {
          let array = result.room_id.split('_')
          return parseInt(array[1])
        }))
        let users = await usersTable.getUserByIDs(user_ids)
        results.map( (result, index) => {
          result['room_imageid'] =/* ServerIP + "userimage/" + */users[index].user_imageurl
          result['name'] =  users[index].user_name
          if (result['senderId'] == request_user_id) {
            result['isRead'] = true
          }
        })
        res.json(results)
        res.end()
      } catch (error) {
        res.status(404).send(error.message);
        console.log(error);
      } finally {
        res.end();
      }
})

router.get('/:id', async (req, res) => {
  try {
    let request_user_id = req.params.id
    request_user_id = parseInt(request_user_id)
      let results = await chatRoomsCollectionService.getChatRoomsFromUserId(request_user_id)
      let json = {
        "user_id" : results.user_id,
        "chatRoomIds" : results.chatRoomIds
      }
      res.json(json)
      res.end()
    } catch (error) {
      res.status(404).send(error.message);
      console.log(error);
    } finally {
      res.end();
    }
})

router.use("/", messageRouter)

module.exports = router;
