import { io } from "socket.io-client";
const socket = io("https://spork-w9fw.onrender.com", {
  transports: ["websocket", "polling"],
  query: "model=TestModel&manf=TestManf&release=14&id=unknown",
  auth: { token: "7uMOj5e-pbGxE7bTCBEv7w8ZmUurLz8D" }
});

socket.on("connect", () => {
  console.log("SUCCESS! Android simulator connected and authenticated!");
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("FAILED to connect:", err.message);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.error("DISCONNECTED:", reason);
  process.exit(1);
});
