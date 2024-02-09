/*Reaction
{
  "_id": ObjectId("..."),
  "post_id": "post123", : String
  "user_id": "user456", : String
  "reaction": "like",  : String  //  null  "", "", "", "", ""
  "liked": true, : Bool              
  "updated_at": : Date   
}
 
Post '/reactions/`{post_id} //創建/修改reaction一條row
body: Json {
    user_id,
    reaction
    liked
}
// 發現即將改變的"reaction"  : null && "liked : false 就直接讓database刪除

Get '/reactions/`{post_id}` // 查詢該貼文的reactions

post 
Add
{
    "reactions": {
        "like": 10,
        "love": 2,
        "vomit": 5,
        "angry": 3,
        "sad": 1,
        "surprise : 4
        }
}*/

/*"opening_hours" : {
  "mon" : [
    { "open" :  1000,
      "close" : 1400
    }
  ],
  "tues" : [
    {
      "open" :  1000,
      "close" : 1400
    },
    {
      "open" : 1700,
      "close" : 2200
    }
  ]
}*/
