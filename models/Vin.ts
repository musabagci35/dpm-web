import mongoose from "mongoose"

const VinSchema = new mongoose.Schema({

vin:{
type:String,
required:true,
unique:true,
index:true
},

make:String,
model:String,
year:String,

city:{
type:String,
default:"Sacramento"
},

state:{
type:String,
default:"California"
}

},{timestamps:true})

export default mongoose.models.Vin || mongoose.model("Vin",VinSchema)