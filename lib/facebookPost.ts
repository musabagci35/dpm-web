export async function postToFacebook(car:any){

    const PAGE_TOKEN = process.env.FB_PAGE_TOKEN
    const PAGE_ID = process.env.FB_PAGE_ID
    
    if(!PAGE_TOKEN || !PAGE_ID){
    console.log("Facebook ENV missing")
    return
    }
    
    const caption = `
    🚗 ${car.year} ${car.make} ${car.model}
    
    ${car.description || ""}
    
    💰 Price: $${car.price}
    
    📍 Drive Prime Motors
    Rancho Cordova CA
    `
    
    const res = await fetch(
    `https://graph.facebook.com/v18.0/${PAGE_ID}/photos`,
    {
    method:"POST",
    headers:{
    "Content-Type":"application/json"
    },
    body:JSON.stringify({
    url: car.images?.[0]?.url || "https://via.placeholder.com/800",
    caption,
    access_token: PAGE_TOKEN
    })
    }
    )
    
    const data = await res.json()
    
    console.log("Facebook response:",data)
    
    return data
    }