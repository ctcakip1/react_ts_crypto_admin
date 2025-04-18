import { useEffect, useState } from "react";
import { notification, Table, TableProps, Select, Space, Spin } from "antd";
import { DatePicker } from "antd";

const { Option } = Select;
const { RangePicker } = DatePicker;

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

const TransactionTable = () => {
    const [listTransactions, setListTransactions] = useState<ITransaction[]>([]);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 15,
        total: 0,
    });
    const [filters, setFilters] = useState({
        start_date: "",
        end_date: "",
        transaction_type: [
            "WITHDRAWAL",
            "WALLET_TRANSFER",
            "ADD_MONEY",
            "BUY_ASSET",
            "SELL_ASSET",
            "INTRODUCTORY_GIFT",
        ] as string[],
        days: undefined as number | undefined,
    });
    const [isLoading, setIsLoading] = useState(false); // Thêm loading state
    const access_token = localStorage.getItem("jwt") || "";

    useEffect(() => {
        getData();
    }, [filters, meta.current]);

    const getData = async (page = meta.current) => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append("page", (page - 1).toString());
            queryParams.append("size", meta.pageSize.toString());
            if (filters.start_date) queryParams.append("start_date", filters.start_date);
            if (filters.end_date) queryParams.append("end_date", filters.end_date);
            if (filters.transaction_type.length > 0) {
                queryParams.append("transaction_type", filters.transaction_type.join(","));
            }
            if (filters.days !== undefined) queryParams.append("days", filters.days.toString());

            const res = await fetch(
                `http://localhost:5000/api/history/admin/transaction?${queryParams.toString()}`,
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
            console.log("API response (transactions):", transactionsData);

            if (Array.isArray(transactionsData)) {
                setListTransactions(transactionsData);
                setMeta((prev) => ({
                    ...prev,
                    current: page,
                    total: transactionsData.length === meta.pageSize ? (page * meta.pageSize) : transactionsData.length,
                }));
            } else {
                notification.error({
                    message: "No transactions found",
                    description: JSON.stringify(transactionsData.message || "Unknown error"),
                });
                setListTransactions([]);
                setMeta((prev) => ({
                    ...prev,
                    current: page,
                    total: 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            notification.error({
                message: "You do not have permission to access this endpoint.",
            });
            setListTransactions([]);
            setMeta((prev) => ({
                ...prev,
                current: page,
                total: 0,
            }));
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

    const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
        setFilters((prev) => ({
            ...prev,
            start_date: dateStrings[0],
            end_date: dateStrings[1],
            days: undefined, // Reset days khi chọn date range
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const handleTransactionTypeChange = (value: string[]) => {
        setFilters((prev) => ({
            ...prev,
            transaction_type: value,
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
            start_date: "", // Reset date range khi chọn days
            end_date: "",
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
                <h2>Transaction Table</h2>
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
                        {[1, 7, 30, 90, 365].map((day) => (
                            <Option key={day} value={day}>
                                {day} day{day > 1 ? "s" : ""}
                            </Option>
                        ))}
                    </Select>
                </div>
                <div>
                    <label style={{ marginRight: 8 }}>Date Range:</label>
                    <RangePicker
                        onChange={handleDateRangeChange}
                        format="YYYY-MM-DD"
                        placeholder={["Start Date", "End Date"]}
                    />
                </div>
                <div>
                    <label style={{ marginRight: 8 }}>Transaction Type:</label>
                    <Select
                        mode="multiple"
                        allowClear
                        style={{ width: 300 }}
                        placeholder="Select transaction types"
                        onChange={handleTransactionTypeChange}
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

export default TransactionTable;