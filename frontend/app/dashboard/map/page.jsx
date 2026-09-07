"use client";

import DashboardShell from "@/components/DashboardShell";
import MapDashboard from "@/components/MapDashboard";
import { MapIcon, Layers, Info } from "lucide-react";

export default function MapPage() {
  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-slate-900 flex items-center gap-2">
            <MapIcon className="text-forest-700" size={24} />
            GIS Interactive Map
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visual representation of verified land records on interactive geospatial polygons.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <MapDashboard />
        </div>
        
        {/* Sidebar Legend */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4 border-b pb-3">
            <Layers size={18} /> Map Layers
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm bg-[#22c55e] border border-[#16a34a] opacity-60"></div>
              <span className="text-sm font-medium text-slate-700">Verified Plots</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm bg-[#eab308] border border-[#ca8a04] opacity-60"></div>
              <span className="text-sm font-medium text-slate-700">Pending Verification</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm border border-slate-300 border-dashed bg-slate-100 opacity-60"></div>
              <span className="text-sm font-medium text-slate-700">Unmapped Area</span>
            </div>
          </div>
          
          <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-100">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-2">
              <Info size={16} /> Instructions
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Click on any colored polygon to view the linked Bhulekh digital record. 
              Only verified records are accessible to the public, but Patwaris can view pending records here.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
