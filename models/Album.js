const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  
  artist: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  coverImage: String, 
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  price:{
    type:Number,
    required:true
  }
});

const Album = mongoose.model("Album", albumSchema);

module.exports = Album;
