"use client";

import { createContext, useContext, useState } from "react";

const CompareContext = createContext<any>(null);

export function CompareProvider({ children }: any) {

  const [compareCars, setCompareCars] = useState<any[]>([]);

  const addCar = (car: any) => {
    if (compareCars.find(c => c._id === car._id)) return;

    if (compareCars.length >= 3) {
      alert("You can compare up to 3 cars");
      return;
    }

    setCompareCars([...compareCars, car]);
  };

  const removeCar = (id: string) => {
    setCompareCars(compareCars.filter(c => c._id !== id));
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

export const useCompare = () => useContext(CompareContext);