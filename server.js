const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", (socket) => {

  console.log("Connected:", socket.id);

  // JOIN ROOM
  socket.on("join-room", (roomId) => {

    if (!roomId) return;

    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? room.size : 0;

    // सिर्फ 2 फोन
    if (users >= 2) {

      socket.emit("room-full");

      console.log(
        "Room full:",
        roomId
      );

      return;
    }

    socket.join(roomId);

    console.log(
      socket.id,
      "joined:",
      roomId
    );

    // पहले फोन को बताओ कि दूसरा फोन आ गया
    if (users === 1) {

      socket.to(roomId).emit(
        "peer-joined"
      );

    }

    // दोनों फोन को room information
    socket.emit(
      "room-joined",
      {
        roomId: roomId,
        users: users + 1
      }
    );

  });


  // WEBRTC OFFER
  socket.on("offer", (data) => {

    if (!data || !data.roomId) return;

    socket.to(
      data.roomId
    ).emit(
      "offer",
      data.offer
    );

  });


  // WEBRTC ANSWER
  socket.on("answer", (data) => {

    if (!data || !data.roomId) return;

    socket.to(
      data.roomId
    ).emit(
      "answer",
      data.answer
    );

  });


  // ICE CANDIDATE
  socket.on("ice-candidate", (data) => {

    if (!data || !data.roomId) return;

    socket.to(
      data.roomId
    ).emit(
      "ice-candidate",
      data.candidate
    );

  });


  // CAMERA / MIC STATE
  socket.on("media-state", (data) => {

    if (!data || !data.roomId) return;

    socket.to(
      data.roomId
    ).emit(
      "media-state",
      data.state
    );

  });


  // DISCONNECT
  socket.on("disconnect", () => {

    console.log(
      "Disconnected:",
      socket.id
    );

  });

});


const PORT =
  process.env.PORT || 10000;


server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);
