import { NextResponse } from "next/server"

export async function POST(req:Request){

const {year, make, model, engine, horsepower, mileage} = await req.json()

const prompt = `
Write a professional car dealership listing.

Vehicle:
${year} ${make} ${model}

Engine: ${engine}
Horsepower: ${horsepower}
Mileage: ${mileage}

Include:
features
driving experience
condition
`

const ai = await fetch("https://api.openai.com/v1/chat/completions",{
method:"POST",
headers:{
"Authorization":`Bearer ${process.env.OPENAI_API_KEY}`,
"Content-Type":"application/json"
},
body:JSON.stringify({
model:"gpt-4o-mini",
messages:[{role:"user",content:prompt}]
})
})

const data = await ai.json()

return NextResponse.json({
description:data.choices[0].message.content
})

}