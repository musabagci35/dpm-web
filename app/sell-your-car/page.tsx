"use client";

import React, { useState } from "react";

export default function SellYourCarPage() {

  const [form,setForm] = useState({
    name:"",
    phone:"",
    email:"",
    year:"",
    make:"",
    model:"",
    mileage:"",
    price:"",
    message:""
  })

  const [images,setImages] = useState<FileList | null>(null)

  const handleChange = (e:any)=>{
    setForm({...form,[e.target.name]:e.target.value})
  }

  const handleSubmit = async(e:any)=>{

    e.preventDefault()

    let uploadedImages:string[] = []

    if(images){

      const fd = new FormData()

      for(let i=0;i<images.length;i++){
        fd.append("files",images[i])
      }

      const upload = await fetch("/api/upload",{
        method:"POST",
        body:fd
      })

      const img = await upload.json()

      uploadedImages = img.images
    }

    const res = await fetch("/api/marketplace",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        ...form,
        images:uploadedImages,
        source:"marketplace"
      })
    })

    if(res.ok){
      alert("Vehicle submitted successfully")
    }else{
      alert("Error submitting vehicle")
    }

  }

  return (

    <div className="mx-auto max-w-3xl px-4 py-10">

      <h1 className="text-3xl font-bold mb-4">
        Sell Your Car
      </h1>

      <p className="text-gray-600 mb-6">
        List your vehicle on our marketplace.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4">

        <input
        name="name"
        placeholder="Your Name"
        onChange={handleChange}
        required
        className="border rounded-xl px-4 py-3"
        />

        <input
        name="phone"
        placeholder="Phone"
        onChange={handleChange}
        required
        className="border rounded-xl px-4 py-3"
        />

        <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        className="border rounded-xl px-4 py-3"
        />

        <div className="grid grid-cols-3 gap-4">

          <input
          name="year"
          placeholder="Year"
          onChange={handleChange}
          className="border rounded-xl px-4 py-3"
          />

          <input
          name="make"
          placeholder="Make"
          onChange={handleChange}
          className="border rounded-xl px-4 py-3"
          />

          <input
          name="model"
          placeholder="Model"
          onChange={handleChange}
          className="border rounded-xl px-4 py-3"
          />

        </div>

        <input
        name="price"
        placeholder="Price"
        onChange={handleChange}
        className="border rounded-xl px-4 py-3"
        />

        <input
        name="mileage"
        placeholder="Mileage"
        onChange={handleChange}
        className="border rounded-xl px-4 py-3"
        />

        <textarea
        name="message"
        placeholder="Tell us about your car"
        onChange={handleChange}
        className="border rounded-xl px-4 py-3"
        />

        {/* IMAGE UPLOAD */}

        <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e)=>setImages(e.target.files)}
        className="border rounded-xl px-4 py-3"
        />

        <button
        type="submit"
        className="bg-black text-white rounded-xl py-3"
        >
        Submit Vehicle
        </button>

      </form>

    </div>

  )

}