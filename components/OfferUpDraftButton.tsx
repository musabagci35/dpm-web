"use client"

export default function OfferUpDraftButton({carId}:{carId:string}){

async function generate(){

const res = await fetch("/api/offerup",{
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

await navigator.clipboard.writeText(text)

alert("OfferUp draft copied")
}

return(

<button
onClick={generate}
className="bg-green-600 text-white px-3 py-1 rounded text-xs"
>
OfferUp
</button>

)

}