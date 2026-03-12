"use client"

import { useState } from "react"

export default function CraigslistPostButton({carId}:any){

const [loading,setLoading]=useState(false)

async function generate(){

setLoading(true)

const res = await fetch("/api/craigslist",{
method:"POST",
body:JSON.stringify({carId})
})

const data = await res.json()

navigator.clipboard.writeText(
`${data.title}

${data.description}`
)

alert("Craigslist post copied!")

setLoading(false)

}

return(

<button
onClick={generate}
className="rounded bg-orange-600 text-white px-3 py-1.5 text-xs"
>

{loading?"Loading...":"Craigslist"}

</button>

)

}