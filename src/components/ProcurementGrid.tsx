// src/components/ProcurementGrid.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { CheckSquare, Square, ExternalLink, Download, Search, Sparkles } from "lucide-react";

// Register all AG Grid Community modules (Required in AG Grid v33+)
ModuleRegistry.registerModules([AllCommunityModule]);

export interface ProcurementRow {
  id: string;
  name: string;
  category: string;
  merchant: string;
  price: number;
  quantity: number;
  imageUrl: string;
  productUrl: string;
  aiScore: number;
  aiReasoning: string;
  selected: boolean;
}

interface ProcurementGridProps {
  items: ProcurementRow[];
  budget: number;
  onItemsChange: (updated: ProcurementRow[]) => void;
}

const darkGridTheme = themeQuartz.withParams({
  backgroundColor: "#0f172a",
  foregroundColor: "#f8fafc",
  headerBackgroundColor: "#1e293b",
  headerTextColor: "#94a3b8",
  oddRowBackgroundColor: "#0f172a",
  rowHoverColor: "#1e293b",
  borderColor: "#334155",
  accentColor: "#3b82f6",
  fontFamily: "inherit",
  headerFontWeight: 600,
});

export default function ProcurementGrid({
  items,
  budget,
  onItemsChange,
}: ProcurementGridProps) {
  const gridRef = useRef<AgGridReact<ProcurementRow>>(null);
  const [quickFilterText, setQuickFilterText] = useState("");

  const toggleRowSelection = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, selected: !item.selected } : item
    );
    onItemsChange(updated);
  };

  const allocatedSpend = useMemo(
    () =>
      items
        .filter((i) => i.selected)
        .reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
    [items]
  );

  // Pinned Bottom Summary Row for real-time CFO budget tracking
  const pinnedBottomRowData = useMemo(
    () => [
      {
        id: "SUMMARY_ROW",
        name: `TOTAL ALLOCATED BUNDLE (${items.filter((i) => i.selected).length} Active Line Items)`,
        category: allocatedSpend <= budget ? "WITHIN BUDGET GUARDRAIL" : "OVER BUDGET CAP",
        merchant: `Cap: $${budget.toLocaleString()}`,
        price: 0,
        quantity: items
          .filter((i) => i.selected)
          .reduce((sum, i) => sum + Number(i.quantity), 0),
        aiScore: 100,
        aiReasoning:
          allocatedSpend <= budget
            ? `Saves $${(budget - allocatedSpend).toFixed(2)} below budget ceiling`
            : `Exceeds target cap by $${(allocatedSpend - budget).toFixed(2)}`,
        selected: true,
        subtotal: allocatedSpend,
      },
    ],
    [items, allocatedSpend, budget]
  );

  const columnDefs = useMemo<ColDef< any >[]>(
    () => [
      {
        headerName: "Include",
        field: "selected",
        width: 95,
        pinned: "left",
        cellRenderer: (params: any) => {
          if (params.node.rowPinned) {
            return <span className="text-xs font-bold text-emerald-400">TOTAL</span>;
          }
          const isSelected = params.value;
          return (
            <button
              type="button"
              onClick={() => toggleRowSelection(params.data.id)}
              className="flex items-center justify-center w-full h-full text-blue-400 hover:text-blue-300 transition"
              title="Toggle line item in PayPal Escrow requisition"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-emerald-400" />
              ) : (
                <Square className="w-5 h-5 text-slate-500" />
              )}
            </button>
          );
        },
      },
      {
        headerName: "Category",
        field: "category",
        width: 175,
        filter: true,
        cellRenderer: (params: any) => {
          if (params.node.rowPinned) {
            const underBudget = allocatedSpend <= budget;
            return (
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  underBudget
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {params.value}
              </span>
            );
          }
          return (
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {params.value}
            </span>
          );
        },
      },
      {
        headerName: "Channel3 Verified SKU",
        field: "name",
        minWidth: 290,
        flex: 1.5,
        filter: true,
        cellRenderer: (params: any) => {
          if (params.node.rowPinned) {
            return <span className="font-bold text-white">{params.value}</span>;
          }
          return (
            <div className="flex items-center gap-3 py-1">
              <img
                src={params.data.imageUrl}
                alt={params.value}
                className="w-9 h-9 rounded object-cover border border-slate-700 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <a
                  href={params.data.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-slate-100 hover:text-blue-400 truncate flex items-center gap-1"
                >
                  <span className="truncate">{params.value}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                </a>
                <span className="text-xs text-slate-400 truncate">
                  Supplier: {params.data.merchant}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        headerName: "Unit Price",
        field: "price",
        width: 120,
        filter: "agNumberColumnFilter",
        valueFormatter: (params: any) =>
          params.node.rowPinned ? "—" : `$${Number(params.value).toFixed(2)}`,
      },
      {
        headerName: "Qty (Editable)",
        field: "quantity",
        width: 135,
        editable: (params: any) => !params.node.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 1, max: 100 },
        cellClass: (params: any) =>
          params.node.rowPinned
            ? "font-bold text-white"
            : "bg-blue-950/30 text-blue-300 font-semibold cursor-pointer border-x border-slate-800",
        cellRenderer: (params: any) => {
          if (params.node.rowPinned) {
            return <span className="font-bold text-slate-200">{params.value} units</span>;
          }
          return (
            <div className="flex items-center justify-between">
              <span>{params.value}</span>
              <span className="text-[10px] text-blue-400/80 uppercase px-1.5 py-0.5 rounded bg-blue-500/10">
                Edit
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Line Subtotal",
        colId: "subtotal",
        width: 145,
        valueGetter: (params: any) => {
          if (params.node.rowPinned) return params.data.subtotal;
          return Number(params.data.price) * Number(params.data.quantity);
        },
        cellRenderer: (params: any) => {
          const val = Number(params.value || 0);
          if (params.node.rowPinned) {
            return (
              <span className="text-base font-extrabold text-emerald-400">
                ${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            );
          }
          return (
            <span
              className={`font-semibold ${
                params.data.selected ? "text-emerald-400" : "text-slate-500 line-through"
              }`}
            >
              ${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        headerName: "AI Fit Score",
        field: "aiScore",
        width: 130,
        cellRenderer: (params: any) => {
          if (params.node.rowPinned) return null;
          const score = Number(params.value || 90);
          return (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-300">{score}/100</span>
            </div>
          );
        },
      },
      {
        headerName: "Autonomous Agent Reasoning (Channel3 + Budget Signals)",
        field: "aiReasoning",
        minWidth: 280,
        flex: 1.4,
        cellRenderer: (params: any) => (
          <span
            className={`text-xs ${
              params.node.rowPinned ? "font-semibold text-emerald-300" : "text-slate-300"
            }`}
          >
            {params.value}
          </span>
        ),
      },
    ],
    [items, allocatedSpend, budget]
  );

  const onCellValueChanged = (event: any) => {
    if (event.colDef.field === "quantity") {
      const updated = items.map((item) =>
        item.id === event.data.id
          ? { ...item, quantity: Math.max(1, Number(event.newValue || 1)) }
          : item
      );
      onItemsChange(updated);
    }
  };

  const handleExportCsv = () => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `procureflow-requisition-${Date.now()}.csv`,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* AG Grid Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              placeholder="Filter SKUs, suppliers, or AI reasoning..."
              className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Tip: Double-click any <strong>Qty</strong> cell to recalculate live PayPal Escrow totals.
          </span>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          Export Audit CSV (AG Grid)
        </button>
      </div>

      {/* Main AG Grid Viewport */}
      <div className="w-full h-[360px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <AgGridReact
          ref={gridRef}
          theme={darkGridTheme}
          rowData={items}
          columnDefs={columnDefs}
          pinnedBottomRowData={pinnedBottomRowData}
          quickFilterText={quickFilterText}
          rowHeight={54}
          headerHeight={42}
          animateRows={true}
          onCellValueChanged={onCellValueChanged}
          defaultColDef={{
            sortable: true,
            resizable: true,
          }}
        />
      </div>
    </div>
  );
}