export async function decodeVIN(vin: string) {

    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
    )
  
    const data = await res.json()
  
    const v = data.Results[0]
  
    return {
      year: v.ModelYear || "",
      make: v.Make || "",
      model: v.Model || "",
      body: v.BodyClass || "",
      engine: v.EngineModel || "",
      fuel: v.FuelTypePrimary || "",
      transmission: v.TransmissionStyle || "",
      plant: v.PlantCountry || ""
    }
  }