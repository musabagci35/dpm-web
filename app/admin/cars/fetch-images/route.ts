import { NextResponse } from "next/server"

export async function POST(req:Request){

try{

const {make,model,year} = await req.json()

const query = `${year} ${make} ${model} car`

const res = await fetch(
`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${process.env.UNSPLASH_KEY}`
)

const data = await res.json()

const images = data?.results?.slice(0,5).map((img:any)=>({
url: img.urls.regular
})) || []

return NextResponse.json({images})

}catch(err){

console.error("image fetch error",err)

return NextResponse.json({
images:[]
})

}

}