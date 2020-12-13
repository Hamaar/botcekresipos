const dotenv = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
var watson = require("./util/watson");

//Route files
const index = require("./routes/index");
const app = express();
dotenv.config({ path: "./config/config.env" });

//Mount the router
app.use("/api/v1", index);

app.use("/", express.static("public"));

const PORT = process.env.PORT;
const server = app.listen(
  PORT,
  console.log(`Server running on port ${PORT}`.yellow)
);

//Handel unhandled promise rejections
process.on("unhandledRejection", (err, Promise) => {
  console.log(`Error  ${err.message}`.red);
  //close server & exit process
  server.close(() => process.exit(1));
});

var io = require("socket.io")(server);
var ss = require("socket.io-stream");
const { options } = require("./routes/index");
io.on("connection", function (socket) {
  console.log("Connected");

  var context = {};
  socket.on("sendmsg", function (data) {
    watson.message(data.message, context, function (err, res) {
      if (!err) {
        //console.log(res);
        context = res.result.context;
        console.log("Isi respon Message", res.result.output);
        console.log("Respon title", res.result.output.generic[0].title);
        console.log("Respon desc", res.result.output.generic[0].description);
        console.log("Respon options", res.result.output.generic[0].options);

        if (res.result.output.generic.length > 0) {
          switch (res.result.output.generic[0].response_type) {
            case "text":
              // It's a text response, so we just display it.
              conversation_response = res.result.output.generic[0].text;
              desc_response = "";
              options_response = "";
              break;
            case "option":
              // It's an option response, so we'll need to show the user
              // a list of choices.
              conversation_response = res.result.output.generic[0].title;
              desc_response = res.result.output.generic[0].description;
              options_response = res.result.output.generic[0].options;
              // List the options by label.
              for (let i = 0; i < options_response.length; i++) {
                console.log(
                  (i + 1).toString() + ". " + options_response[i].label
                );
              }
              break;
          }

          // if (Array.isArray(res.result.output.generic))
          //   conversation_response = res.result.output.generic[0].title;
          // //.join(' ').trim();

          // if (conversation_response) {
          var payload = {
            user: "Bot Jadwal Sholat",
            message: conversation_response,
            deskripsi: desc_response,
            isioptions: options_response,
            ts: new Date().getTime(),
            type: res.result.output.generic[0].response_type,
          };
          socket.emit("replymsg", payload);
          // }
        }
      }
    });
  });

  ss(socket).on("recognize", function (stream, data) {
    watson.recognize(
      stream,
      function (err) {
        console.log("Error:", err);
      },
      function (res) {
        var transcript = res;
        socket.emit("transcript", { message: transcript, ts: data.ts });
        console.log(JSON.stringify(res, null, 2));
      }
    );
  });
});
