const Controller = require("../controllers/controller");
const fs = require("fs");
const https = require("https");
const ffmpeg = require("fluent-ffmpeg");
const util = require("util");
const ffprobe = util.promisify(ffmpeg.ffprobe);
const { google } = require('googleapis');
const credentials = require('/home/naman/Desktop/process-video/client_secret.json');
const { logger } = require("../lib/log");

class VideoService {

  async process_video(input) {
    logger.info('VideoService -> process_video -> started');
    let s3_key = input.key;
    if (!s3_key) {
      let e = Controller.get_error("badRequest", "S3 Bucket key is required");
      throw e;
    }
    let video_path = await this.download_video(s3_key);
    let trimmed_video_path = await this.trim_video(video_path);
    await this.upload_video(trimmed_video_path)
    logger.info('VideoService -> process_video -> ended');
  }

  async upload_video(trimmed_video_path) {
    logger.info('VideoService -> upload_video -> started');
    const youtube = await this.initialize_youtube_client()
    try {
      const res = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: {
          snippet: {
            title: 'Dummy Title',
            description: 'Dummy Video Description',
          },
          status: {
            privacyStatus: 'private',
          },
        },
        media: {
          body: fs.createReadStream(trimmed_video_path),
        },
      });

      logger.info('VideoService -> upload_video -> success', res.data);
    } catch (e) {
      logger.info('Error uploading video:', e);
      throw Controller.get_error("internalError", `Error uploading video:`);
    }
  }

  async initialize_youtube_client() {
    logger.info('VideoService -> initialize_youtube_client -> started')
    try {
      const { client_secret, client_id, redirect_uris } = credentials.web;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      console.log(process.env.REFRESH_TOKEN)
      oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
      // Set up a YouTube API client.
      const youtube = google.youtube({
        version: 'v3',
        auth: oAuth2Client,
      });
      return youtube;
    } catch (error) {
      logger.info('VideoService -> initialize_youtube_client -> failed',error);
      throw Controller.get_error("internalError", `Error initialising youtube client:`);
    }
  }

  async download_video(s3_key) {
    logger.info('VideoService -> download_video -> started')
    const download_path =
      process.env.DOWNLOAD_FOLDER + `${Date.now()}.mp4`;

    const s3_url = process.env.BASE_S3_URI + s3_key;

    try {
      const write_stream = fs.createWriteStream(download_path);
      await this.make_get_request(s3_url, write_stream);
      logger.info(`VideoService -> video_downloaded -> ${download_path}`)
    } catch (error) {
      logger.info(`VideoService -> video_download failed`, error)
      throw Controller.get_error("internalError", `Error downloading video:`);
    }
    return download_path;
  }

  async make_get_request(s3_url, write_stream) {
    logger.info('VideoService -> make_get_request -> started')
    return new Promise((resolve, reject) => {
      https
        .get(s3_url, (response) => {
          if (response.statusCode === 200) {
            response.pipe(write_stream);
            write_stream.on("finish", () => {
              write_stream.close();
              resolve();
            });
          } else {
            reject(response);
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  async trim_video(input_file_path) {
    logger.info('VideoService -> trim_video -> started')
    try {
      // Get the duration of the input video using ffprobe
      const metadata = await ffprobe(input_file_path);
      const duration = metadata.format.duration;

      const output_file_path = input_file_path.split(".")[0] + "_tr" + ".mp4";

      logger.info(`VideoService -> trim_video -> video duration is -> ${duration}`)

      await this.run_command(input_file_path, output_file_path, duration)

      // Create a fluent-ffmpeg command to trim the video
      logger.info(`VideoService -> trim_video -> success`)
      return output_file_path;
    } catch (err) {
      logger.info(`VideoService -> trim_video -> Error trimming video:`,err)
      throw Controller.get_error("internalError", `Error trimming video:`);
    }
  }

  async run_command(input_file_path, output_file_path, duration) {
    return new Promise((resolve, reject) => {
      const command = ffmpeg(input_file_path)
        .setStartTime(0) // Start at the beginning
        .setDuration(duration / 2) // Trim to half the duration
        .output(output_file_path)
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err)
        });
      command.run();
    })
  }

}
module.exports = VideoService;
