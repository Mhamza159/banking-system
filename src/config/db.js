const mongoose = require("mongoose");
const dns = require("dns");

// Set public DNS to resolve MongoDB Atlas SRV records if local ISP DNS blocks/refuses them
dns.setServers(["8.8.8.8", "8.8.4.4"]);

function connectDB() {
  return mongoose.connect(process.env.MONGO_URI);
}

module.exports = connectDB;
