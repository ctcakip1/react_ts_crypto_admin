import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { message } from "antd";
import dayjs from "dayjs";

// Define props interface
interface DailyVolumeChartProps {
    days: number | null;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
    transactionTypes: string[];
}

// Define data point interface for the chart
interface ChartDataPoint {
    date: string; // Formatted date for X-axis
    volume: number; // Volume for Y-axis
    timestamp: number; // Original timestamp for sorting
}

const DailyVolumeChart: React.FC<DailyVolumeChartProps> = ({ days, dateRange, transactionTypes }) => {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch chart data
    const fetchChartData = async (): Promise<void> => {
        // Skip if no filters are applied
        if (days == null && (!dateRange || !dateRange[0] || !dateRange[1])) {
            setChartData([]); // Clear chart data
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (days != null) {
                params.append("days", days.toString());
            }
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
                params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
            }
            if (transactionTypes.length > 0) {
                params.append("transaction_type", transactionTypes.join(","));
            }

            const url = `http://localhost:5000/api/history/admin/total-volume/chart?${params.toString()}`;
            console.log("Fetching chart data from:", url);

            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("JWT token not found in localStorage");
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Chart data API error:", response.status, errorText);
                throw new Error(`Failed to fetch chart data: ${response.status} ${errorText}`);
            }

            const data: [number, number][] = await response.json();
            console.log("Chart data response:", data);

            // Transform the data for Recharts
            const transformedData: ChartDataPoint[] = data.map(([timestamp, volume]) => ({
                date: dayjs(timestamp).format("YYYY-MM-DD"),
                volume,
                timestamp,
            }));

            // Sort by timestamp to ensure correct order
            transformedData.sort((a, b) => a.timestamp - b.timestamp);
            setChartData(transformedData);
        } catch (error) {
            console.error("Error in fetchChartData:", error);
            message.error((error as Error).message || "Error fetching chart data");
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        fetchChartData();
    }, [days, dateRange, transactionTypes]);

    // Custom tick formatter for Y-axis to display large numbers
    const formatYAxis = (tick: number) => {
        if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
        if (tick >= 1000) return `${(tick / 1000).toFixed(1)}K`;
        return tick.toString();
    };

    return (
        <div className="w-full h-96">
            {loading ? (
                <div className="flex justify-center items-center h-full">
                    <span>Loading chart...</span>
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                    <span>No data available. Please select a day or date range.</span>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis tickFormatter={formatYAxis} />
                        <Tooltip
                            formatter={(value: number) => [value.toLocaleString(), "Volume"]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Line type="monotone" dataKey="volume" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default DailyVolumeChart;