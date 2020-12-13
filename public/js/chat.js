function createUserMessage(payload) {
  var msgUser = payload.user;
  var msgText = payload.message;
  var descText = payload.deskripsi;
  var msgTS = payload.ts;
  var isiOptionText = payload.isioptions;
  var msgMoment = moment(msgTS).format("HH:mm:ss a");
  var msgType = payload.type;
  var msgPos = payload.position || !(payload.user == "Pengguna");

  var userImg = document.createElement("img");
  userImg.setAttribute("class", "img-circle");
  userImg.setAttribute("alt", "User Avatar");
  if (!msgPos) userImg.setAttribute("src", "img/client.png");
  else userImg.setAttribute("src", "img/islamic-calendar.png");

  var chatImg = document.createElement("span");
  if (!msgPos) chatImg.setAttribute("class", "chat-img pull-left");
  else chatImg.setAttribute("class", "chat-img pull-right");
  chatImg.appendChild(userImg);

  var msgTxt = document.createElement("p");

  var descMsgTxt = document.createElement("p");

  var ul = document.createElement("ul");
  ul.className = "ulbtn";

  var divul = document.createElement("div");

  productList = [
    "Electronics Watch",
    "House wear Items",
    "Kids wear",
    "Women Fashion",
  ];

  if (msgType == "audio") {
    var msgAudio = document.createElement("audio");
    msgAudio.setAttribute("controls", true);
    msgAudio.setAttribute("autoplay", true);
    msgAudio.setAttribute("src", msgText);
    msgAudio.setAttribute("type", "audio/ogg;codecs=opus");
    msgTxt.appendChild(msgAudio);
  } else if (msgType == "option") {
    var message = document.createTextNode(msgText);
    var description = document.createTextNode(descText);

    msgTxt.appendChild(message);
    descMsgTxt.appendChild(description);
    ul.setAttribute("id", "proList");
    divul.appendChild(ul);

    isiOptionText.forEach(renderProductList);
  } else {
    // var message = document.createTextNode(msgText);
    msgTxt.innerHTML = msgText;
    // msgTxt.appendChild(message);
  }

  var user = document.createTextNode(msgUser + " | " + msgMoment);
  var msgTime = document.createElement("div");
  if (!msgPos) msgTime.setAttribute("class", "chat-time pull-right");
  else msgTime.setAttribute("class", "chat-time pull-left");
  msgTime.appendChild(user);

  var msgBox = document.createElement("div");
  if (!msgPos) {
    msgBox.setAttribute("class", "chat-body left clearfix");
    msgBox.appendChild(msgTxt);
    msgBox.appendChild(msgTime);
  } else {
    msgBox.setAttribute("class", "chat-body right clearfix");
    msgBox.appendChild(msgTxt);
    if (descText !== "") {
      msgBox.appendChild(descMsgTxt);
    }
    msgBox.appendChild(divul);

    // productList.forEach(renderProductList);
    msgBox.appendChild(msgTime);
  }

  var chatBox = document.createElement("li");
  chatBox.setAttribute("id", "msg" + msgTS);
  chatBox.setAttribute("class", "left clearfix");
  chatBox.appendChild(chatImg);
  chatBox.appendChild(msgBox);

  var chatArea = document.querySelector(".chat-area");
  var chatList = document.querySelector("ul");
  chatList.appendChild(chatBox);
  chatArea.scrollTop = chatArea.scrollHeight;

  function renderProductList(element, msg, index, arr) {
    // var li = document.createElement("li");
    // li.setAttribute("id", "myLi");

    // ul.appendChild(li);

    // var t = document.createTextNode(element);

    // li.innerHTML = li.innerHTML + element;

    var li = document.createElement("li");
    // li.appendChild(document.createTextNode(element));
    var button = document.createElement("button");
    button.innerHTML = element.label;

    button.onclick = function () {
      // alert(element.value.input.text);

      var payload = {
        user: "Pengguna",
        message: element.value.input.text,
        ts: new Date().getTime(),
      };

      createUserMessage(payload);
      socket.emit("sendmsg", payload);
      message.value = "";
      return false;
    };
    li.appendChild(button);
    li.setAttribute("id", element);
    ul.appendChild(li);
    button.className = "btn";
    li.className = "listbtn";
  }
}

var socket = io("/");
socket.on("connect", function () {
  socket.on("replymsg", function (msg) {
    if (msg.type == "audio") {
      var reqURL = "/api/v1/synthesize?download=true&text=" + msg.message;
      fetch(reqURL).then((response) => {
        if (response.ok) {
          response.blob().then((blob) => {
            const audioURL = window.URL.createObjectURL(blob);
            txtMessage = msg.message;
            msg.message = audioURL;
            createUserMessage(msg);
            var elm = document.querySelector("#msg" + msg.ts + " .chat-body p");
            var msgBox = document.createElement("p");
            msgBox.innerHTML = "<i>" + txtMessage + "</i>";
            elm.parentNode.insertBefore(msgBox, elm.nextSibling);
          });
        } else {
          console.log(response);
        }
      });
    } else {
      createUserMessage(msg);
      console.log("Isi Message", msg);
    }
  });

  socket.on("transcript", function (msg) {
    var elm = document.querySelector("#msg" + msg.ts + " .chat-body p");
    var msgBox = document.createElement("p");
    msgBox.innerHTML = "<i>" + msg.message + "</i>";
    elm.parentNode.insertBefore(msgBox, elm.nextSibling);
    msg.type = "audio";
    socket.emit("sendmsg", msg);
  });
});

function sendAudioMessage(blob, timestamp) {
  var file = blob;
  var stream = ss.createStream();
  // upload a file to the server.
  ss(socket).emit("recognize", stream, { ts: timestamp });
  ss.createBlobReadStream(file).pipe(stream);
}

function sendMessage() {
  var message = document.getElementById("message");
  var payload = {
    user: "Pengguna",
    message: message.value.trim(),
    ts: new Date().getTime(),
  };
  createUserMessage(payload);
  socket.emit("sendmsg", payload);
  message.value = "";
}

function enterMsg(event) {
  if (document.getElementById("quickMsg").checked) {
    event.preventDefault();
    if (event.keyCode == 13) sendMessage();
  }
}
