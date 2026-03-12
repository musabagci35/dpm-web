type Props = {
    params: Promise<{ slug: string }>
  }
  
  export default async function CarCityPage({ params }: Props) {
  
    const { slug } = await params
  
    const title = slug.replaceAll("-", " ")
  
    return (
  
  <div className="max-w-5xl mx-auto px-6 py-10">
  
  <h1 className="text-3xl font-bold mb-6 capitalize">
  {title} | Drive Prime Motors Sacramento
  </h1>
  
  <p className="mb-6 text-gray-600">
  Looking for {title}? Browse quality used vehicles available at Drive Prime Motors in Sacramento California.
  We offer financing, transparent pricing and reliable used vehicles.
  </p>
  
  <a
  href="/inventory"
  className="bg-red-600 text-white px-4 py-2 rounded-lg"
  >
  View Available Vehicles
  </a>
  
  <div className="mt-10 border rounded-xl p-6">
  
  <h2 className="text-xl font-semibold mb-3">
  Why buy from Drive Prime Motors?
  </h2>
  
  <ul className="list-disc pl-5 space-y-2 text-gray-600">
  
  <li>Quality inspected used vehicles</li>
  <li>Financing options available</li>
  <li>Transparent pricing</li>
  <li>Local Sacramento dealership</li>
  
  </ul>
  
  </div>
  
  </div>
  
    )
  
  }