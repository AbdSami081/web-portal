"use client";

import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
    LineChart, Line,
    AreaChart, Area,
    BarChart, Bar
} from 'recharts';
import { useTheme } from 'next-themes';
import { BaseWidget } from '@/components/dashboard/BaseWidget';

export interface SeriesConfig {
    dataKey: string;
    color?: string;
    name?: string;
    strokeWidth?: number;
}

export interface GraphWidgetProps {
    id: string;
    title: string;
    data: any[];
    type?: 'line' | 'area' | 'bar';
    xAxisKey?: string;
    series: SeriesConfig[];
    loading?: boolean;
    height?: number | string;
}

const DEFAULT_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--primary)/0.7)',
    'hsl(var(--primary)/0.4)',
    'hsl(var(--primary)/0.2)',
];

export function GraphWidget({
    id,
    title,
    data,
    type = 'area',
    xAxisKey = 'name',
    series,
    loading = false
}: GraphWidgetProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkTheme = resolvedTheme === 'dark';
    const chartTextColor = isDarkTheme ? '#a1a1aa' : '#71717a';
    const tooltipTextColor = isDarkTheme ? '#ffffff' : '#000000';

    if (!mounted) {
        return (
            <BaseWidget id={id} title={title} isLoading={true}>
                <div className="w-full h-full min-h-[220px]" />
            </BaseWidget>
        );
    }

    const renderChart = () => {
        if (!data || data.length === 0) return null;

        const commonProps = {
            data,
            margin: { top: 10, right: 10, left: 10, bottom: 0 }
        };

        let ChartComponent: any = AreaChart;
        if (type === 'line') ChartComponent = LineChart;
        if (type === 'bar') ChartComponent = BarChart;

        return (
            <ChartComponent {...commonProps}>
                <defs>
                    {type === 'area' && series.map((s, idx) => {
                        const color = s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                        return (
                            <linearGradient key={`grad-${s.dataKey}`} id={`color-${s.dataKey}-${id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        );
                    })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                    dataKey={xAxisKey}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: tooltipTextColor }}
                    labelStyle={{ color: tooltipTextColor }}
                />
                <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 500, color: tooltipTextColor }}
                />
                
                {series.map((s, idx) => {
                    const color = s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                    
                    if (type === 'line') {
                        return (
                            <Line
                                key={s.dataKey}
                                type="monotone"
                                dataKey={s.dataKey}
                                name={s.name || s.dataKey}
                                stroke={color}
                                strokeWidth={s.strokeWidth || 2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        );
                    }

                    if (type === 'bar') {
                        return (
                            <Bar
                                key={s.dataKey}
                                dataKey={s.dataKey}
                                name={s.name || s.dataKey}
                                fill={color}
                                radius={[4, 4, 0, 0]}
                                barSize={data.length > 10 ? 15 : 30}
                            />
                        );
                    }

                    return (
                        <Area
                            key={s.dataKey}
                            type="monotone"
                            dataKey={s.dataKey}
                            name={s.name || s.dataKey}
                            stroke={color}
                            fillOpacity={1}
                            fill={`url(#color-${s.dataKey}-${id})`}
                            strokeWidth={s.strokeWidth || 2}
                        />
                    );
                })}
            </ChartComponent>
        );
    };

    return (
        <BaseWidget id={id} title={title} isLoading={loading} isEmpty={!data || data.length === 0}>
            <div className="w-full h-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() ?? <div />}
                </ResponsiveContainer>
            </div>
        </BaseWidget>
    );
}
