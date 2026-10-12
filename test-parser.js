require("dotenv").config();

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

try {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("MongoDB driver accepted the URI");

  client.close();
} catch (error) {
  console.error("Driver parser error:", error.name);
  console.error("Driver message:", error.message);
}