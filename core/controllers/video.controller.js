const Controller = require("./controller");
const VideoService = require("../services/video-service");
const { logger } = require("../lib/log");

class VideoController extends Controller {

   /**
   *  @api {post} /api/v1/process-video that process video
   *  @apiName post @apiVersion 1.0.0 
   *  @apiSuccessExample Success-Response: HTTP/1.1 200 OK
   *  @apiError Bad request HTTP/1.1 400 (Validation failed)
   *  @apiError Internal error HTTP/1.1 500
   *
   * */
  async process_video(req, res, next) {
    logger.info("VideoController -> process_video -> started");
    try {
      const input = req.body;
      const vs = new VideoService();
      const result = await vs.process_video(input);
      this.send_response(res, "success", result);
    } catch (error) {
      this.handle_error_response(error, res, next);
    }
  }
}

module.exports = VideoController;
