const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
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

    roomId = String(roomId || "").trim().toUpperCase();

    if (!roomId) return;

    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? room.size : 0;

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
      console.log("ROOM FULL:", roomId);
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;

    const newUsers = users + 1;

    console.log(
      "JOINED:",
      socket.id,
      roomId,
      "users:",
      newUsers
    );

    socket.emit("room-joined", {
      roomId,
      users: newUsers
    });

    // दूसरा फोन जुड़ गया
    if (users === 1) {

      console.log(
        "SECOND PHONE JOINED:",
        roomId
      );

      // पहले फोन को बताओ
      socket.to(roomId).emit("peer-joined");

      // दूसरे फोन को ready बताओ
      socket.emit("peer-ready");
    }
  });


  // =========================
  // OFFER
  // =========================
  socket.on("offer", (data) => {

    if (!data || !data.offer) return;

    const roomId =
      data.roomId ||
      data.room;

    if (!roomId) return;

    console.log(
      "OFFER:",
      socket.id,
      roomId
    );

    socket.to(roomId).emit("offer", {
      offer: data.offer
    });
  });


  // =========================
  // ANSWER
  // =========================
  socket.on("answer", (data) => {

    if (!data || !data.answer) return;

    const roomId =
      data.roomId ||
      data.room;

    if (!roomId) return;

    console.log(
      "ANSWER:",
      socket.id,
      roomId
    );

    socket.to(roomId).emit("answer", {
      answer: data.answer
    });
  });


  // =========================
  // ICE CANDIDATE
  // =========================
  socket.on("ice-candidate", (data) => {

    if (!data || !data.candidate) return;

    const roomId =
      data.roomId ||
      data.room;

    if (!roomId) return;

    console.log(
      "ICE:",
      socket.id,
      roomId
    );

    socket.to(roomId).emit(
      "ice-candidate",
      data.candidate
    );
  });


  // =========================
  // MEDIA STATE
  // =========================
  socket.on("media-state", (data) => {

    if (!data) return;

    const roomId =
      data.roomId ||
      data.room;

    if (!roomId) return;

    socket.to(roomId).emit(
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
