const mongoose = require("mongoose");

const PostSchema = new
mongoose.Schema({

title: {
type: String,
required: true,
},

body:{
  type: String
  },

  createdAt: {
  type: Date,
  default: Date.now(),
  }
  });
  module.exports = mongoose.model("Post",
  PostSchema);