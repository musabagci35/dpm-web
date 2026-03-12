"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function VinScanner({ onScan }: any) {

  useEffect(() => {

    const scanner = new Html5QrcodeScanner(
      "vin-reader",
      {
        fps: 10,
        qrbox: 250
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
      },
      (error) => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };

  }, []);

  return (
    <div className="border rounded-xl p-4">
      <div id="vin-reader" />
    </div>
  );
}