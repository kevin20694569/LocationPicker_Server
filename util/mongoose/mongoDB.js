const mongoose = require('mongoose')

const mongodb = mongoose.createConnection('mongodb://127.0.0.1:27017/locationpicker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.once('open', () => {
    console.log("mongodb連接成功")
})
mongoose.connection.on('error', () => {
    console.log("mongodb連接失敗")
})
mongoose.connection.on('close', () => {
    console.log('mongodb連接關閉')
})
module.exports = mongodb