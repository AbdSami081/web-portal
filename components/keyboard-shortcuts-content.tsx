"use client";

import React from "react";
import { Kbd } from "@/components/ui/kbd";
import { Search, Sheet, Keyboard, SearchCode, Code2 } from "lucide-react";

export const KeyboardShortcutsContent: React.FC = () => {
  const shortcuts = [
    {
      keys: ["Ctrl", "F"],
      action: "Document Search",
      description: "Open the created documents list for quick review and search.",
      icon: Search,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100",
    },
    {
      keys: ["Shift", "F2"],
      action: "Execute FMS",
      description: "Execute Formatted Search query on the currently active field.",
      icon: Code2,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100",
    },
    {
      keys: ["Alt", "Shift", "F2"],
      action: "FMS Setup (Admin)",
      description: "Open User-Defined Values / Formatted Search configuration modal.",
      icon: SearchCode,
      color: "from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-100",
    },
    {
      keys: ["Ctrl", "Shift", "U"],
      action: "UDF Sheet",
      description: "Toggle or open User Defined Fields (UDF) panel for the current document.",
      icon: Sheet,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-4 py-2">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Keyboard className="w-3.5 h-3.5" />
        Available Shortcuts
      </div>
      <div className="grid gap-3">
        {shortcuts.map((shortcut, index) => {
          const Icon = shortcut.icon;
          return (
            <div
              key={index}
              className="group relative flex items-start gap-4 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200/80 hover:shadow-md transition-all duration-200"
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${shortcut.color} border shrink-0 transition-transform group-hover:scale-105 duration-200`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 leading-none">
                    {shortcut.action}
                  </h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        {keyIdx > 0 && <span className="text-[10px] font-bold text-slate-400">+</span>}
                        <Kbd className="bg-white border border-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded shadow-xs text-[10px]">
                          {key}
                        </Kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                  {shortcut.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
