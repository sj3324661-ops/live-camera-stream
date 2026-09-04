const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const users = room ? room.size : 0;

    // Maximum 2 phones in one room
    if (users >= 2) {
      socket.emit("room-full");
      return;
    }

    socket.join(roomId);

    socket.emit("joined-room", {
      roomId,
      isInitiator: users === 0
    });

    if (users === 1) {
      socket.to(roomId).emit("peer-joined");
    }

    console.log(
      `${socket.id} joined room ${roomId}`
    );
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit(
      "offer",
      data.offer
    );
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit(
      "answer",
      data.answer
    );
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit(
      "ice-candidate",
      data.candidate
    );
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("peer-left");
  });

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
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
