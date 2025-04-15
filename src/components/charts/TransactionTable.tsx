import React from 'react';
import { Table, Card } from 'antd';
import moment from 'moment';
import { Transaction } from '../../types/backend';

interface TransactionTableProps {
    data: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ data }) => {
    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'date',
            key: 'date',
            render: (text: string) => moment(text).format('YYYY-MM-DD'),
        },
        {
            title: 'Loại giao dịch',
            dataIndex: 'walletTransactionType',
            key: 'walletTransactionType',
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (text: number) => text.toFixed(2),
        },
        {
            title: 'Mục đích',
            dataIndex: 'purpose',
            key: 'purpose',
        },
        {
            title: 'Người thực hiện',
            dataIndex: ['wallet', 'userId'],
            key: 'userId',
        },
    ];

    return (
        <Card className="table-container" title="📋 Chi tiết giao dịch">
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />
        </Card>
    );
};

export default TransactionTable;