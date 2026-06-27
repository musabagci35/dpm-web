export function analyzeAuctionVehicle(car: any) {
  const bid = Number(car.currentBid || 0);
  const auctionFee = Number(car.auctionFee || 0);
  const transport = Number(car.transportCost || 0);
  const repair = Number(car.repairCost || 0);
  const detail = Number(car.detailCost || 0);
  const registration = Number(car.registrationCost || 0);
  const retail = Number(car.retailPrice || 0);
  const mmr = Number(car.mmr || 0);
  const maxBid = Number(car.maxBid || 0);

  const totalCost = bid + auctionFee + transport + repair + detail + registration;
  const profit = retail - totalCost;
  const margin = retail > 0 ? (profit / retail) * 100 : 0;

  let score = 50;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (profit >= 5000) {
    score += 25;
    reasons.push("Strong expected profit.");
  } else if (profit >= 2500) {
    score += 15;
    reasons.push("Good expected profit.");
  } else if (profit >= 1000) {
    score += 5;
    reasons.push("Small but positive profit.");
  } else {
    score -= 25;
    warnings.push("Expected profit is too low or negative.");
  }

  if (margin >= 20) {
    score += 15;
    reasons.push("Healthy profit margin.");
  } else if (margin >= 12) {
    score += 8;
    reasons.push("Acceptable profit margin.");
  } else if (retail > 0) {
    score -= 15;
    warnings.push("Low profit margin.");
  }

  if (mmr > 0 && bid > 0) {
    if (bid <= mmr * 0.85) {
      score += 15;
      reasons.push("Bid is well below MMR.");
    } else if (bid <= mmr) {
      score += 5;
      reasons.push("Bid is near or below MMR.");
    } else {
      score -= 15;
      warnings.push("Bid is above MMR.");
    }
  }

  if (maxBid > 0 && bid > maxBid) {
    score -= 20;
    warnings.push("Current bid is higher than your max bid.");
  }

  if (repair >= 3000) {
    score -= 20;
    warnings.push("Repair estimate is high.");
  } else if (repair > 0 && repair <= 1200) {
    score += 5;
    reasons.push("Repair cost looks manageable.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let decision = "WATCH";
  if (score >= 75 && profit > 0) decision = "BUY";
  if (score < 55 || profit <= 0) decision = "PASS";

  return {
    score,
    decision,
    totalCost,
    profit,
    margin: Math.round(margin),
    reasons,
    warnings,
  };
}
