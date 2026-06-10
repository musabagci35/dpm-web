"use client";

export default function MobileStickyLead({ car }: any) {

  const handleWhatsApp = () => {
    const text = `Hi, I'm interested in:
${car?.year} ${car?.make} ${car?.model}
Price: $${car?.price}`;

    const url = `https://wa.me/19162618880?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">

      <div className="bg-white border-t shadow-lg flex">

        {/* CALL */}
        <a
          href="tel:+19162618880"
          className="flex-1 text-center py-3 font-semibold border-r"
        >
          📞 Call
        </a>

        {/* WHATSAPP */}
        <button
          onClick={handleWhatsApp}
          className="flex-1 text-center py-3 font-semibold border-r"
        >
          💬 WhatsApp
        </button>

        {/* LEAD */}
        <a
          href="#lead-form"
          className="flex-1 text-center py-3 font-semibold bg-red-600 text-white"
        >
          ⚡ Get Deal
        </a>

      </div>

    </div>
  );
}