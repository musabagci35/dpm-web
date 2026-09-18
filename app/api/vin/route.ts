import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import { getVinDecodeResult, VinDecodeError } from "@/lib/vinDecode";
import { getRecallsForVehicle } from "@/lib/nhtsaRecalls";
import {
  isPubliclyVisible,
  PUBLIC_CAR_FIELDS,
  PublicVehicle,
  toPublicVehicle,
  withDecodedSpecs,
} from "@/lib/publicVehicle";

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * Finds live dealer listings for an exact VIN. Sold and archived records are
 * excluded so a decoded VIN never links to a listing a shopper can't buy.
 */
async function findInventoryByVin(vin: string): Promise<PublicVehicle[]> {
  try {
    await connectDB();

    const cars = await Car.find({ vin })
      .select(PUBLIC_CAR_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const visible = cars.filter(
      (car: any) => isPubliclyVisible(car) && car.status !== "sold"
    );

    return Promise.all(
      visible.map((car: any) =>
        withDecodedSpecs(toPublicVehicle(car), String(car.vin || ""), "cached")
      )
    );
  } catch (error) {
    // Inventory matching is an enhancement on top of the decode — a database
    // problem must not turn a successful VIN decode into an error response.
    console.error("VIN INVENTORY MATCH ERROR:", error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const vin = String(body?.vin || "");
    const ip = getClientIp(req);

    const result = await getVinDecodeResult(vin, { ip });

    // Run the inventory match and the recall lookup together — neither one
    // depends on the other and both are already tolerant of their own failures.
    const [inventory, recallCheck] = await Promise.all([
      findInventoryByVin(result.vin),
      getRecallsForVehicle(result.make, result.model, result.year),
    ]);

    return NextResponse.json({
      success: true,
      // Flat decoded fields — the shape /api/vin has always returned, kept
      // intact for app/sell-your-car and components/admin/VinDecodeButton.
      ...result,

      // Inventory match.
      foundInInventory: inventory.length > 0,
      inventory,
      car: inventory[0] ?? null,

      // Official NHTSA safety recalls for this make/model/year.
      recalls: recallCheck.recalls,
      recallsAvailable: recallCheck.supported,
      recallsError: recallCheck.error ?? null,
      recallsSource: "NHTSA recalls API",
    });
  } catch (err) {
    const isVinError = err instanceof VinDecodeError;
    const status = isVinError ? err.status : 500;
    const message = isVinError
      ? err.message
      : "VIN decode failed. Please try again.";

    if (!isVinError) {
      console.error("VIN decode error:", err);
    }

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
