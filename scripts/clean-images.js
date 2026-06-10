import mongoose from "mongoose";
import dotenv from "dotenv";
import Car from "../models/Car.ts";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI missing");
  }

  await mongoose.connect(MONGODB_URI);

  const cars = await Car.find({});

  for (const car of cars) {
    const badImages =
      !car.images ||
      car.images.length === 0 ||
      car.images.some((img) =>
        img.url.includes("source.unsplash.com") ||
        img.url.includes("&sig=")
      );

    if (badImages) {
      car.images = [
        {
          url: "/car-placeholder.jpg",
          publicId: "",
          isCover: true,
        },
      ];

      await car.save();
      console.log("Fixed:", car._id.toString());
    }
  }

  console.log("Done");
  process.exit();
}

run();