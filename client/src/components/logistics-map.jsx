import { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 22.5, lng: 78.5 };

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#a6a6a6" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1a2a" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  ],
};

export function LogisticsMap({ nodes = [], edges = [], shipments = [], disruptions = [] }) {
  const [selected, setSelected] = useState(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const center = nodes.length > 0
    ? { lat: nodes.reduce((s, n) => s + n.lat, 0) / nodes.length, lng: nodes.reduce((s, n) => s + n.lng, 0) / nodes.length }
    : defaultCenter;

  const onMapLoad = useCallback((map) => {
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-full bg-[#090909] rounded-[15px] flex items-center justify-center text-[#a6a6a6]">
        Failed to load map
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-[#090909] rounded-[15px] flex items-center justify-center text-[#a6a6a6]">
        Loading map...
      </div>
    );
  }

  const routePaths = edges.map(edge => {
    const from = nodes.find(n => n.id === edge.from_node);
    const to = nodes.find(n => n.id === edge.to_node);
    if (!from || !to) return null;
    return [
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
    ];
  }).filter(Boolean);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={5}
      center={center}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {nodes.map((node) => {
        const nodeShipments = shipments.filter(s => s.shipment?.corridor_id?.includes(node.id));
        const hasDisruption = disruptions.some(d => d.target_values?.includes(node.id) && d.active);
        return (
          <Marker
            key={node.id}
            position={{ lat: node.lat, lng: node.lng }}
            onClick={() => setSelected(node)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: nodeShipments.length > 0 ? 8 + nodeShipments.length : 6,
              fillColor: hasDisruption ? "#ff4444" : "#0099ff",
              fillOpacity: 1,
              strokeColor: hasDisruption ? "#ff4444" : "#0099ff",
              strokeWeight: 2,
            }}
          />
        );
      })}

      {routePaths.map((path, i) => (
        <Polyline
          key={i}
          path={path}
          options={{
            strokeColor: "rgba(0, 153, 255, 0.5)",
            strokeWeight: 2,
          }}
        />
      ))}

      {shipments.map((s) => {
        if (!s.shipment?.corridor_id) return null;
        const corridor = edges.find(e => e.from_node === s.shipment.corridor_id?.split('_')[1]);
        if (!corridor) return null;
        return null;
      })}
    </GoogleMap>
  );
}

export default LogisticsMap;