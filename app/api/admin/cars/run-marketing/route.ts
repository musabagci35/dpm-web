import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";

async function postFacebookPage(car: any) {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const token = process.env.FACEBOOK_PAGE_TOKEN;

    if (!pageId || !token) {
      return { ok: false, error: "Missing Facebook env vars" };
    }

    const title = `${car.year} ${car.make} ${car.model}`;
    const image = car.images?.[0]?.url || "";

    const caption = `
🚗 ${title}

Price: $${car.price || 0}
Mileage: ${car.mileage || "—"}

Financing available.

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}
`.trim();

    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: image,
        caption,
        access_token: token,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data?.error?.message || "Facebook post failed" };
    }

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Facebook post failed" };
  }
}

function buildCraigslistDraft(car: any) {
  return {
    title: `${car.year} ${car.make} ${car.model} - Financing Available`,
    description: `
${car.year} ${car.make} ${car.model}

Price: $${car.price || 0}
Mileage: ${car.mileage || "—"}
VIN: ${car.vin || "N/A"}

Clean title
Financing available

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}

Call/Text: 916-261-8880
`.trim(),
  };
}

function buildOfferUpDraft(car: any) {
  return {
    title: `${car.year} ${car.make} ${car.model}`,
    description: `
${car.year} ${car.make} ${car.model}

Price: $${car.price || 0}
Mileage: ${car.mileage || "—"}

Clean title
Financing available

Drive Prime Motors
Sacramento CA

View vehicle:
https://driveprimemotorsllc.com/inventory/${car._id}

Call/Text: 916-261-8880
`.trim(),
  };
}

function buildMarketplaceDraft(car: any) {
  return {
    title: `${car.year} ${car.make} ${car.model}`,
    price: car.price || 0,
    description: `
${car.year} ${car.make} ${car.model}

Price: $${car.price || 0}
Mileage: ${car.mileage || "—"}

Clean title
Financing available

Drive Prime Motors
Sacramento CA

View details:
https://driveprimemotorsllc.com/inventory/${car._id}

Call/Text: 916-261-8880
`.trim(),
  };
}

async function requestGoogleIndex(url: string) {
  try {
    // Placeholder trigger. Real Google Indexing API is mainly for certain content types,
    // but we still mark that the page was submitted to internal marketing flow.
    return { ok: true, submittedUrl: url };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Google indexing request failed" };
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const carId = body?.carId;

    if (!carId) {
      return NextResponse.json({ error: "carId is required" }, { status: 400 });
    }

    const car: any = await Car.findById(carId).lean();

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const facebook = await postFacebookPage(car);
    const craigslist = buildCraigslistDraft(car);
    const offerup = buildOfferUpDraft(car);
    const marketplace = buildMarketplaceDraft(car);
    const google = await requestGoogleIndex(
      `https://driveprimemotorsllc.com/inventory/${car._id}`
    );

    await Car.findByIdAndUpdate(carId, {
      $set: {
        "marketing.facebookPosted": !!facebook.ok,
        "marketing.craigslistReady": true,
        "marketing.offerupReady": true,
        "marketing.marketplaceReady": true,
        "marketing.googleIndexed": !!google.ok,
        "marketing.lastMarketingRunAt": new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      facebook,
      craigslist,
      offerup,
      marketplace,
      google,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Marketing engine failed" },
      { status: 500 }
    );
  }
}