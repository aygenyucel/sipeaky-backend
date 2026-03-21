
import  dotenv  from 'dotenv';
import { disconnect } from 'mongoose';
import { io } from './../server.js';
import { scheduleRoomDeletion, cancelRoomDeletion } from "./roomTimeoutManager.js";
import RoomsModel from "./../api/rooms/model.js"

dotenv.config();


export const newConnectionHandler = (socket) => {
  socket.emit("clientId", socket.id);

  socket.on("join-room", async (payload) => {
    const { peerID, userID, roomEndpoint } = payload;

    socket.data.roomEndpoint = roomEndpoint;
    socket.data.userID = userID;
    socket.data.peerID = peerID;

    socket.join(roomEndpoint);
    cancelRoomDeletion(roomEndpoint);

    socket.to(roomEndpoint).emit("user-connected", {
      peerID,
      socketID: socket.id,
      userID,
      roomEndpoint,
    });
  });

  socket.on("disconnect", async () => {
    const roomEndpoint = socket.data.roomEndpoint;
    const userID = socket.data.userID;
    const peerID = socket.data.peerID;

    console.log("DISCONNECT:", socket.id, userID, "room:", roomEndpoint);

    if (!roomEndpoint) return;

    await RoomsModel.updateOne(
      { endpoint: roomEndpoint },
      { $pull: { users: userID } }
    );

    socket.to(roomEndpoint).emit("user-disconnected", {
      peerID,
      userID,
      roomEndpoint,
    });

    const room = io.sockets.adapter.rooms.get(roomEndpoint);
    const size = room ? room.size : 0;

    // console.log("👥 Remaining sockets in room:", size);

    if (size === 0) {
      // console.log(" Room empty, scheduling deletion:", roomEndpoint);
      scheduleRoomDeletion(roomEndpoint);
    }
  });

  socket.on("chatMessage", (newMessage) => {
    const roomEndpoint = socket.data.roomEndpoint;
    if (!roomEndpoint) return;

    socket.emit("message", newMessage);
    socket.to(roomEndpoint).emit("message", newMessage);
    socket.to(roomEndpoint).emit("new-message-alert", newMessage);
  });

  socket.on("kick-user", (payload) => {
    socket.to(payload.roomEndpoint).emit("you-kicked", { userID: payload.userID });
  });

  socket.on("camera-toggled", ({ userID, roomEndpoint, isCameraOn }) => {
    socket.to(roomEndpoint).emit("camera-toggled", {
        userID,
        isCameraOn
    })
})
};
