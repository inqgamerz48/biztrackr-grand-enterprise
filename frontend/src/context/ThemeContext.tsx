import React, { createContext, useContext, ReactNode } from 'react';

// Analog Enterprise is the only way.
const ThemeContext = createContext({});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // No state, no toggle, just pure Analog.
    return (
        <ThemeContext.Provider value={{}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
