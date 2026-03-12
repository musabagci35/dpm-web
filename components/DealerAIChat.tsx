"use client";

import { useState } from "react";

export default function DealerAIChat({ carTitle }: any) {

const [messages,setMessages] = useState<any[]>([])
const [input,setInput] = useState("")

async function sendMessage(){

const res = await fetch("/api/ai-chat",{
method:"POST",
body:JSON.stringify({
message:input,
carTitle
})
})

const data = await res.json()

setMessages([
...messages,
{role:"user",text:input},
{role:"ai",text:data.reply}
])

setInput("")

}

return(

<div className="border rounded-xl p-4 mt-10">

<div className="font-semibold mb-3">
Ask about this vehicle
</div>

<div className="space-y-2 mb-3">

{messages.map((m,i)=>(
<div key={i} className={m.role==="ai"?"text-blue-600":"text-gray-800"}>
{m.text}
</div>
))}

</div>

<div className="flex gap-2">

<input
value={input}
onChange={(e)=>setInput(e.target.value)}
placeholder="Ask a question..."
className="flex-1 border rounded px-3 py-2"
/>

<button
onClick={sendMessage}
className="bg-black text-white px-4 rounded"
>
Send
</button>

</div>

</div>

)

}