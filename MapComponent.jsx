import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

const parkingLots = [
  { id: 1, name: "Central Parking", lat: 28.6139, lng: 77.2090 },
  { id: 2, name: "Metro Lot", lat: 28.6100, lng: 77.2300 },
  { id: 3, name: "City Mall Lot", lat: 28.6155, lng: 77.2200 }
];

const SearchResult = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14);
    }
  }, [coords]);
  return null;
};

const MapComponent = () => {
  const [userPosition, setUserPosition] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [route, setRoute] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error(err)
    );
  }, []);

  const searchPlace = async (query) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`);
      if (res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setSearchResult([parseFloat(lat), parseFloat(lon)]);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const getRoute = (dest) => {
    const apiKey = 'YOUR_OPENROUTESERVICE_KEY'; // Replace with your real key

    if (!userPosition) return;

    axios
      .post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [[userPosition[1], userPosition[0]], dest] // [lng, lat]
        },
        {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json'
          }
        }
      )
      .then((res) => {
        const coords = res.data.features[0].geometry.coordinates;
        const converted = coords.map(([lng, lat]) => [lat, lng]);
        setRoute(converted);
      })
      .catch((err) => console.error('Route error:', err));
  };

  return (
    <>
      <input
        type="text"
        placeholder="Search location..."
        onKeyDown={(e) => {
          if (e.key === 'Enter') searchPlace(e.target.value);
        }}
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: 10,
          left: 10,
          padding: '8px',
          width: '250px',
          borderRadius: '4px'
        }}
      />
      <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: "100vh" }}>
        <TileLayer
          url="https://api.maptiler.com/maps/basic/256/{z}/{x}/{y}.png?key=YOUR_MAPTILER_KEY"
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
        />
        {searchResult && <SearchResult coords={searchResult} />}

        {userPosition && (
          <Marker position={userPosition}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {parkingLots.map(lot => (
          <Marker key={lot.id} position={[lot.lat, lot.lng]}>
            <Popup>
              {lot.name}
              <br />
              <button onClick={() => getRoute([lot.lng, lot.lat])}>Get Directions</button>
            </Popup>
          </Marker>
        ))}

        {route.length > 0 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </>
  );
};

export default MapComponent;
