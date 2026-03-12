"use client"

export default function MarketplaceDraftButton({carId}:{carId:string}){

async function generate(){

const res = await fetch("/api/facebook/marketplace",{
method:"POST",
body:JSON.stringify({carId})
})

const data = await res.json()

const text = `
TITLE:
${data.title}

PRICE:
${data.price}

DESCRIPTION:
${data.description}
`

navigator.clipboard.writeText(text)

alert("Marketplace draft copied to clipboard")

}

return(

<button
onClick={generate}
className="bg-purple-600 text-white px-3 py-1 rounded text-xs"
>

Marketplace

</button>

)

}