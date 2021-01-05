const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookMark = new Schema({
  title: String,
  url: String,
  img: {
    data: Buffer,
    contentType: String,
  },
  user: String,
});

exports.BookMark = mongoose.model("bookmarks", bookMark);
