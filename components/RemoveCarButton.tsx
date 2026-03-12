"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RemoveCarButton({ id }: { id: string }) {

  const [loading,setLoading] = useState(false)

  const router = useRouter()

  async function remove(){

    if(!confirm("Delete this vehicle?")) return

    setLoading(true)

    await fetch(`/api/cars/${id}`,{
      method:"DELETE"
    })

    router.refresh()
  }

  return (
    <button
      onClick={remove}
      className="bg-red-500 text-white px-3 py-1 rounded text-xs"
    >
      {loading ? "Removing..." : "Remove"}
    </button>
  )
}