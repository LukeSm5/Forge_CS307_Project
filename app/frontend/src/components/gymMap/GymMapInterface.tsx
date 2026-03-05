import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import CardioButton from '@/components/cardioSearch/CardioButton';
import CardioMachineResult from '@/components/cardioSearch/CardioMachineResult';
import React, { useEffect, useState } from 'react';
import { api, SearchCardioMachineResponse } from '@/core/api';
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

const GOOGLE_API_KEY = "AIzaSyDQ2jFZs7NEWcl_xsKR6wvyiAgup0FkLaQ";

export default function GymMapInterface({ visible, setVisible }: { visible: boolean, setVisible: (visible: boolean) => void }) {
    if (!visible)
        return (<></>);

    const [location, setLocation] = useState<Location.LocationObjectCoords | undefined>(undefined);
    const [gyms, setGyms] = useState([]);

    useEffect(() => {
        if (visible)
            getLocation();
        else
            setVisible(false);
    }, []);

    async function getLocation() {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted")
            return;

        let loc = await Location.getCurrentPositionAsync();
        setLocation(loc.coords);

        fetchNearbyGyms(loc.coords.latitude, loc.coords.longitude);
    }

    async function fetchNearbyGyms(lat: number, lng: number) {
        const url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}` +
        `&radius=3000` +
        `&type=gym` +
        `&key=${GOOGLE_API_KEY}`;

        const res = await fetch(url);
        const data = await res.json();

        setGyms(data.results);
    };

    let mapComponent: React.JSX.Element;
    if (!location) {
        mapComponent = (<Text style={styles.title}>Location disabled.</Text>);
    } else {
        mapComponent = (<MapView
            style={styles.map}
            initialRegion={{
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            }}
        >
            <Marker
                coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
                }}
                title="You"
            />

            {gyms.map((gym) => (
                <Marker
                    key={gym.place_id}
                    coordinate={{
                        latitude: gym.geometry.location.lat,
                        longitude: gym.geometry.location.lng,
                    }}
                    title={gym.name}
                    description={gym.vicinity}
                />
            ))}
        </MapView>);
    }

    return (
        <View style={styles.container} lightColor="#0007" darkColor="#fff7">
            <View style={styles.popup}>
                <Text style={styles.title}>Nearby Gyms</Text>
                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

                {mapComponent}

                <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
                <TouchableOpacity style={styles.button} onPress={() => setVisible(false)}>
                    <Text style={styles.buttonText}>{"Close Gym Search"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    map: {
        flex: 1
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    popup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        marginVertical: '3%',
        borderRadius: '15px',
        overflowX: 'hidden',
        overflowY: 'scroll',
        padding: '2%'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 10,
    },
    searchButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        width: '30%',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    searchResults: {
        width: '80%',
        height: '45%',
        overflowX: 'hidden',
        overflowY: 'scroll',
        boxShadow: 'inset 3px 3px 10px #0007',
        borderRadius: '10px',
        marginBottom: 10,
        padding: '2%'
    },
    questionContainer: {
        alignItems: 'center',
        marginHorizontal: 50,
    },
    questionText: {
        fontSize: 17,
        lineHeight: 24,
        textAlign: 'center',
    },
});
