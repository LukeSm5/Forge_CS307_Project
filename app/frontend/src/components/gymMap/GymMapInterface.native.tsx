import { Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';
import React, { useEffect, useState } from 'react';
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import Constants from 'expo-constants';
import { Modal } from 'react-native';
import ForgeButton from '../ForgeButton';

const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.OS === 'web'
    ? 'http://localhost:8000'
    : expoHost
      ? `http://${expoHost}:8000`
      : 'http://localhost:8000');

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
        const url = `${BASE_URL}/gyms?lat=${lat}&lng=${lng}&radius=3000`;

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();

        setGyms(data.results);
    };

    let mapComponent: React.JSX.Element;
    if (!location) {
        mapComponent = (<Text style={styles.title}>Location disabled.</Text>);
    } else if (Platform.OS === 'web') {
        const mapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=14&output=embed`;

        mapComponent = (
            <iframe
                src={mapUrl}
                style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    borderRadius: 10,
                }}
                loading="lazy"
            />
        );
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

    const s = useScheme();
    return (<Modal style={{ backgroundColor: s.backdrop }}>
        <View style={styles.container}>
            <View style={styles.popup}>
                <Text style={styles.title}>Nearby Gyms</Text>
                <Separator />

                {mapComponent}

                <Separator />
                <ForgeButton text="Close Gym Search" onPress={() => setVisible(false)} />
            </View>
        </View>
    </Modal>);
}

const styles = StyleSheet.create({
    map: {
        flex: 1
    },
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        ...StyleSheet.absoluteFill,
    },
    popup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '75%',
        marginVertical: '3%',
        borderRadius: '15px',
        padding: '2%',
        zIndex: 100,
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
