const { connect } = require("mongoose");
require("dotenv").config();

const connectDB = async (url) => {
  try {
    await connect(process.env.DB_URL);
    console.log("DB connection");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;
