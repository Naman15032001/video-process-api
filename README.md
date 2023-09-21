# video-process-api

## To run
```
  update env variables in .env
  npm install
  ffmpeg need to be installed in your machine
  npm start
```

## Curl
```
  curl --location 'http://localhost:5555/api/v1/process-video' \
  --header 'Content-Type: application/json' \
  --data '{
      "key":"6455254d6d7a99da23d80411/645525590505d048c8f8d424/%23Reel+2.mp4"
  }'
```
