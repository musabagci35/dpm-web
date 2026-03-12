import mongoose from "mongoose"

const VinHistorySchema = new mongoose.Schema({

vin:{
type:String,
required:true
},

make:String,
model:String,
year:Number,

createdAt:{
type:Date,
default:Date.now
}

})

export default mongoose.models.VinHistory ||
mongoose.model("VinHistory",VinHistorySchema)