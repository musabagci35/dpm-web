import { connectDB } from "@/lib/mongodb"
import Vin from "@/models/Vin"

export default async function VinPage({params}:{params:{vin:string}}){

const vin = params.vin.toUpperCase()

await connectDB()

const data = await fetch(
`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
)

const json = await data.json()

const car = json.Results[0]

return(

<div className="mx-auto max-w-4xl px-6 py-10">

<h1 className="text-3xl font-bold mb-6">
VIN Report {vin}
</h1>

<div className="border p-6 rounded-xl bg-white">

<p><b>Make:</b> {car.Make}</p>
<p><b>Model:</b> {car.Model}</p>
<p><b>Year:</b> {car.ModelYear}</p>
<p><b>Engine:</b> {car.EngineModel}</p>
<p><b>Fuel:</b> {car.FuelTypePrimary}</p>

</div>


<div className="border p-6 rounded-xl mt-6 bg-white">

<h2 className="font-bold text-xl mb-4">
Auction Records
</h2>

<a
href={`https://bidfax.info/search/${vin}`}
target="_blank"
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Auction Damage Photos
</a>

</div>


<div className="border p-6 rounded-xl mt-6 bg-white">

<h2 className="font-bold text-xl mb-4">
Full History
</h2>

<a
href={`https://www.vinaudit.com/vin/${vin}`}
target="_blank"
className="bg-red-600 text-white px-4 py-2 rounded"
>
Full VIN Report
</a>

</div>

</div>

)
}