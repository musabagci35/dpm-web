import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Part from "@/models/Part";

function xmlEscape(value: any) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const token = process.env.EBAY_USER_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing EBAY_USER_TOKEN" },
        { status: 500 }
      );
    }

    const { partId } = await req.json();

    if (!partId) {
      return NextResponse.json(
        { success: false, error: "Part ID is required" },
        { status: 400 }
      );
    }

    const part = await Part.findById(partId);

    if (!part) {
      return NextResponse.json(
        { success: false, error: "Part not found" },
        { status: 404 }
      );
    }

    const title = xmlEscape(part.title).slice(0, 80);
    const description = xmlEscape(
      `${part.description || ""}

Part Number: ${part.partNumber || "N/A"}
OEM Number: ${part.oemNumber || "N/A"}
Compatibility: ${part.compatibility || "N/A"}
Condition: ${part.condition || "used"}
SKU: ${part.sku || ""}
`
    );

    const price = Number(part.price || 0);

    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Part price must be greater than 0" },
        { status: 400 }
      );
    }

    const imageUrls = Array.isArray(part.images)
      ? part.images
          .map((img: any) => img?.url)
          .filter(Boolean)
      : [];

    const pictureXml = imageUrls
      .slice(0, 12)
      .map((url: string) => `<PictureURL>${xmlEscape(url)}</PictureURL>`)
      .join("");

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${xmlEscape(token)}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
  <Item>
    <Title>${title}</Title>
    <Description>${description}</Description>
    <PrimaryCategory>
      <CategoryID>6030</CategoryID>
    </PrimaryCategory>
    <StartPrice>${price}</StartPrice>
    <CategoryMappingAllowed>true</CategoryMappingAllowed>
    <Country>US</Country>
    <Currency>USD</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>GTC</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <PostalCode>95670</PostalCode>
    <Quantity>${Number(part.quantity || 1)}</Quantity>
    <ConditionID>${part.condition === "new" ? 1000 : 3000}</ConditionID>
    <ItemSpecifics>
      <NameValueList>
        <Name>Brand</Name>
        <Value>Unbranded</Value>
      </NameValueList>
      <NameValueList>
        <Name>Manufacturer Part Number</Name>
        <Value>${xmlEscape(part.partNumber || "N/A")}</Value>
      </NameValueList>
    </ItemSpecifics>
    <PictureDetails>
      ${pictureXml}
    </PictureDetails>
    <ShippingDetails>
      <ShippingType>Flat</ShippingType>
      <ShippingServiceOptions>
        <ShippingServicePriority>1</ShippingServicePriority>
        <ShippingService>USPSPriority</ShippingService>
        <ShippingServiceCost>0.00</ShippingServiceCost>
      </ShippingServiceOptions>
    </ShippingDetails>
    <ReturnPolicy>
      <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
      <RefundOption>MoneyBack</RefundOption>
      <ReturnsWithinOption>Days_30</ReturnsWithinOption>
      <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
    </ReturnPolicy>
    <Site>US</Site>
  </Item>
</AddFixedPriceItemRequest>`;

    const res = await fetch("https://api.ebay.com/ws/api.dll", {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-CALL-NAME": "AddFixedPriceItem",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1231",
      },
      body: xml,
    });

    const responseText = await res.text();

    const itemIdMatch = responseText.match(/<ItemID>(.*?)<\/ItemID>/);
    const ackMatch = responseText.match(/<Ack>(.*?)<\/Ack>/);
    const errorMatch = responseText.match(/<LongMessage>(.*?)<\/LongMessage>/);

    const ack = ackMatch?.[1] || "";

    if (!res.ok || (ack !== "Success" && ack !== "Warning")) {
      part.ebayStatus = "error";
      part.ebayError = errorMatch?.[1] || responseText.slice(0, 1000);
      part.ebayLastSyncedAt = new Date();
      await part.save();

      return NextResponse.json(
        {
          success: false,
          error: part.ebayError,
          raw: responseText,
        },
        { status: 400 }
      );
    }

    part.ebayStatus = "listed";
    part.ebayItemId = itemIdMatch?.[1] || "";
    part.ebayLastSyncedAt = new Date();
    part.ebayError = "";
    await part.save();

    return NextResponse.json({
      success: true,
      message: "Part listed on eBay ✅",
      ebayItemId: part.ebayItemId,
    });
  } catch (error: any) {
    console.error("EBAY PUBLISH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "eBay publish failed",
      },
      { status: 500 }
    );
  }
}