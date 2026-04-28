import { useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoBox } from "@react-google-maps/api";

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

const getDisruptionColor = (severity) => {
  if (severity === "high") return "#ff4444";
  if (severity === "medium") return "#ffaa00";
  return "#666666";
};

export function LogisticsMap({ nodes = [], edges = [], shipments = [], disruptions = [], filteredCorridorIds = null }) {
  const [selected, setSelected] = useState(null);
  const [infoBox, setInfoBox] = useState(null);

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

  const disruptedNodeIds = new Set(
    disruptions.filter(d => d.active && d.target_type === "node").flatMap(d => d.target_values || [])
  );
  const disruptedEdgeIds = new Set(
    disruptions.filter(d => d.active && d.target_type === "edge").flatMap(d => d.target_values || [])
  );
  const disruptedCorridorIds = new Set(
    disruptions.filter(d => d.active && d.target_type === "corridor").flatMap(d => d.target_values || [])
  );

  const routePaths = edges.map(edge => {
    const from = nodes.find(n => n.id === edge.from_node);
    const to = nodes.find(n => n.id === edge.to_node);
    if (!from || !to) return null;

    const isDisrupted = disruptedEdgeIds.has(edge.id) ||
      disruptedNodeIds.has(edge.from_node) ||
      disruptedNodeIds.has(edge.to_node);

    const corridorId = `corr_${from.id}_${to.id}`;
    const reverseCorridorId = `corr_${to.id}_${from.id}`;
    const matchesFilter = !filteredCorridorIds ||
      filteredCorridorIds.includes(corridorId) ||
      filteredCorridorIds.includes(reverseCorridorId);

    return {
      path: [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }],
      isDisrupted,
      isvisible: matchesFilter,
      edge,
    };
  }).filter(Boolean);

  const getNodeShipments = (nodeId) => {
    return shipments.filter(s => {
      const corridor = edges.find(e =>
        (e.from_node === s.shipment?.corridor_id?.split('_')[1] && e.to_node === nodeId) ||
        (e.to_node === s.shipment?.corridor_id?.split('_')[1] && e.from_node === nodeId)
      );
      return corridor;
    });
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={5}
      center={center}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {nodes.map((node) => {
        const nodeShipments = getNodeShipments(node.id);
        const hasDisruption = disruptedNodeIds.has(node.id);
        const risk = nodeShipments.length > 0
          ? Math.max(...nodeShipments.map(s => s.recommendation?.expected_impact?.risk || 0))
          : 0;

        return (
          <Marker
            key={node.id}
            position={{ lat: node.lat, lng: node.lng }}
            onClick={() => setSelected(selected === node.id ? null : node.id)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: nodeShipments.length > 0 ? 8 + nodeShipments.length : 6,
              fillColor: hasDisruption ? "#ff4444" : risk >= 5 ? "#ffaa00" : "#0099ff",
              fillOpacity: 1,
              strokeColor: hasDisruption ? "#ff4444" : risk >= 5 ? "#ffaa00" : "#0099ff",
              strokeWeight: 2,
            }}
          />
        );
      })}

      {routePaths.filter(r => r.isvisible).map((route, i) => (
        <Polyline
          key={i}
          path={route.path}
          options={{
            strokeColor: route.isDisrupted ? "#ff4444" : "rgba(0, 153, 255, 0.5)",
            strokeWeight: route.isDisrupted ? 3 : 2,
            strokeOpacity: route.isDisrupted ? 1 : 0.5,
          }}
        />
      ))}

      {selected && (() => {
        const node = nodes.find(n => n.id === selected);
        if (!node) return null;
        const nodeShipments = getNodeShipments(node.id);
        const nodeDisruptions = disruptions.filter(d =>
          d.active && d.target_values?.includes(node.id)
        );
        return (
          <InfoBox
            position={{ lat: node.lat, lng: node.lng }}
            options={{
              closeBoxURL: "",
              enableEventPropagation: true,
              pixelOffset: new google.maps.Size(0, -30),
            }}
          >
            <div className="bg-[#090909] border border-[rgba(0,153,255,0.15)] rounded-[10px] p-3 min-w-[200px]">
              <h4 className="text-white font-[500] text-[14px] mb-2">{node.name}</h4>
              {nodeDisruptions.length > 0 && (
                <div className="mb-2">
                  <span className="text-[#ff4444] text-[12px]">{nodeDisruptions.length} active disruption(s)</span>
                </div>
              )}
              <div className="text-[#a6a6a6] text-[12px]">
                {nodeShipments.length} shipment(s) via this node
              </div>
            </div>
          </InfoBox>
        );
      })()}
    </GoogleMap>
  );
}

export default LogisticsMap;