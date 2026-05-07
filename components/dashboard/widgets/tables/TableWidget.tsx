"use client"

import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconSelector,
    IconCircleCheckFilled,
    IconLayoutColumns,
    IconLoader
} from "@tabler/icons-react"
import {
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import * as React from "react"

import { BaseWidget } from "@/components/dashboard/BaseWidget"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

function DraggableRow({
    row,
    visibleColumnIds,
}: {
    row: Row<any>
    visibleColumnIds: Set<string>
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.id })

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={setNodeRef}
            className={`relative z-0 group hover:bg-muted/30 transition-colors ${isDragging ? "opacity-50 z-10" : ""}`}
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            {row.getAllCells()
                .filter((cell) => visibleColumnIds.has(cell.column.id))
                .map((cell) => (
                    <TableCell key={cell.id} className="py-1 px-2 h-8 border-b border-border/10">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                ))}
        </TableRow>
    )
}

export interface TableColumnConfig {
    header: string;
    accessorKey: string;
    type?: 'text' | 'number' | 'money' | 'date' | 'badge' | 'progress' | 'icon';
    className?: string;
}

interface TableWidgetProps {
    id?: string;
    title: string;
    data: any[];
    loading?: boolean;
    columns?: ColumnDef<any>[];
    columnConfig?: TableColumnConfig[];
    primaryKey?: string;
    onDataChange?: (newData: any[]) => void;
}

