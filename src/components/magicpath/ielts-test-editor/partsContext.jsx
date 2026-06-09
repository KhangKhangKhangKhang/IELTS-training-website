import React, { createContext, useContext } from "react";

// Shared state for Reading/Listening part list so Passage tab and
// Question Groups tab show the SAME parts. Without this, each editor
// loaded its own copy of `getAllPartByIdAPI` and the lists drifted.
const PartsContext = createContext(null);

export function PartsProvider({ value, children }) {
  return <PartsContext.Provider value={value}>{children}</PartsContext.Provider>;
}

export function useParts() {
  return useContext(PartsContext);
}
