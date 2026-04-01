import React from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const UnitsContext = createContext<{
    isImperial: boolean;
    setIsImperial: (value: boolean) => void;
} | null>(null);

export function UnitsProvider({ children }: { children: React.ReactNode }) {
    const [isImperial, setIsImperialState] = useState(false);
    
    useEffect(() => {
        AsyncStorage.getItem("forge.units.isImperial").then(value => {
            if (value !== null) {
                setIsImperialState(value === "true");
            }
        });
    }, []);


    const setIsImperial = async (value: boolean) => {
        setIsImperialState(value);
        await AsyncStorage.setItem("forge.units.isImperial", value ? "true" : "false");
    }

    return (
        <UnitsContext.Provider value={{ isImperial, setIsImperial }}>
        {children}
        </UnitsContext.Provider>
    );
}

export function useUnits() {
    const context = useContext(UnitsContext);
    if (!context) {
        throw new Error("useUnits must be used within a UnitsProvider");
    }
    return context;
}