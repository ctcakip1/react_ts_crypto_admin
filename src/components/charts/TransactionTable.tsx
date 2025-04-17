import React, { useState, useEffect } from "react";
import { Table, message } from "antd";
import dayjs from "dayjs";
import "../../styles/dashboardPage.scss";

// Define interface for the wallet object
interface Wallet {
    id: number;
    userId: number;
    balance: number;
    heldBalance: number;
}

// Define interface for the transaction data
interface Transaction {
    id: number;
    wallet: Wallet;
    walletTransactionType: string;
    date: string;
    transferId: number | null;
    purpose: string;
    amount: number;
}

// Define props interface
interface TransactionTableProps {
    days: number | null;
    dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null;
    transactionTypes: string[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ days, dateRange, transactionTypes }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 15; // 15 records per page

    // Fetch transactions from the API
    const fetchTransactions = async (): Promise<void> => {
        if (days == null && !dateRange) {
            setTransactions([]);
            setCurrentPage(1); // Reset to page 1 when filters are cleared
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (!dateRange && days != null) {
                params.append("days", days.toString());
            }
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.append("start_date", dateRange[0].format("YYYY-MM-DD"));
                params.append("end_date", dateRange[1].format("YYYY-MM-DD"));
            }
            if (transactionTypes.length > 0) {
                params.append("transaction_type", transactionTypes.join(","));
            }

            const url = `http://localhost:5000/api/history/admin/transaction?${params.toString()}`;
            console.log("Fetching transactions from:", url);

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
                console.error("Transactions API error:", response.status, errorText);
                throw new Error(`Failed to fetch transactions: ${response.status} ${errorText}`);
            }

            const data: Transaction[] = await response.json();
            console.log("Transactions response:", data);
            setTransactions(data);
            setCurrentPage(1); // Reset to page 1 on new data fetch
        } catch (error) {
            console.error("Error in fetchTransactions:", error);
            message.error((error as Error).message || "Error fetching transactions");
            setTransactions([]);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when filters change
    useEffect(() => {
        fetchTransactions();
    }, [days, dateRange, transactionTypes]);

    // Handle page change with custom logic
    const handlePageChange = (page: number) => {
        // Prevent going to a negative or zero page
        if (page < 1) {
            return;
        }

        // Prevent going to the next page if the current page doesn't have 15 records
        // (i.e., if total records are less than currentPage * pageSize)
        if (page > currentPage && transactions.length < currentPage * pageSize) {
            message.warning("Cannot go to the next page: Current page has fewer than 15 records.");
            return;
        }

        setCurrentPage(page);
    };

    // Define columns for the antd Table
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Wallet ID",
            key: "walletId",
            render: (record: Transaction) => record.wallet.id,
        },
        {
            title: "User ID",
            key: "userId",
            render: (record: Transaction) => record.wallet.userId,
        },
        {
            title: "Balance",
            key: "balance",
            render: (record: Transaction) => record.wallet.balance.toLocaleString(),
        },
        {
            title: "Held Balance",
            key: "heldBalance",
            render: (record: Transaction) => record.wallet.heldBalance.toLocaleString(),
        },
        {
            title: "Transaction Type",
            dataIndex: "walletTransactionType",
            key: "walletTransactionType",
        },
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
        },
        {
            title: "Transfer ID",
            dataIndex: "transferId",
            key: "transferId",
            render: (transferId: number | null) => transferId ?? "N/A",
        },
        {
            title: "Purpose",
            dataIndex: "purpose",
            key: "purpose",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (amount: number, record: Transaction) => (
                <span
                    style={{
                        color:
                            record.walletTransactionType === "BUY_ASSET"
                                ? "red"
                                : amount >= 0
                                    ? "green"
                                    : "red",
                    }}
                >
                    {record.walletTransactionType === "BUY_ASSET"
                        ? `-${Math.abs(amount).toLocaleString()}`
                        : amount.toLocaleString()}{" "}
                    USD
                </span>
            ),
        },
    ];

    return (
        <div className="transaction-table-container">
            <div className="card">
                <h3 className="card-title">Transaction History</h3>
                <Table
                    columns={columns}
                    dataSource={transactions}
                    rowKey="id"
                    loading={loading}
                    locale={{
                        emptyText: <span className="text-muted">No transactions available. Please select a date range or number of days.</span>,
                    }}
                    scroll={{ x: 800 }} // Enable horizontal scrolling for smaller screens
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: transactions.length,
                        onChange: handlePageChange,
                        showSizeChanger: false, // Disable changing page size
                        hideOnSinglePage: false, // Always show pagination
                    }}
                />
            </div>
        </div>
    );
};

export default TransactionTable;