export function TableWidget({
    id = "table-widget",
    title,
    data: initialData,
    loading = false,
    columns: customColumns,
    columnConfig,
    primaryKey: _primaryKey = "id",
    onDataChange
}: TableWidgetProps) {
    const [data, setData] = React.useState<any[]>(initialData)

    React.useEffect(() => { setData(initialData) }, [initialData])

    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })

    const sortableId = React.useId()
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const columns = React.useMemo<ColumnDef<any>[]>(() => {
        if (customColumns) return customColumns;

        let displayConfigs: TableColumnConfig[] = [];

        if (columnConfig && columnConfig.length > 0) {
            displayConfigs = columnConfig;
        } else if (data && data.length > 0) {
            displayConfigs = Object.keys(data[0]).map(key => {
                const lowerKey = key.toLowerCase();
                let type: TableColumnConfig['type'] = 'text';
                if (lowerKey.includes("total") || lowerKey.includes("sales") || lowerKey.includes("price") || lowerKey.includes("amount")) type = 'money';
                else if (lowerKey.includes("date") || lowerKey.includes("time")) type = 'date';
                else if (lowerKey.includes("status")) type = 'badge';
                return { header: key.replace(/([A-Z])/g, ' $1').trim(), accessorKey: key, type } as TableColumnConfig;
            });
        }

        const dataColumns: ColumnDef<any>[] = displayConfigs.map((cfg) => ({
            id: cfg.accessorKey,
            accessorKey: cfg.accessorKey,
            meta: { label: cfg.header },
            header: ({ column }) => {
                const isSorted = column.getIsSorted();
                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`-ml-3 h-8 text-[11px] font-bold uppercase tracking-tighter hover:bg-muted/50 transition-colors ${isSorted ? 'bg-muted/50 text-primary' : ''} ${cfg.className || ''}`}
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        {cfg.header}
                        <div className="ml-2 flex items-center">
                            {isSorted === "asc" ? <IconChevronUp className="h-3.5 w-3.5 text-primary" />
                                : isSorted === "desc" ? <IconChevronDown className="h-3.5 w-3.5 text-primary" />
                                    : <IconSelector className="h-3.5 w-3.5 opacity-30" />}
                        </div>
                    </Button>
                );
            },
            cell: ({ row }) => {
                const val = row.getValue(cfg.accessorKey) as any;
                const type = cfg.type;

                if (type === 'badge') {
                    const s = String(val).toLowerCase();
                    const variant = (s.includes('active') || s.includes('gold') || s.includes('done') || s.includes('success') || s.includes('completed') || s.includes('received') || s.includes('dispatched'))
                        ? 'emerald'
                        : (s.includes('pending') || s.includes('progress') || s.includes('warning') || s.includes('critical'))
                            ? 'amber'
                            : 'zinc';
                    return (
                        <Badge variant="outline" className={`px-1.5 py-0 text-[10px] uppercase font-bold border h-5 ${variant === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : variant === 'amber' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'}`}>
                            {s.includes('done') && <IconCircleCheckFilled className="size-3 mr-1 fill-emerald-500" />}
                            {s.includes('progress') && <IconLoader className="size-3 mr-1 animate-spin" />}
                            {String(val)}
                        </Badge>
                    );
                }

                if (type === 'money' || (typeof val === 'number' && type !== 'text')) {
                    return (
                        <div className="text-[11px] tabular-nums font-medium">
                            {type === 'money' && <span className="mr-0.5 opacity-70"></span>}
                            {(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: type === 'money' ? 2 : 0, maximumFractionDigits: 2 })}
                        </div>
                    );
                }

                if (type === 'date') return <span className="text-[11px] text-muted-foreground">{val ? String(val).split('T')[0] : "-"}</span>;
                if (type === 'progress') {
                    return (
                        <div className="w-full bg-muted rounded-full h-1.5 max-w-[100px]">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(val) || 0))}%` }} />
                        </div>
                    );
                }

                return <span className="truncate max-w-[180px] block text-[11px] font-medium">{String(val ?? "")}</span>;
            }
        }));

        return dataColumns;
    }, [data, customColumns, columnConfig]);

    const table = useReactTable({
        data, columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    const visibleColumnIds = new Set(table.getVisibleLeafColumns().map((column) => column.id))

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (active && over && active.id !== over.id) {
            const oldIndex = table.getRowModel().rows.findIndex(r => r.id === active.id)
            const newIndex = table.getRowModel().rows.findIndex(r => r.id === over.id)
            const newData = arrayMove(data, oldIndex, newIndex)
            setData(newData)
            onDataChange?.(newData)
        }
    }

    return (
        <BaseWidget id={id} title={title} isLoading={loading} contentClassName="p-0 overflow-hidden">
            <div className="flex flex-col h-full p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Input placeholder="Search records..." className="h-7 text-[11px] w-[200px]" onChange={(e) => table.setGlobalFilter(e.target.value)} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-[10px]">
                                <IconLayoutColumns className="mr-1 size-3" /> Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {table.getAllColumns().filter(c => c.getCanHide() && !c.columns?.length).map(c => {
                                const label = (c.columnDef.meta as any)?.label || c.id;
                                return (
                                    <DropdownMenuCheckboxItem key={c.id} className="capitalize" checked={c.getIsVisible()} onCheckedChange={v => c.toggleVisibility(!!v)}>
                                        {label}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex-1 overflow-auto rounded-md">
                    <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd} sensors={sensors} id={sortableId}>
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                {table.getHeaderGroups().map((hg) => (
                                    <TableRow key={hg.id} className="hover:bg-transparent border-b">
                                        {hg.headers.filter(h => h.colSpan > 0 && visibleColumnIds.has(h.column.id)).map((h) => (
                                            <TableHead key={h.id} className="h-8 py-0" colSpan={h.colSpan}>
                                                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext items={table.getRowModel().rows.map(row => row.id)} strategy={verticalListSortingStrategy}>
                                        {table.getRowModel().rows.map(row => (
                                            <DraggableRow key={row.id} row={row} visibleColumnIds={visibleColumnIds} />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">No results.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>

                <div className="flex items-center justify-between px-1 py-1">
                    <div className="text-[10px] text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} selected
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px]">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <IconChevronLeft className="size-3" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <IconChevronRight className="size-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </BaseWidget>
    )
}
