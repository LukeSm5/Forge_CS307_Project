/* 
 React file to manage unit conversions, and saving user preferences for units in Forge.
*/

import React from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

// Creates a "Container" holding the current boolean value and a setter, initialized to NULL until provider runs
const UnitsContext = createContext<{
    isImperial: boolean;
    setIsImperial: (value: boolean) => void;
} | null>(null);

// Provider to wrap the app in, allowing for unit preferences to be accessed across the app, making it easy to determine if conversions are needed
export function UnitsProvider({ children }: { children: React.ReactNode }) {
    const [isImperial, setIsImperialState] = useState(false);
    // this is done on initial load for the app to use the units provider, retrieving which measurement system a user is using
    useEffect(() => {
        AsyncStorage.getItem("forge.units.isImperial").then(value => {
            if (value !== null) {
                setIsImperialState(value === "true");
            }
        });
    }, []);

    // setter, updates the value of the state, then stores it in async storage so that settings persist over multiple app loads
    const setIsImperial = async (value: boolean) => {
        setIsImperialState(value);
        await AsyncStorage.setItem("forge.units.isImperial", value ? "true" : "false");
    }

    // makes isImperial and setIsImperial available to every component wrapped inside of it
    return (
        <UnitsContext.Provider value={{ isImperial, setIsImperial }}>
        {children}
        </UnitsContext.Provider>
    );
}

// Function called by components to use the values given by the provider, throws an error if used outside of the provider wrap.
export function useUnits() {
    const context = useContext(UnitsContext);
    if (!context) {
        throw new Error("useUnits must be used within a UnitsProvider");
    }
    return context;
}