"use client";

import { createContext, useContext } from "react";

const HasSessionContext = createContext(false);
export const HasSessionProvider = (
  props: React.ComponentProps<typeof HasSessionContext.Provider>,
) => {
  return <HasSessionContext.Provider {...props} />;
};
export const useHasSession = () => useContext(HasSessionContext);
