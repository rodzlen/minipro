const mongoose = require("mongoose");
const CartSchema = mongoose.Schema({
  products: {
      items:[
          {
              title:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Album',
                required:true
              },
              price:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'Album',
                required:true
              },
              quantity:{
                type:Number,
                required:true
              }
          }
      ]
  }  ,user:{
        username:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true,
            unique : true
        }
    }
});
const Cart = mongoose.model("Cart", CartSchema);

module.exports = Cart;

