"use client";

import { useState } from "react";
import VinScanner from "@/components/VinScanner";

export default function VinReportPage() {

  const [vin,setVin] = useState("")
  const [data,setData] = useState<any>(null)
  const [loading,setLoading] = useState(false)

  async function runReport(){

    if(!vin) return

    setLoading(true)

    const res = await fetch("/api/vin-report",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({vin})
    })

    const result = await res.json()

    setData(result)

    setLoading(false)
  }

  return (

<div className="mx-auto max-w-3xl px-4 py-10">

<h1 className="text-3xl font-bold mb-6">
Free VIN Check - Drive Prime Motors
</h1>

<p className="text-gray-600 mb-6">
Check vehicle history, title status, accident records and salvage reports instantly.
</p>


<div className="flex gap-2 mb-6">

<input
value={vin}
onChange={(e)=>setVin(e.target.value)}
placeholder="Enter VIN"
className="border rounded px-3 py-2 w-full"
/>

<button
onClick={runReport}
className="bg-black text-white px-4 py-2 rounded"
>
Run Report
</button>

</div>


<div className="mt-4 mb-6">
<VinScanner onScan={(v:string)=>setVin(v)} />
</div>


{loading && <p>Checking VIN...</p>}


{data && (

<>

{/* Vehicle Summary */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Vehicle Summary
</h2>

<p><b>Make:</b> {data.make}</p>
<p><b>Model:</b> {data.model}</p>
<p><b>Year:</b> {data.year}</p>
<p><b>Engine:</b> {data.engine}</p>
<p><b>Fuel:</b> {data.fuel}</p>
<p><b>Body:</b> {data.body}</p>

</div>


{/* Market Value */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Market Value
</h2>

<p>
Estimated Market Value:
<b> ${data.market_low} - ${data.market_high}</b>
</p>

</div>


{/* Auction Intelligence */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Auction Intelligence
</h2>

<p className="text-gray-600 mb-3">
Search real auction vehicles using this VIN.
</p>

<a
href={`https://bid.cars/en/search/results?search=${vin}`}
target="_blank"
className="bg-blue-600 text-white px-4 py-2 rounded-lg"
>
Search Auction Vehicles
</a>

</div>


{/* Sell Vehicle */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Sell This Vehicle
</h2>

<p className="text-gray-600 mb-3">
Want to sell this vehicle? Get an instant offer from Drive Prime Motors.
</p>

<a
href="/sell-your-car"
className="bg-black text-white px-4 py-2 rounded-lg"
>
Get Offer
</a>

</div>


{/* Auction */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Find This Vehicle At Auction
</h2>

<p className="text-gray-600 mb-3">
Search Copart and IAAI auctions for similar vehicles.
</p>

<a
href="https://www.copart.com"
target="_blank"
className="border px-4 py-2 rounded-lg"
>
View Auctions
</a>

</div>


{/* Auction Photos */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h2 className="text-xl font-bold mb-4">
Auction Damage Photos
</h2>

<p className="text-gray-600 mb-3">
See real auction photos and damage records for this vehicle.
</p>

<a
href={`https://bidfax.info/search/${vin}`}
target="_blank"
className="bg-blue-600 text-white px-4 py-2 rounded-lg"
>
View Auction Photos
</a>

</div>


{/* Full Report */}

<div className="border rounded-xl p-6 mt-6 bg-white">

<h3 className="font-bold text-lg mb-2">
Full Vehicle History
</h3>

<p className="text-sm text-gray-600 mb-3">
Accident records, title status, salvage history and ownership records available.
</p>

<a
href={`https://www.vinaudit.com/vin/${vin}`}
target="_blank"
className="bg-red-600 text-white px-4 py-2 rounded-lg inline-block"
>
View Full History Report
</a>

</div>

</>

)}

</div>

  )
}