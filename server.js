const express = require("express")
const http = require("http")
const bodyParser = require("body-parser");
const { sequelize } = require("./src/models");
const router = require("./src/routes/index");
const cors = require("cors");
require("dotenv").config();

const { setupWebSocket } = require("./src/socket/socket");


const app = express();
const server = http.createServer(app);


app.use(cors());
app.use(express.json());




app.use("/api", router);


const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("✅ DB connected");
    setupWebSocket(server);
    server.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
    });
  })
  .catch(err => {
    console.error("❌ DB connection error:", err);
  });
