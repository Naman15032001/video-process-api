var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
const PORT = process.env.PORT || "5555";
require('dotenv').config()

var videoRouter = require("./routes/video");

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", videoRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).json({
    error: "Unable to find the requested resource!",
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


app.listen(parseInt(PORT, 10), () => {
  console.log(`Listening on ${PORT}`);
});

module.exports = app;
