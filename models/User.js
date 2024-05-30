const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
username: {
type: String,
required: true,
unique: true,
},
password: {
type: String,
required: true,
},
birth:{
  required : true,
  type : Date
},
gender : {
  type : String,
  required:true
},
job:{
type : String,
required : true
}
});
module.exports = mongoose.model("User", userSchema);