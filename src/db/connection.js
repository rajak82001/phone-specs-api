const mongoose = require("mongoose");

const db_user = encodeURIComponent(process.env.DB_USER || "");
const db_password = encodeURIComponent(process.env.DB_PASSWORD || "");
const db_name = process.env.DB_COLLECTION || "phone-specs";
const db_url = `mongodb+srv://${db_user}:${db_password}@cluster0.vodzxcj.mongodb.net/${db_name}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(db_url)
  .then(() => console.log("MongoDB Connection Successful"))
  .catch((err) => console.error("MongoDB Connection Error:", err));
