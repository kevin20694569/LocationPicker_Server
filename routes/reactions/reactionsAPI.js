const express = require("express");
const router = express.Router();
const reactionsRouter = require("./reactionsRouter");

router.use("/", reactionsRouter);

module.exports = router;
