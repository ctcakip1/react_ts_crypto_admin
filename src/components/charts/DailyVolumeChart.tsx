import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';
import { VolumeData } from '../../types/backend';

interface DailyVolumeChartProps {
    data: VolumeData[];
    transactionTypes: string[];
}

const DailyVolumeChart: React.FC<DailyVolumeChartProps> = ({ data }) => {
    return (
        <Card className="chart-container" title="📈 Biểu đồ giao dịch theo ngày">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="volume"
                        stroke="#8884d8"
                        name="Khối lượng"
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default DailyVolumeChart;