import { connectDB } from "../lib/mongodb"
import Vin from "../models/Vin"

async function run(){

await connectDB()

for(let i=0;i<10000;i++){

const vin = "JT2BK18U3" + Math.floor(1000000 + Math.random()*9000000)

await Vin.create({
vin
})

}

console.log("VINs created")

}

run()