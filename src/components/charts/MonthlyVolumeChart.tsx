import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from 'antd';
import { VolumeData } from '../../types/backend';

interface MonthlyVolumeChartProps {
    data: VolumeData[];
    transactionTypes: string[];
}

const MonthlyVolumeChart: React.FC<MonthlyVolumeChartProps> = ({ data }) => {
    return (
        <Card className="chart-container" title="📆 Biểu đồ theo tháng">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                        dataKey="volume"
                        fill="#8884d8"
                        name="Khối lượng"
                    />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default MonthlyVolumeChart;