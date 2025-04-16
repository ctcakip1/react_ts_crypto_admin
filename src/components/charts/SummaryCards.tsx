import React from 'react';
import { Card, Col } from 'antd';

// Define props interface for TypeScript
interface SummaryData {
    totalToday: number;
    customerFees: number;
    totalByRange: number; // New field for date range total
}

interface SummaryCardsProps {
    data: SummaryData;
    loading?: boolean; // Optional loading prop to show loading state
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading = false }) => {
    return (
        <>
            <Col xs={24} sm={12} md={6}>
                <Card title="💰 Tổng giao dịch">
                    <p>{loading ? "Loading..." : `$${data.totalToday.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
                <Card title="💸 Phí khách hàng">
                    <p>{loading ? "Loading..." : `$${data.customerFees.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
                <Card title="📅 Tổng giao dịch (theo khoảng thời gian)">
                    <p>{loading ? "Loading..." : `$${data.totalByRange.toFixed(2)}`}</p>
                </Card>
            </Col>
        </>
    );
};

export default SummaryCards;