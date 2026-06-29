"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  theme?: "emerald" | "orange";
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  theme = "emerald",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the currently selected option to display its label
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const themeClasses = {
    emerald: {
      focusRing: "focus:ring-emerald-500/20",
      activeTrigger: "border-emerald-300 bg-emerald-50/50 text-emerald-700",
      hoverTrigger: "hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700",
      activeOption: "bg-emerald-50 font-medium text-emerald-700",
      hoverOption: "text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700",
    },
    orange: {
      focusRing: "focus:ring-orange-500/20",
      activeTrigger: "border-orange-300 bg-orange-50/50 text-orange-700",
      hoverTrigger: "hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-700",
      activeOption: "bg-orange-50 font-medium text-orange-700",
      hoverOption: "text-slate-600 hover:bg-orange-50/50 hover:text-orange-700",
    },
  }[theme];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border bg-white/90 px-5 py-3.5 text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 ${themeClasses.focusRing} ${
          isOpen
            ? themeClasses.activeTrigger
            : `border-slate-200 text-slate-700 ${themeClasses.hoverTrigger}`
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <style>{`
            @keyframes dropdownScaleIn {
              from {
                opacity: 0;
                transform: translateY(-8px) scale(0.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes selectSlideUpFade {
              from {
                opacity: 0;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .dropdown-menu-animate {
              animation: dropdownScaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              transform-origin: top;
            }
            .select-option-animate {
              opacity: 0;
              animation: selectSlideUpFade 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="absolute z-[999] mt-2 max-h-60 w-full min-w-[200px] overflow-auto rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-200/50 outline-none dropdown-menu-animate">
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{ animationDelay: `${index * 25}ms` }}
                  className={`select-option-animate flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                    isSelected
                      ? themeClasses.activeOption
                      : themeClasses.hoverOption
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
