"use client";

import { useState, useRef, useEffect } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function ImageComparisonSlider({ beforeImage, afterImage }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    const position = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(Math.max(position, 0), 100));
  };

  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-slate-100 border border-slate-200 cursor-ew-resize select-none h-[400px]"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0].clientX);
        }}
      >
        {/* After Image (Background) */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${afterImage})` }}
        />

        {/* Before Image (Foreground, clipped) */}
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${beforeImage})`,
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
          }}
        />

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center"
          style={{ left: `calc(${sliderPosition}% - 2px)` }}
        >
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-200 text-slate-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm font-medium z-10 pointer-events-none">
          Original
        </div>
        <div className="absolute bottom-4 right-4 bg-forest-700/80 text-white px-3 py-1 rounded text-sm font-medium z-10 pointer-events-none">
          AI Restored
        </div>
      </div>
      
      <p className="text-sm text-slate-500 mt-4 max-w-2xl text-center">
        Drag the slider to compare the original faded document with the AI-enhanced (deskewed & denoised) version ready for OCR extraction.
      </p>
    </div>
  );
}
