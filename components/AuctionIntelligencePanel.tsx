type Props = {
    vin: string;
  };
  
  function encode(v: string) {
    return encodeURIComponent(v.trim());
  }
  
  export default function AuctionIntelligencePanel({ vin }: Props) {
    const cleanVin = vin?.trim() || "";
    const q = encode(cleanVin);
  
    const links = [
      {
        label: "Bidfax Photos",
        href: `https://bidfax.info/search?q=${q}`,
        className: "bg-blue-600 text-white",
      },
      {
        label: "Stat.vin Records",
        href: `https://stat.vin/cars/${q}`,
        className: "bg-fuchsia-600 text-white",
      },
      {
        label: "Poctra Search",
        href: `https://poctra.com/search?query=${q}`,
        className: "bg-orange-600 text-white",
      },
      {
        label: "Copart Search",
        href: `https://www.copart.com/lotSearchResults?free=true&query=${q}`,
        className: "bg-green-600 text-white",
      },
      {
        label: "IAAI Search",
        href: `https://www.iaai.com/Search?SearchVehicleKeyword=${q}`,
        className: "bg-black text-white",
      },
    ];
  
    return (
      <div className="rounded-2xl border bg-white p-5">
        <div className="text-2xl font-bold">Auction Intelligence</div>
  
        <p className="mt-2 text-sm text-gray-600">
          Search this VIN across major auction and salvage record sites.
        </p>
  
        <div className="mt-4 flex flex-wrap gap-3">
          {links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className={`rounded-lg px-4 py-2 text-sm font-medium ${item.className}`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    );
  }