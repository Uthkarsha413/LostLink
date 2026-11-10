"use client";

import { useEffect, useMemo, useState, useRef } from "react";

export interface LocationItem {
  locationId: number;
  parentLocationId: number | null;
  locationCode: string | null;
  locationName: string;
  locationType: "CAMPUS" | "BLOCK" | "FLOOR" | "ROOM" | "AREA";
  floorNumber: number | null;
  floorName: string | null;
  roomType?: string | null;
  departmentOrUse?: string | null;
  dataStatus: "PROVISIONAL" | "VERIFIED" | "INACTIVE";
}

interface Props {
  locations: LocationItem[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function CampusLocationSelector({ locations, selectedId, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build ID-to-node map and parent-to-children tree
  const { nodeMap, blockGroups, flatSelectable } = useMemo(() => {
    const map = new Map<number, LocationItem>();
    locations.forEach((loc) => map.set(loc.locationId, loc));

    // Calculate full breadcrumb path
    function getBreadcrumb(loc: LocationItem): string[] {
      const parts: string[] = [loc.locationName];
      let curr = loc;
      while (curr.parentLocationId && map.has(curr.parentLocationId)) {
        curr = map.get(curr.parentLocationId)!;
        parts.unshift(curr.locationName);
      }
      return parts;
    }

    // Group by Block or Top-level Section
    const blocks: {
      block: LocationItem;
      floors: {
        floor: LocationItem;
        rooms: LocationItem[];
      }[];
      directRooms: LocationItem[];
    }[] = [];

    // Find all blocks / top areas
    const blockList = locations.filter(
      (l) => l.locationType === "BLOCK" || (l.locationType === "AREA" && l.parentLocationId === 1)
    );

    blockList.forEach((b) => {
      // Find children of this block
      const childFloors = locations.filter(
        (l) => l.parentLocationId === b.locationId && (l.locationType === "FLOOR" || l.locationType === "AREA")
      );

      const floorsData = childFloors.map((f) => {
        const rooms = locations.filter((r) => r.parentLocationId === f.locationId);
        return { floor: f, rooms };
      });

      const directRooms = locations.filter(
        (r) => r.parentLocationId === b.locationId && r.locationType !== "FLOOR" && r.locationType !== "AREA"
      );

      blocks.push({
        block: b,
        floors: floorsData,
        directRooms,
      });
    });

    const flat = locations.map((loc) => ({
      ...loc,
      breadcrumb: getBreadcrumb(loc),
    }));

    return { nodeMap: map, blockGroups: blocks, flatSelectable: flat };
  }, [locations]);

  const selectedLocation = useMemo(() => {
    const id = Number(selectedId);
    return id ? nodeMap.get(id) : null;
  }, [selectedId, nodeMap]);

  // Selected Breadcrumb Details for the Card Preview
  const selectedDetails = useMemo(() => {
    if (!selectedLocation) return null;
    const parts: LocationItem[] = [];
    let curr: LocationItem | undefined = selectedLocation;
    while (curr) {
      parts.unshift(curr);
      curr = curr.parentLocationId ? nodeMap.get(curr.parentLocationId) : undefined;
    }

    const campus = parts.find((p) => p.locationType === "CAMPUS")?.locationName || "PES University RR Campus";
    const block = parts.find((p) => p.locationType === "BLOCK")?.locationName || parts[1]?.locationName || "Campus Area";
    const floor = parts.find((p) => p.locationType === "FLOOR")?.locationName || null;
    const room = selectedLocation.locationName.replace(" (Provisional)", "");
    const roomCode = selectedLocation.locationCode;
    const typeLabel =
      selectedLocation.roomType ||
      (selectedLocation.locationType === "ROOM" ? "Classroom / Lab" : selectedLocation.locationType);
    const department = selectedLocation.departmentOrUse || (block.includes("BE") ? "Engineering / AIML / ECE" : null);

    return {
      campus,
      block,
      floor,
      room,
      roomCode,
      typeLabel,
      department,
      status: selectedLocation.dataStatus,
    };
  }, [selectedLocation, nodeMap]);

  // Filtered list when searching
  const filteredList = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return flatSelectable.filter(
      (loc) =>
        loc.locationName.toLowerCase().includes(q) ||
        (loc.locationCode && loc.locationCode.toLowerCase().includes(q)) ||
        loc.breadcrumb.some((b) => b.toLowerCase().includes(q))
    );
  }, [search, flatSelectable]);

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* TRIGGER DROPDOWN BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-left text-sm text-white outline-none transition-all hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="text-base text-cyan-400">📍</span>
          {selectedLocation ? (
            <span className="font-semibold text-white truncate">
              {selectedDetails ? (
                <>
                  <span className="text-cyan-300 font-bold">{selectedDetails.block}</span>
                  {selectedDetails.floor && (
                    <span className="text-slate-400"> → {selectedDetails.floor}</span>
                  )}
                  <span className="text-white font-bold"> → {selectedDetails.room}</span>
                  {selectedLocation.dataStatus === "PROVISIONAL" && (
                    <span className="ml-2 rounded bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                      Provisional
                    </span>
                  )}
                </>
              ) : (
                selectedLocation.locationName
              )}
            </span>
          ) : (
            <span className="text-slate-400">Select campus location (PES RR Campus hierarchy)...</span>
          )}
        </div>
        <span className={`text-xs text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="relative z-50 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl backdrop-blur-2xl">
          {/* SEARCH BAR */}
          <div className="border-b border-slate-800 p-3">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search room (e.g. B0305, G04, Central Library, Panini)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                autoFocus
              />
            </div>
          </div>

          {/* LIST CONTAINER */}
          <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700">
            {/* SEARCH RESULTS MODE */}
            {filteredList ? (
              filteredList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No campus locations found matching &quot;{search}&quot;.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredList.map((loc) => {
                    const isSelected = String(loc.locationId) === selectedId;
                    return (
                      <button
                        key={loc.locationId}
                        type="button"
                        onClick={() => {
                          onChange(String(loc.locationId));
                          setIsOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-start justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-white">{loc.locationName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{loc.breadcrumb.join(" → ")}</p>
                        </div>
                        <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                          {loc.locationType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              /* TREE HIERARCHY ACCORDION MODE */
              <div className="space-y-2.5 font-mono text-xs">
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>🏢</span> PES University RR Campus
                </div>

                {blockGroups.map(({ block, floors, directRooms }) => (
                  <div key={block.locationId} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5">
                    {/* BLOCK HEADER */}
                    <div className="flex items-center justify-between text-indigo-300 font-bold text-xs pb-1 border-b border-slate-800/60">
                      <span className="flex items-center gap-1.5">
                        <span className="text-slate-500">|--</span>
                        <span>🏛️ {block.locationName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(String(block.locationId));
                          setIsOpen(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-sans"
                      >
                        Select Block
                      </button>
                    </div>

                    {/* DIRECT ROOMS/AREAS UNDER BLOCK */}
                    {directRooms.length > 0 && (
                      <div className="ml-4 mt-2 space-y-1">
                        {directRooms.map((r) => (
                          <button
                            key={r.locationId}
                            type="button"
                            onClick={() => {
                              onChange(String(r.locationId));
                              setIsOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                          >
                            <span>|-- {r.locationName}</span>
                            <span className="text-[9px] text-slate-500 font-sans">{r.locationType}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* FLOORS */}
                    <div className="ml-3 mt-2 space-y-2">
                      {floors.map(({ floor, rooms }) => (
                        <div key={floor.locationId} className="space-y-1">
                          <div className="flex items-center justify-between text-teal-400 font-semibold text-[11px]">
                            <span>
                              <span className="text-slate-600">|  |-- </span>
                              📁 {floor.locationName}
                            </span>
                            {rooms.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  onChange(String(floor.locationId));
                                  setIsOpen(false);
                                }}
                                className="text-[10px] text-slate-400 hover:text-cyan-300 underline font-sans"
                              >
                                Select Floor
                              </button>
                            )}
                          </div>

                          {/* ROOMS UNDER FLOOR */}
                          {rooms.length > 0 && (
                            <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-0.5">
                              {rooms.map((room) => {
                                const isSelected = String(room.locationId) === selectedId;
                                return (
                                  <button
                                    key={room.locationId}
                                    type="button"
                                    onClick={() => {
                                      onChange(String(room.locationId));
                                      setIsOpen(false);
                                    }}
                                    className={`flex items-center justify-between rounded-lg px-2 py-1 text-left transition-colors ${
                                      isSelected
                                        ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40"
                                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                    }`}
                                  >
                                    <span className="truncate">
                                      <span className="text-slate-600 mr-1">|--</span>
                                      {room.locationName}
                                    </span>
                                    {room.dataStatus === "PROVISIONAL" && (
                                      <span className="ml-1 text-[9px] text-amber-400/80 font-sans">
                                        (prov)
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SELECTED LOCATION HIERARCHY CARD (MAP FORMAT EXAMPLE) */}
      {selectedDetails && (
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/90 to-blue-950/30 p-4 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span>🗺️</span> Campus Location Breakdown
            </p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                selectedDetails.status === "VERIFIED"
                  ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
                  : "bg-amber-500/20 border border-amber-400/30 text-amber-300"
              }`}
            >
              {selectedDetails.status === "VERIFIED" ? "✓ Verified Location" : "⚠️ Provisional Verification"}
            </span>
          </div>

          {/* Tree-style ASCII Map Preview */}
          <div className="font-mono text-xs text-slate-300 space-y-1 bg-slate-950/80 rounded-xl p-3 border border-slate-800">
            <p className="text-slate-500">campus_locations</p>
            <p className="text-slate-500">|</p>
            <p className="text-cyan-300">|-- {selectedDetails.campus}</p>
            <p className="text-slate-600 pl-4">|</p>
            <p className="text-indigo-300 pl-4">|-- {selectedDetails.block}</p>
            {selectedDetails.floor && (
              <>
                <p className="text-slate-600 pl-8">|</p>
                <p className="text-teal-300 pl-8">|-- {selectedDetails.floor}</p>
              </>
            )}
            <p className="text-slate-600 pl-12">|</p>
            <p className="text-white font-bold pl-12 bg-cyan-500/10 py-1 rounded">
              |-- {selectedDetails.room}
            </p>

            <div className="mt-2.5 border-t border-slate-800/80 pt-2 font-sans grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Location Type:</span>{" "}
                <span className="font-semibold text-slate-200">{selectedDetails.typeLabel}</span>
              </div>
              <div>
                <span className="text-slate-500">Block:</span>{" "}
                <span className="font-semibold text-slate-200">{selectedDetails.block}</span>
              </div>
              {selectedDetails.floor && (
                <div>
                  <span className="text-slate-500">Floor:</span>{" "}
                  <span className="font-semibold text-slate-200">{selectedDetails.floor}</span>
                </div>
              )}
              {selectedDetails.roomCode && (
                <div>
                  <span className="text-slate-500">Room Code:</span>{" "}
                  <span className="font-semibold text-cyan-300">{selectedDetails.roomCode}</span>
                </div>
              )}
              {selectedDetails.department && (
                <div className="col-span-2">
                  <span className="text-slate-500">Department:</span>{" "}
                  <span className="font-semibold text-indigo-300">{selectedDetails.department}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
