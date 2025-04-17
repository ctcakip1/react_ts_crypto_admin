import React, { useState, useEffect } from "react";
import { Table, message } from "antd";
import dayjs from "dayjs";
import "../../styles/dashboardPage.scss";

// Define interface for the API response (object with coin names as keys)
interface TransactionByCoinData {
    [coin: string]: number;
}

// Define interface for the table data (transformed from API response)
interface TableData {
    coin: string;
    amount: number;
}

// Define props interface
interface TransactionByCoinTableProps {
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
}

const TransactionByCoinTable: React.FC<TransactionByCoinTableProps> = ({ dateRange }) => {
    const [data, setData] = useState<TableData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Fetch transaction data by coin
    const fetchTransactionByCoin = async (): Promise<void> => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            setData([]);
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
            params.append("endDate", dateRange[1].format("YYYY-MM-DD"));

            const url = `http://localhost:5000/api/orders/admin/total-transactions-range?${params.toString()}`;
            console.log("Fetching transaction by coin from:", url);

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
                console.error("Transaction by coin API error:", response.status, errorText);
                throw new Error(`Failed to fetch transaction by coin data: ${response.status} ${errorText}`);
            }

            const apiData: TransactionByCoinData = await response.json();
            console.log("Transaction by coin response:", apiData);

            // Transform the API response (object) into an array for the table
            const transformedData: TableData[] = Object.entries(apiData).map(([coin, amount]) => ({
                coin,
                amount,
            }));

            setData(transformedData);
        } catch (error) {
            console.error("Error in fetchTransactionByCoin:", error);
            message.error((error as Error).message || "Error fetching transaction by coin data");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when dateRange changes
    useEffect(() => {
        fetchTransactionByCoin();
    }, [dateRange]);

    // Define columns for the antd Table
    const columns = [
        {
            title: "Coin",
            dataIndex: "coin",
            key: "coin",
        },
        {
            title: "Total Transaction Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount: number) => amount.toLocaleString(undefined, { maximumFractionDigits: 8 }),
        },
    ];

    return (
        <div className="transaction-by-coin-table-container">
            <div className="card">
                <h3 className="card-title">Transaction Volume by Coin</h3>
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="coin"
                    loading={loading}
                    locale={{
                        emptyText: <span className="text-muted">No data available. Please select a date range.</span>,
                    }}
                    pagination={false} // No pagination needed for this table
                />
            </div>
        </div>
    );
};

export default TransactionByCoinTable;