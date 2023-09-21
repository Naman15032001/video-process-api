var express = require("express");
var router = express.Router();
const VideoController = require("../core/controllers/video.controller");
const API_GROUP = "/api/v1";

router.post(API_GROUP + "/process-video", (...args) =>
    new VideoController().process_video(...args)
);

module.exports = router;
