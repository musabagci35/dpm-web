require("dotenv").config();
const mongoose = require("mongoose");

async function run() {

    await mongoose.connect(process.env.MONGODB_URI);

  const DealerSchema = new mongoose.Schema({
    name: String,
    email: String
  });

  const Dealer = mongoose.models.Dealer || mongoose.model("Dealer", DealerSchema);

  const dealer = await Dealer.create({
    name: "Drive Prime Motors",
    email: "admin@driveprime.com"
  });

  console.log("Dealer created:", dealer);

  process.exit();
}

run();