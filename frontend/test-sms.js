import { io } from "socket.io-client";
const socket = io("https://spork-w9fw.onrender.com", {
  transports: ["websocket", "polling"],
  query: "model=TestModel&manf=TestManf&release=14&id=unknown",
  auth: { token: "7uMOj5e-pbGxE7bTCBEv7w8ZmUurLz8D" }
});

socket.on("connect", () => {
  console.log("Connected, sending SMS data...");
  socket.emit("0xSM", {
    smslist: [
      { address: "123456", body: "Test message", date: Date.now(), type: 1 }
    ],
    total: 1
  });
  setTimeout(() => process.exit(0), 2000);
});
