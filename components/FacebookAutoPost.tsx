"use client"

export default function FacebookAutoPost({carId}:{carId:string}){

async function post(){

await fetch("/api/facebook/post",{
method:"POST",
body:JSON.stringify({carId})
})

alert("Posted to Facebook page")

}

return(

<button
onClick={post}
className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
>

Post FB

</button>

)

}