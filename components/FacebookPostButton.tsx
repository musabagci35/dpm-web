"use client"

import { useState } from "react"

export default function FacebookPostButton({carId}:{carId:string}){

const [loading,setLoading] = useState(false)

async function post(){

try{

setLoading(true)

const res = await fetch("/api/admin/cars/post-facebook",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({carId})
})

const data = await res.json()

if(!res.ok){
alert(data.error || "Facebook post failed")
return
}

alert("Posted to Facebook successfully")

}catch(e){

console.error(e)

}finally{

setLoading(false)

}

}

return(

<button
onClick={post}
className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs"
>
{loading ? "Posting..." : "Post Facebook"}
</button>

)

}