import { Modal, Platform, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { Separator, Text, useScheme, View } from '@/components/Themed';
import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';

import * as Location from "expo-location";
import "leaflet/dist/leaflet.css";
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
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [leaflet, setLeaflet] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const L = require("leaflet");

            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });

            const rl = require("react-leaflet");

            setLeaflet({
                MapContainer: rl.MapContainer,
                TileLayer: rl.TileLayer,
                Marker: rl.Marker,
                Popup: rl.Popup
            });

            setLeafletLoaded(true);
        }
    }, []);
    
    const [location, setLocation] = useState<Location.LocationObjectCoords | undefined>(undefined);
    const [gyms, setGyms] = useState([]);

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

    useEffect(() => {
        if (visible)
            getLocation();
        else
            setVisible(false);
    }, [visible]);

    if (!visible)
        return (<></>);

    let mapComponent: React.JSX.Element;
    if (!location || !leafletLoaded || !leaflet) {
        mapComponent = (<Text style={styles.title}>Location disabled.</Text>);
    } else {
        const { MapContainer, TileLayer, Marker, Popup } = leaflet;
        mapComponent = (
            <MapContainer
                {...({center: [location.latitude, location.longitude]} as any)}
                zoom={14}
                style={{ height: "400px", width: "100%", borderRadius: 10 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User marker */}
                <Marker position={[location.latitude, location.longitude]}>
                    <Popup>You</Popup>
                </Marker>

                {/* Gym markers */}
                {gyms.map((gym) => (
                    <Marker
                        key={gym.place_id}
                        position={[
                            gym.lat,
                            gym.lng
                        ]}
                    >
                        <Popup>
                            <strong>{gym.name}</strong><br />
                            {gym.vicinity}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        );
    }

    const s = useScheme();
    return (<Modal style={{ ...styles.container, backgroundColor: s.backdrop }}>
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
