import React from 'react';
import { Card, Col, Row } from 'antd';
import "../../styles/dashboardPage.scss";

// Define props interface for TypeScript
interface SummaryData {
    totalToday: number;
    customerFees: number;
    totalByRange: number;
    totalFees: number; // New field for total transaction fees
}

interface SummaryCardsProps {
    data: SummaryData;
    loading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading = false }) => {
    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6} className="summary-card">
                <Card title="💰 Tổng giao dịch">
                    <p>{loading ? "Loading..." : `$${data.totalToday.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={6} className="summary-card">
                <Card title="💸 Phí khách hàng">
                    <p>{loading ? "Loading..." : `$${data.customerFees.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={6} className="summary-card">
                <Card title="📅 Tổng giao dịch (theo khoảng thời gian)">
                    <p>{loading ? "Loading..." : `$${data.totalByRange.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={6} className="summary-card">
                <Card title="💵 Tổng phí giao dịch">
                    <p>{loading ? "Loading..." : `$${data.totalFees.toFixed(2)}`}</p>
                </Card>
            </Col>
        </Row>
    );
};

export default SummaryCards;