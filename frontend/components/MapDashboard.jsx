"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import for React-Leaflet wrapper to avoid SSR issues
const LeafletMap = dynamic(() => import("./LeafletMap"), { 
  ssr: false, 
  loading: () => (
    <div className="flex h-96 items-center justify-center text-slate-400">
      <Loader2 className="mr-2 animate-spin" size={24} /> Loading Map Engine...
    </div>
  )
});

// Dummy Plot Coordinates (representing Khasras in a village)
const DUMMY_PLOTS = [
  {
    id: 1,
    khasra_no: "124/2",
    owner_name: "Rajesh Kumar",
    area: "2.5 Hectare",
    status: "Verified",
    color: "#22c55e",
    positions: [
      [26.8467, 80.9462],
      [26.8475, 80.9465],
      [26.8470, 80.9480],
      [26.8460, 80.9475],
    ],
  },
  {
    id: 2,
    khasra_no: "125/1",
    owner_name: "Anita Devi",
    area: "1.2 Hectare",
    status: "Pending Verification",
    color: "#eab308",
    positions: [
      [26.8475, 80.9465],
      [26.8485, 80.9470],
      [26.8480, 80.9485],
      [26.8470, 80.9480],
    ],
  },
  {
    id: 3,
    khasra_no: "126",
    khata_no: "45",
    district: "Lucknow",
    block: "Sadar",
    owner_name: "Suresh Singh",
    area: "3.0 Hectare",
    status: "Verified",
    color: "#22c55e",
    positions: [
      [26.8460, 80.9475],
      [26.8470, 80.9480],
      [26.8465, 80.9495],
      [26.8450, 80.9490],
    ],
  }
];

export default function MapDashboard() {
  const [plots, setPlots] = useState(DUMMY_PLOTS);
  
  // Filter states
  const [filters, setFilters] = useState({
    country: "India",
    state: "Uttar Pradesh",
    district: "",
    block: "",
    khata: "",
    khasra: "",
    owner: ""
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    // Fetch data from backend
    const fetchPlots = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/gis/plots");
        if (response.ok) {
          const data = await response.json();
          // Convert GeoJSON to our frontend format
          const formattedPlots = data.features.map((f, i) => ({
            id: f.properties.id || i + 100,
            khasra_no: f.properties.khasra_no || "",
            khata_no: f.properties.khata_no || "",
            district: f.properties.district || "",
            block: f.properties.block || "",
            owner_name: f.properties.owner_name || "Unknown",
            area: f.properties.area_sqm ? `${f.properties.area_sqm} sqm` : "Unknown",
            status: "Pending Verification",
            color: "#eab308",
            positions: f.geometry.coordinates[0].map(coord => [coord[1], coord[0]]), // Leaflet expects [lat, lng]
          }));
          if (formattedPlots.length > 0) {
            setPlots(prev => {
              // Combine and remove duplicates by ID just in case
              const map = new Map();
              [...DUMMY_PLOTS, ...formattedPlots].forEach(p => map.set(p.id, p));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch plots", err);
      }
    };
    
    fetchPlots();
  }, []);

  // Apply filters
  const filteredPlots = plots.filter(plot => {
    if (filters.district && !plot.district?.toLowerCase().includes(filters.district.toLowerCase())) return false;
    if (filters.block && !plot.block?.toLowerCase().includes(filters.block.toLowerCase())) return false;
    if (filters.khata && !plot.khata_no?.toLowerCase().includes(filters.khata.toLowerCase())) return false;
    if (filters.khasra && !plot.khasra_no?.toLowerCase().includes(filters.khasra.toLowerCase())) return false;
    if (filters.owner && !plot.owner_name?.toLowerCase().includes(filters.owner.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500">Country</label>
          <input type="text" name="country" value={filters.country} onChange={handleFilterChange} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500" disabled />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500">State</label>
          <input type="text" name="state" value={filters.state} onChange={handleFilterChange} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-slate-50 text-slate-500" disabled />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-slate-500">District</label>
          <input type="text" name="district" value={filters.district} onChange={handleFilterChange} placeholder="e.g. Lucknow" className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
          <label className="text-xs font-semibold text-slate-500">Block / Tehsil</label>
          <input type="text" name="block" value={filters.block} onChange={handleFilterChange} placeholder="Search block..." className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
          <label className="text-xs font-semibold text-slate-500">Khata No</label>
          <input type="text" name="khata" value={filters.khata} onChange={handleFilterChange} placeholder="Search khata..." className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
          <label className="text-xs font-semibold text-slate-500">Khasra No</label>
          <input type="text" name="khasra" value={filters.khasra} onChange={handleFilterChange} placeholder="Search khasra..." className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-slate-500">Owner Name</label>
          <input type="text" name="owner" value={filters.owner} onChange={handleFilterChange} placeholder="Search owner..." className="px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500" />
        </div>
      </div>

      <div className="h-[600px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
        <LeafletMap plots={filteredPlots} />
      </div>
    </div>
  );
}
