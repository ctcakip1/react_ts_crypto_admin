import React from 'react';
import { Card, Col } from 'antd';
import { SummaryData } from '../../types/backend';

interface SummaryCardsProps {
    data: SummaryData;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
    return (
        <>
            <Col xs={24} sm={12} md={6}>
                <Card title="💰 Tổng giao dịch">
                    <p>{data.totalToday.toFixed(2)}</p>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card title="📊 Tổng tiền trong khoảng">
                    <p>{data.totalRange.toFixed(2)}</p>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card title="💸 Phí khách hàng">
                    <p>{data.customerFees.toFixed(2)}</p>
                </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
                <Card title="🔁 Số giao dịch">
                    <p>{data.transactionCount}</p>
                </Card>
            </Col>
        </>
    );
};

export default SummaryCards;