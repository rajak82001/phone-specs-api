const { MongoClient } = require("mongoose/node_modules/mongodb");

const uri = "mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.mhzckrv.mongodb.net/?retryWrites=true&w=majority";

try {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("MongoClient created successfully");
} catch (error) {
  console.error("Parser error:", error.message);
}