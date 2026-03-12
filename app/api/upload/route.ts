import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {

  const data = await req.formData();
  const files = data.getAll("files") as File[];

  const uploaded = [];

  for (const file of files) {

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result:any = await new Promise((resolve,reject)=>{

      cloudinary.uploader.upload_stream(
        { folder: "cars" },
        (err,result)=>{
          if(err) reject(err)
          resolve(result)
        }
      ).end(buffer)

    })

    uploaded.push(result.secure_url)

  }

  return NextResponse.json({images: uploaded})

}