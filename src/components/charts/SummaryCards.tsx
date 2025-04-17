import React from 'react';
import { Card, Col, Row } from 'antd';
import "../../styles/dashboardPage.scss";

// Define props interface for TypeScript
interface SummaryData {
    totalTransactions: number; // Combined total for days or date range
    totalFees: number;
}

interface SummaryCardsProps {
    data: SummaryData;
    loading?: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading = false }) => {
    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8} className="summary-card">
                <Card title="💰 Tổng giao dịch">
                    <p>{loading ? "Loading..." : `$${data.totalTransactions.toFixed(2)}`}</p>
                </Card>
            </Col>

            <Col xs={24} sm={12} md={8} className="summary-card">
                <Card title="💵 Tổng phí giao dịch">
                    <p>{loading ? "Loading..." : `$${data.totalFees.toFixed(2)}`}</p>
                </Card>
            </Col>
        </Row>
    );
};

export default SummaryCards;