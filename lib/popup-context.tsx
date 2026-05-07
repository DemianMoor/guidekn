"use client";

import { createContext, useContext, useEffect, useState } from "react";

type PopupContextValue = {
  isSuppressed: boolean;
  suppress: () => void;
  unsuppress: () => void;
};

const PopupContext = createContext<PopupContextValue>({
  isSuppressed: false,
  suppress: () => {},
  unsuppress: () => {},
});

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [isSuppressed, setIsSuppressed] = useState(false);

  return (
    <PopupContext.Provider
      value={{
        isSuppressed,
        suppress: () => setIsSuppressed(true),
        unsuppress: () => setIsSuppressed(false),
      }}
    >
      {children}
    </PopupContext.Provider>
  );
}

export function usePopupContext() {
  return useContext(PopupContext);
}

/**
 * Marketing pages render this component to opt out of the subscribe popup.
 * Renders nothing visible — it just signals the popup system to stay hidden.
 */
export function NoSubscribePopup() {
  const { suppress, unsuppress } = usePopupContext();

  useEffect(() => {
    suppress();
    return () => unsuppress();
  }, [suppress, unsuppress]);

  return null;
}
