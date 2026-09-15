import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const car = body.car && typeof body.car === "object" ? body.car : body;

    const year = car.year || "";
    const make = car.make || "";
    const model = car.model || "";
    const trim = car.trim || "";
    const mileage = car.mileage
      ? `${Number(car.mileage).toLocaleString()} miles`
      : "mileage available on request";
    const price =
      car.price && Number(car.price) > 0
        ? `$${Number(car.price).toLocaleString()}`
        : "Call for price";

    const title = `${year} ${make} ${model} ${trim}`.replace(/\s+/g, " ").trim();

    const description = `${title} available now at Drive Prime Motors. This vehicle has ${mileage} and is listed for ${price}. Contact us today to schedule a test drive or get financing options.`;

    const facebook = `🚗 ${title}\n\nPrice: ${price}\nMileage: ${mileage}\n\nFinancing available. Trade-ins welcome.\n\nDrive Prime Motors\nSacramento / Rancho Cordova, CA\n(916) 261-8880`;

    const craigslist = `${title}\n\n${price} | ${mileage}\n\n${car.description || "Clean, dealer-inspected vehicle ready for a new home."}\n\nFinancing and trade-ins available.\n\nDrive Prime Motors LLC - Sacramento / Rancho Cordova, CA\nCall or text (916) 261-8880`;

    const offerup = `${title} - ${price}\n${mileage}\n\n${car.description || "Dealer-inspected and ready to drive."}\n\nDrive Prime Motors - Sacramento, CA\n(916) 261-8880`;

    return NextResponse.json({
      success: true,
      title,
      description,
      facebook,
      craigslist,
      offerup,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}
