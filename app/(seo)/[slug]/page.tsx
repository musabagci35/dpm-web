import { connectDB } from "@/lib/mongodb";
import Car from "@/models/Car";
import Link from "next/link";


export async function generateMetadata({ params }: any) {

    const { slug } = await params
  
    const title =
      `${slug.replaceAll("-", " ")} | Drive Prime Motors`
  
    const description =
      `Browse ${slug.replaceAll("-", " ")} at Drive Prime Motors. Financing available.`
  
    return {
      title,
      description
    }
  
  }

export default async function SEOPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  const { slug } = await params;

  await connectDB();

  const words = slug.split("-");

  const make = words[0];
  const model = words[1];

  const cars = await Car.find({
    make: { $regex: make, $options: "i" },
  })
    .limit(12)
    .lean();

  return (

    <main className="max-w-6xl mx-auto px-6 py-16">

      <h1 className="text-4xl font-bold mb-4">

        {make} {model} For Sale in Sacramento

      </h1>

      <p className="text-gray-600 mb-10">

        Browse available {make} {model} vehicles at Drive Prime Motors.
        Financing available for all credit types.

      </p>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

        {cars.map((car:any)=>{

          const id = car._id.toString()

          const title =
            `${car.year} ${car.make} ${car.model}`

          const image =
            car.images?.[0]?.url || "/car-placeholder.jpg"

          return(

            <div
              key={id}
              className="border rounded-xl bg-white shadow"
            >

              <img
                src={image}
                className="h-48 w-full object-cover"
              />

              <div className="p-4">

                <h3 className="font-semibold">

                  {title}

                </h3>

                <Link
                  href={`/inventory/${id}`}
                  className="text-blue-600 text-sm"
                >
                  View Vehicle →
                </Link>

              </div>

            </div>

          )

        })}

      </div>

    </main>

  );

}