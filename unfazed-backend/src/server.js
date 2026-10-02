require("dotenv").config({ override: true });
console.log(
  "Razorpay config:",
  !!process.env.RAZORPAY_KEY_ID,
  !!process.env.RAZORPAY_KEY_SECRET
);
const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const connectDB = require("./config/db");

const sessionNoteRoutes = require("./routes/sessionNoteRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const packageRoutes = require("./routes/packageRoutes");
const clientPackageRoutes = require("./routes/clientPackageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before starting the server
    await connectDB();

    // Existing routes
    app.use(
      "/api/session-notes",
      sessionNoteRoutes
    );

    app.use("/api/payments", paymentRoutes);

    app.use("/api/packages", packageRoutes);

    app.use(
      "/api/client-packages",
      clientPackageRoutes
    );

    app.use(
      "/api/notifications",
      notificationRoutes
    );

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    // Socket.IO connection
    io.on("connection", (socket) => {
      console.log(
        "Socket connected:",
        socket.id
      );

  // =========================
  // JOIN PRIVATE USER ROOM
  // =========================
  socket.on("joinRoom", ({ userId, role }) => {
    if (!userId || !role) {
      return;
    }

    const roomName = `${role}:${userId}`;

    socket.join(roomName);

    console.log(
      `Socket ${socket.id} joined room ${roomName}`
    );
  });

  // =========================
  // SEND REAL-TIME MESSAGE
  // =========================
  socket.on(
    "sendMessage",
    ({
      senderId,
      senderRole,
      receiverId,
      receiverRole,
      message,
    }) => {
      if (
        !senderId ||
        !senderRole ||
        !receiverId ||
        !receiverRole ||
        !message?.trim()
      ) {
        return;
      }

      const receiverRoom =
        `${receiverRole}:${receiverId}`;

      io.to(receiverRoom).emit(
        "newMessage",
        {
          senderId,
          senderRole,
          receiverId,
          receiverRole,
          message: message.trim(),
          createdAt: new Date(),
        }
      );
    }
  );

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    console.log(
      "Socket disconnected:",
      socket.id
    );
  });
});
    // Start server
    server.listen(PORT, () => {
      console.log(
        `UNFAZED backend running on port ${PORT}`
      );

      console.log(
        `http://localhost:${PORT}`
      );

      console.log(
        "Socket.IO server is ready"
      );
    });
  } catch (error) {
    console.error(
      "Failed to start UNFAZED backend:",
      error.message
    );

    process.exit(1);
  }
};

startServer();