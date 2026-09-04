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

  console.log("CONNECTED:", socket.id);

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join-room", (roomId) => {

    if (!roomId) return;

    const room =
      io.sockets.adapter.rooms.get(roomId);

    const users =
      room ? room.size : 0;

    console.log(
      "JOIN REQUEST:",
      socket.id,
      roomId,
      "users:",
      users
    );

    // Maximum 2 phones
    if (users >= 2) {

      socket.emit("room-full");

      console.log(
        "ROOM FULL:",
        roomId
      );

      return;
    }

    socket.join(roomId);

    socket.data.roomId = roomId;

    console.log(
      "JOINED:",
      socket.id,
      roomId
    );

    // Current user
    socket.emit("room-joined", {
      roomId: roomId,
      users: users + 1
    });

    // अगर दूसरा phone पहले से है
    if (users === 1) {

      console.log(
        "SECOND PHONE JOINED:",
        roomId
      );

      // पहले phone को बताओ
      socket.to(roomId).emit(
        "peer-joined"
      );

      // दूसरे phone को भी बताओ
      socket.emit(
        "peer-ready"
      );
    }

  });


  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    if (
      !data ||
      !data.roomId ||
      !data.offer
    ) {
      return;
    }

    console.log(
      "OFFER:",
      socket.id,
      data.roomId
    );

    socket.to(data.roomId).emit(
      "offer",
      data.offer
    );

  });


  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    if (
      !data ||
      !data.roomId ||
      !data.answer
    ) {
      return;
    }

    console.log(
      "ANSWER:",
      socket.id,
      data.roomId
    );

    socket.to(data.roomId).emit(
      "answer",
      data.answer
    );

  });


  // =========================
  // ICE
  // =========================
  socket.on("ice-candidate", (data) => {

    if (
      !data ||
      !data.roomId ||
      !data.candidate
    ) {
      return;
    }

    socket.to(data.roomId).emit(
      "ice-candidate",
      data.candidate
    );

  });


  // =========================
  // MEDIA STATE
  // =========================
  socket.on("media-state", (data) => {

    if (
      !data ||
      !data.roomId
    ) {
      return;
    }

    socket.to(data.roomId).emit(
      "media-state",
      data.state
    );

  });


  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    console.log(
      "DISCONNECTED:",
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
      "Server running on port " + PORT
    );

  }
);
