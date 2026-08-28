"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getRelationshipMap,
  RelationshipMapResponseDto,
  RelationshipNodeDto,
} from "@/api+/sap/relationshipMap/relationshipMapService";
import {
  Loader2,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Building2,
  FileText,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface RelationshipMapModalProps {
  open: boolean;
  onClose: () => void;
  docType: number;
  docEntry: number;
  docNum?: number | string;
}

interface PositionedNode extends RelationshipNodeDto {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function RelationshipMapModal({
  open,
  onClose,
  docType,
  docEntry,
  docNum,
}: RelationshipMapModalProps) {
  const [data, setData] = useState<RelationshipMapResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan / Drag State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (open && docType > 0 && docEntry > 0) {
      setIsLoading(true);
      getRelationshipMap(docType, docEntry)
        .then((res) => {
          setData(res);
          setZoom(1);
        })
        .catch((err) => {
          console.error("Failed to load relationship map", err);
          toast.error("Failed to load relationship map for this document.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setData(null);
    }
  }, [open, docType, docEntry]);

  // Layout calculations
  const CARD_WIDTH = 185;
  const CARD_HEIGHT = 105;
  const COL_GAP = 120;
  const ROW_GAP = 40;
  const START_X = 60;
  const START_Y = 160;

  const { positionedNodes, bpNode, canvasWidth, canvasHeight } = useMemo(() => {
    if (!data || !data.Nodes || data.Nodes.length === 0) {
      return {
        positionedNodes: [],
        bpNode: null,
        canvasWidth: 900,
        canvasHeight: 500,
      };
    }

    // Group nodes by Level
    const levelsMap = new Map<number, RelationshipNodeDto[]>();
    data.Nodes.forEach((node) => {
      const lvl = node.Level || 0;
      if (!levelsMap.has(lvl)) {
        levelsMap.set(lvl, []);
      }
      levelsMap.get(lvl)!.push(node);
    });

    const positioned: PositionedNode[] = [];
    const sortedLevels = Array.from(levelsMap.keys()).sort((a, b) => a - b);

    let maxRight = 900;
    let maxBottom = 500;

    sortedLevels.forEach((level, colIdx) => {
      const nodesInLevel = levelsMap.get(level)!;
      const x = START_X + colIdx * (CARD_WIDTH + COL_GAP);

      nodesInLevel.forEach((node, rowIdx) => {
        const y = START_Y + rowIdx * (CARD_HEIGHT + ROW_GAP);
        positioned.push({
          ...node,
          x,
          y,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        });

        if (x + CARD_WIDTH + 100 > maxRight) maxRight = x + CARD_WIDTH + 100;
        if (y + CARD_HEIGHT + 100 > maxBottom) maxBottom = y + CARD_HEIGHT + 100;
      });
    });

    // Position Business Partner Card at top left
    const bp = data.BusinessPartner
      ? {
          cardCode: data.BusinessPartner.CardCode,
          cardName: data.BusinessPartner.CardName,
          x: 40,
          y: 30,
          width: 175,
          height: 75,
        }
      : null;

    return {
      positionedNodes: positioned,
      bpNode: bp,
      canvasWidth: Math.max(maxRight, 1000),
      canvasHeight: Math.max(maxBottom, 550),
    };
  }, [data]);

  // Create node lookup by ID
  const nodeMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positionedNodes.forEach((n) => map.set(n.Id, n));
    return map;
  }, [positionedNodes]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setScrollStart({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    containerRef.current.scrollLeft = scrollStart.left - dx;
    containerRef.current.scrollTop = scrollStart.top - dy;
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        className="!max-w-[90vw] !w-screen h-[88vh] p-0 flex flex-col overflow-hidden border border-slate-300 shadow-2xl rounded-lg bg-white"
        style={{ width: "100vw", maxWidth: "100vw" }}
      >
        {/* Window Title Header */}
        <DialogHeader className="px-5 py-2.5 border-b border-slate-200 bg-[#1E3A5F] text-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-400" />
            <DialogTitle className="text-sm font-semibold tracking-wide text-white">
              Relationship Map {docNum ? `- Document #${docNum}` : ""}
            </DialogTitle>
          </div>

          {/* Zoom and Navigation Controls */}
          <div className="flex items-center gap-1.5 mr-8">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-semibold text-white/90 w-11 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 ml-1"
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Canvas Body */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative flex-1 w-full h-full overflow-auto bg-[#FFFFFF] select-none p-6 ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(#E2E8F0 1.2px, transparent 1.2px)",
            backgroundSize: "24px 24px",
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E3A5F]" />
              <span className="text-xs font-medium">
                Loading relationship map...
              </span>
            </div>
          ) : !data || positionedNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <Building2 className="h-10 w-10 stroke-1" />
              <span className="text-xs">
                No relationship data found for this document.
              </span>
            </div>
          ) : (
            <div
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${zoom})`,
                transformOrigin: "0 0",
                transition: isPanning ? "none" : "transform 0.12s ease-out",
              }}
              className="relative"
            >
              {/* SVG Connectors / Directional Arrows */}
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: `${canvasWidth}px`,
                  height: `${canvasHeight}px`,
                }}
              >
                <defs>
                  {/* Standard Blue Arrow Marker */}
                  <marker
                    id="sap-arrow-blue"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#7B9BB5" />
                  </marker>

                  {/* Yellow/Gold Payment Arrow Marker */}
                  <marker
                    id="sap-arrow-gold"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#E5A823" />
                  </marker>
                </defs>

                {(data.Edges || []).map((edge, idx) => {
                  const source = nodeMap.get(edge.From);
                  const target = nodeMap.get(edge.To);
                  if (!source || !target) return null;

                  const startX = source.x + source.width;
                  const startY = source.y + source.height / 2;
                  const endX = target.x;
                  const endY = target.y + target.height / 2;

                  const isPaymentLink =
                    edge.ToObjType === 24 || edge.ToObjType === 46;
                  const strokeColor = isPaymentLink ? "#E5A823" : "#85A4BD";
                  const markerId = isPaymentLink
                    ? "url(#sap-arrow-gold)"
                    : "url(#sap-arrow-blue)";

                  const dx = endX - startX;

                  // Clean straight arrow if vertically aligned, smooth bezier curve if vertically offset
                  const pathD =
                    Math.abs(startY - endY) < 3
                      ? `M ${startX} ${startY} L ${endX} ${endY}`
                      : `M ${startX} ${startY} C ${startX + dx * 0.45} ${startY}, ${
                          startX + dx * 0.55
                        } ${endY}, ${endX} ${endY}`;

                  return (
                    <path
                      key={`edge-${idx}-${edge.From}-${edge.To}`}
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="2.5"
                      markerEnd={markerId}
                    />
                  );
                })}
              </svg>

              {/* Business Partner Box (Top Left) */}
              {bpNode && (
                <div
                  style={{
                    position: "absolute",
                    left: `${bpNode.x}px`,
                    top: `${bpNode.y}px`,
                    width: `${bpNode.width}px`,
                    height: `${bpNode.height}px`,
                  }}
                  className="rounded border border-[#8FAFC9] bg-white shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="bg-[#CFE2F3] border-b border-[#8FAFC9] py-1 px-2 text-center text-[11px] font-bold text-[#1E3A5F] truncate">
                    Business Partners
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-center text-[11px] leading-tight text-slate-700 bg-white">
                    <span className="font-bold text-slate-900 truncate">
                      {bpNode.cardCode}
                    </span>
                    <span className="text-[10px] text-slate-600 truncate mt-0.5">
                      {bpNode.cardName}
                    </span>
                  </div>
                </div>
              )}

              {/* Document Nodes */}
              {positionedNodes.map((node) => {
                const isClosed = node.DocStatus === "C";
                const isCurrent = node.IsCurrent;

                return (
                  <div
                    key={node.Id}
                    style={{
                      position: "absolute",
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                    }}
                    className={`rounded border shadow-sm flex flex-col bg-white transition-all overflow-hidden ${
                      isCurrent
                        ? "border-[#D4B830] ring-2 ring-[#EDC93A]/50 shadow-md"
                        : "border-[#8FAFC9]"
                    }`}
                  >
                    {/* Header Bar */}
                    <div
                      className={`py-1 px-2 text-center text-[11px] font-bold truncate border-b ${
                        isCurrent
                          ? "bg-[#FFF2A8] text-[#5C4505] border-[#D4B830]"
                          : "bg-[#CFE2F3] text-[#1E3A5F] border-[#8FAFC9]"
                      }`}
                    >
                      {node.DocTypeName}
                    </div>

                    {/* Body */}
                    <div className="relative flex-1 p-2 flex flex-col justify-between bg-white">
                      {/* Top Row: Lock Icon (Left) & DocNum / Date (Right) */}
                      <div className="flex items-start justify-between">
                        {/* Golden Lock Icon */}
                        <div className="mt-0.5">
                          {isClosed ? (
                            <div
                              title="Closed Document"
                              className="w-4 h-4 rounded-full bg-[#E5C158]/30 flex items-center justify-center text-[#B88E1C]"
                            >
                              <Lock className="h-3 w-3" />
                            </div>
                          ) : (
                            <div
                              title="Open Document"
                              className="w-4 h-4 rounded-full bg-[#E5C158]/30 flex items-center justify-center text-[#B88E1C]"
                            >
                              <Unlock className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        {/* Doc Number & Date */}
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[12px] font-bold text-slate-900 tracking-tight">
                            {node.DocNum}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            {node.DocDate}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Currency & Total Amount */}
                      <div className="flex items-center justify-end text-[11px] font-bold text-slate-800 leading-none">
                        <span>
                          {node.DocCur}{" "}
                          {Number(node.DocTotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Red bottom bar for Open documents */}
                    {!isClosed && (
                      <div
                        className="h-1.5 w-full bg-[#E53E3E]"
                        title="Open Document"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SAP-Style Bottom Bar */}
        <div className="px-4 py-2 border-t border-slate-200 bg-[#F1F5F9] flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">View:</span>
            <span className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800">
              Marketing Document: Document Tree
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onClose}
              className="bg-[#1E3A5F] hover:bg-[#162A45] text-white h-7 px-4 text-xs font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}