import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { message } from "antd";
import dayjs from "dayjs";
import "../../styles/dashboardPage.scss"; // Import SCSS file

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
    const chartRef = useRef(null);

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
            console.log("Raw API timestamps:", data.map(([timestamp]) => timestamp));

            // Transform the data for Recharts
            const transformedData: ChartDataPoint[] = data.map(([timestamp, volume]) => {
                const formattedDate = dayjs(timestamp).format("YYYY-MM-DD");
                console.log("Timestamp:", timestamp, "Formatted Date:", formattedDate);
                return {
                    date: formattedDate,
                    volume: parseFloat(volume.toString()),
                    timestamp,
                };
            });
            console.log("Transformed chart data:", transformedData);

            // Sort by timestamp to ensure correct order
            transformedData.sort((a, b) => a.timestamp - b.timestamp);
            setChartData(transformedData);
            console.log("Set chartData:", transformedData);
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
        console.log("Props - days:", days, "dateRange:", dateRange);
        fetchChartData();
    }, [days, dateRange, transactionTypes]);

    // Log chart ref after mount
    useEffect(() => {
        console.log("Chart SVG after mount:", chartRef.current);
    }, [chartData]);

    // Custom tick formatter for Y-axis to display large numbers
    const formatYAxis = (tick: number) => {
        if (tick >= 1000000) return `${(tick / 1000000).toFixed(1)}M`;
        if (tick >= 1000) return `${(tick / 1000).toFixed(1)}K`;
        return tick.toString();
    };

    // Log rendering condition and data structure
    console.log("Rendering chart - loading:", loading, "chartData length:", chartData.length);
    console.log("chartData structure:", chartData);
    console.log("chartData value types:", chartData.map(d => typeof d.volume));

    return (
        <div className="chart-container">
            <div className="card">
                <h3 className="card-title">Daily Transaction Volume</h3>
                <div className="chart-wrapper">
                    {loading ? (
                        <div className="center-content">
                            <span className="text-muted">Loading chart...</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="center-content">
                            <span className="text-muted">No data available. Please select a day or date range.</span>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                ref={chartRef}
                                data={chartData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                    dataKey="date"
                                    interval={0}
                                    tick={false} // Hide the date labels
                                    tickLine={false}
                                    axisLine={{ stroke: "#e0e0e0" }}
                                />
                                <YAxis
                                    tickFormatter={formatYAxis}
                                    domain={[0, 'auto']}
                                    tick={{ fontSize: 12, fill: "#666" }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e0e0e0" }}
                                />
                                <Tooltip
                                    formatter={(value: number) => [value.toLocaleString(), "Volume"]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "4px" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="volume"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#8884d8", stroke: "#fff", strokeWidth: 2 }}
                                    activeDot={{ r: 8, fill: "#8884d8", stroke: "#fff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyVolumeChart;