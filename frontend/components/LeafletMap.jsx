"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export default function LeafletMap({ plots }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const L = require('leaflet');
    
    // Fix default marker icon
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    if (!mapInstance.current && mapRef.current) {
      // Initialize map
      mapInstance.current = L.map(mapRef.current).setView([26.8470, 80.9475], 17);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    // Clear existing layers if any
    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        mapInstance.current.removeLayer(layer);
      }
    });

    // Add plots
    if (plots && plots.length > 0) {
      plots.forEach((plot) => {
        const polygon = L.polygon(plot.positions, {
          color: plot.color,
          fillColor: plot.color,
          fillOpacity: 0.4,
          weight: 2
        }).addTo(mapInstance.current);

        const popupContent = `
          <div style="padding: 4px;">
            <h3 style="font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">Khasra No: ${plot.khasra_no}</h3>
            <p style="margin: 2px 0;"><strong>Owner:</strong> ${plot.owner_name}</p>
            <p style="margin: 2px 0;"><strong>Area:</strong> ${plot.area}</p>
            <p style="margin: 2px 0;"><strong>Khata No:</strong> ${plot.khata_no || 'N/A'}</p>
            <p style="margin: 2px 0;"><strong>Status:</strong> <span style="color: ${plot.status === 'Verified' ? 'green' : '#d97706'}">${plot.status}</span></p>
          </div>
        `;
        polygon.bindPopup(popupContent);

        // Hover tooltip
        const tooltipContent = `
          <div>
            <strong>Khasra:</strong> ${plot.khasra_no}<br/>
            <strong>Khata:</strong> ${plot.khata_no || 'N/A'}<br/>
            <strong>Owner:</strong> ${plot.owner_name}<br/>
            <strong>Area:</strong> ${plot.area}
          </div>
        `;
        polygon.bindTooltip(tooltipContent, { sticky: true, className: 'custom-leaflet-tooltip' });
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [plots]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", zIndex: 0 }} />;
}
