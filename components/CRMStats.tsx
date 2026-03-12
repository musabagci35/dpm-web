"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Car = {
  _id: string;
  year?: number;
  make?: string;
  model?: string;
  price?: number;
  mileage?: number;
};

type CompareContextType = {
  compareCars: Car[];
  addCar: (car: Car) => void;
  removeCar: (id: string) => void;
  clearCars: () => void;
};

const CompareContext = createContext<CompareContextType | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {

  const [compareCars, setCompareCars] = useState<Car[]>([]);

  const addCar = (car: Car) => {

    setCompareCars((prev) => {

      if (prev.find((c) => c._id === car._id)) return prev;

      if (prev.length >= 3) {
        alert("You can compare up to 3 vehicles");
        return prev;
      }

      return [...prev, car];
    });

  };

  const removeCar = (id: string) => {
    setCompareCars((prev) => prev.filter((c) => c._id !== id));
  };

  const clearCars = () => {
    setCompareCars([]);
  };

  return (
    <CompareContext.Provider
      value={{ compareCars, addCar, removeCar, clearCars }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {

  const context = useContext(CompareContext);

  if (!context) {
    throw new Error("useCompare must be used inside CompareProvider");
  }

  return context;
}export default function CRMStats() {

    return (
  
      <div className="mt-4 grid grid-cols-3 gap-4">
  
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">
            Leads Today
          </div>
          <div className="text-2xl font-bold">
            0
          </div>
        </div>
  
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">
            Messages
          </div>
          <div className="text-2xl font-bold">
            0
          </div>
        </div>
  
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">
            Appointments
          </div>
          <div className="text-2xl font-bold">
            0
          </div>
        </div>
  
      </div>
  
    );
  }