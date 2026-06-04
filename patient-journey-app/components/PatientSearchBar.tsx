"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PatientSearchResult } from "@/lib/types";

interface PatientSearchBarProps {
  onSelect: (patientId: string) => void;
  disabled?: boolean;
}

export default function PatientSearchBar({
  onSelect,
  disabled,
}: PatientSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/patient/search?q=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      setResults(data.patients || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setFocusedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function handleSelect(patientId: string) {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    onSelect(patientId);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[focusedIndex].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div className="search-input-wrapper">
        <svg
          className="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="16"
          height="16"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          id="patient-search"
          className="input search-input"
          type="text"
          placeholder="Search by patient name or ID..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div
            className="spinner"
            style={{ width: 14, height: 14, position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}
          />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((patient, i) => (
            <button
              key={patient.id}
              className={`search-result-item ${i === focusedIndex ? "focused" : ""}`}
              onClick={() => handleSelect(patient.id)}
              onMouseEnter={() => setFocusedIndex(i)}
            >
              <div className="search-result-name">{patient.name}</div>
              <div className="search-result-meta">
                <span className="badge badge-teal">
                  {patient.medical_condition || "No condition"}
                </span>
                <span className="search-result-gender">
                  {patient.gender || ""} {patient.date_of_birth ? `• DOB: ${patient.date_of_birth}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !loading && query.trim().length >= 2 && (
        <div className="search-dropdown">
          <div className="search-no-results">No patients found</div>
        </div>
      )}
    </div>
  );
}
