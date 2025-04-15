import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { notification, Table, TableProps, Select, Space, Spin } from "antd";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Option } = Select;

export interface ITransaction {
    id: string;
    wallet: {
        id: string;
        userId: string;
        balance: number;
        heldBalance: number;
    };
    walletTransactionType: string;
    date: string;
    transferId: string | null;
    purpose: string;
    amount: number;
}

const UserWalletTransactionTable = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [listTransactions, setListTransactions] = useState<ITransaction[]>([]);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 15,
        total: 0,
    });
    const [filters, setFilters] = useState({
        transaction_type: undefined as string | undefined,
        days: undefined as number | undefined,
    });
    const [isLoading, setIsLoading] = useState(false); // Thêm loading state
    const access_token = localStorage.getItem("jwt") || "";

    useEffect(() => {
        if (userId) {
            getData();
        }
    }, [filters, meta.current, userId]);

    const getData = async (page = meta.current) => {
        if (!userId) {
            notification.error({
                message: "Invalid User ID",
                description: "No user ID provided in the URL.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", (page - 1).toString());
            queryParams.append("size", meta.pageSize.toString());
            if (filters.transaction_type) {
                queryParams.append("transaction_type", filters.transaction_type);
            }
            if (filters.days !== undefined) {
                queryParams.append("days", filters.days.toString());
            }

            const res = await fetch(
                `http://localhost:5000/api/history/admin/${userId}?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from transactions:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const transactionsData = await res.json();
            console.log("API response (user transactions):", transactionsData);

            if (Array.isArray(transactionsData)) {
                setListTransactions(transactionsData);
                setMeta({
                    current: page,
                    pageSize: meta.pageSize,
                    total: transactionsData.length === meta.pageSize ? (page * meta.pageSize) : transactionsData.length,
                });
            } else {
                notification.error({
                    message: "No transactions found",
                    description: JSON.stringify(transactionsData.message || "Unknown error"),
                });
                setListTransactions([]);
                setMeta({
                    current: page,
                    pageSize: meta.pageSize,
                    total: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            notification.error({
                message: "Error fetching transactions",
                description: error.message || "You may not have permission to access this endpoint.",
            });
            setListTransactions([]);
            setMeta({
                current: page,
                pageSize: meta.pageSize,
                total: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnChange = async (page: number) => {
        setMeta((prev) => ({
            ...prev,
            current: page,
        }));
    };

    const handleTransactionTypeChange = (value: string | undefined) => {
        setFilters((prev) => ({
            ...prev,
            transaction_type: value,
            days: undefined, // Reset days khi thay đổi transaction_type
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const handleDaysChange = (days: number | undefined) => {
        setFilters((prev) => ({
            ...prev,
            days: days,
            transaction_type: undefined, // Reset transaction_type khi thay đổi days
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date
            .toLocaleString("en-GB", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            .replace(/\//g, "-");
    };

    const columns: TableProps<ITransaction>["columns"] = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Wallet ID",
            dataIndex: ["wallet", "id"],
            key: "walletId",
        },
        {
            title: "User ID",
            dataIndex: ["wallet", "userId"],
            key: "userId",
        },
        {
            title: "Balance",
            dataIndex: ["wallet", "balance"],
            key: "balance",
            render: (balance: number) => `$${balance.toLocaleString()}`,
        },
        {
            title: "Held Balance",
            dataIndex: ["wallet", "heldBalance"],
            key: "heldBalance",
            render: (heldBalance: number) => `$${heldBalance.toLocaleString()}`,
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
            render: (date: string) => formatDate(date),
        },
        {
            title: "Transfer ID",
            dataIndex: "transferId",
            key: "transferId",
            render: (transferId: string | null) => transferId || "N/A",
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
            render: (amount: number, record: ITransaction) => (
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
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <h2>User Wallet Transaction History (User ID: {userId})</h2>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/users")}
                >
                    Back
                </Button>
            </div>

            <Space style={{ marginBottom: 16 }}>
                <div>
                    <label style={{ marginRight: 8 }}>Days:</label>
                    <Select
                        style={{ width: 120 }}
                        placeholder="Select days"
                        onChange={(value: number | undefined) => handleDaysChange(value)}
                        allowClear
                        value={filters.days}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 14, 30].map((day) => (
                            <Option key={day} value={day}>
                                {day} day{day > 1 ? "s" : ""}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label style={{ marginRight: 8 }}>Transaction Type:</label>
                    <Select
                        style={{ width: 200 }}
                        placeholder="Select transaction type"
                        onChange={(value: string | undefined) => handleTransactionTypeChange(value)}
                        allowClear
                        value={filters.transaction_type}
                    >
                        <Option value="WITHDRAWAL">Withdrawal</Option>
                        <Option value="WALLET_TRANSFER">Wallet Transfer</Option>
                        <Option value="ADD_MONEY">Add Money</Option>
                        <Option value="BUY_ASSET">Buy Asset</Option>
                        <Option value="SELL_ASSET">Sell Asset</Option>
                        <Option value="INTRODUCTORY_GIFT">Introductory Gift</Option>
                    </Select>
                </div>
            </Space>

            {isLoading ? (
                <Spin tip="Loading transactions..." size="large" style={{ display: "block", margin: "50px auto" }} />
            ) : (
                <Table
                    columns={columns}
                    dataSource={listTransactions}
                    rowKey={"id"}
                    pagination={{
                        current: meta.current,
                        pageSize: meta.pageSize,
                        total: meta.total,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                        onChange: (page: number) => {
                            handleOnChange(page);
                        },
                        showSizeChanger: false,
                        disabled: listTransactions.length === 0,
                        nextIcon: listTransactions.length === meta.pageSize ? undefined : null,
                        prevIcon: meta.current === 1 ? null : undefined,
                    }}
                />
            )}
        </div>
    );
};

export default UserWalletTransactionTable;