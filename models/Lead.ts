import mongoose, { Schema, models, model } from "mongoose";

const LeadSchema = new Schema(
{
dealerId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Dealer",
required:true,
index:true
},

carId:{
type:mongoose.Schema.Types.ObjectId,
ref:"Car",
default:null
},

vin:{
type:String,
default:"",
index:true
},

carTitle:{
type:String,
default:""
},

customerName:{
type:String,
default:""
},

phone:{
type:String,
default:""
},

email:{
type:String,
default:""
},

message:{
type:String,
default:""
},

source:{
type:String,
enum:["vin","inventory","facebook","website"],
default:"vin"
},

status:{
type:String,
enum:["new","contacted","won","lost"],
default:"new",
index:true
}

},
{timestamps:true}
)

LeadSchema.index({dealerId:1,createdAt:-1})

const Lead = models.Lead || model("Lead",LeadSchema)

export default Lead