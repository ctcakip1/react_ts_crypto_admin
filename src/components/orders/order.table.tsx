import { useEffect, useState } from "react";
import { notification, Table, TableProps, Select, Space } from "antd";

const { Option } = Select;

// Define the interface for orders based on the API response
export interface IOrder {
    id: string;
    userId: string;
    orderType: string;
    price: number;
    limitPrice: number | null;
    stopPrice: number | null;
    timestamp: string;
    status: string;
    orderItem: {
        id: string;
        quantity: number;
        coinId: string;
        buyPrice: number;
        sellPrice: number;
    };
    tradingSymbol: string;
}

const OrdersTable = () => {
    const [listOrders, setListOrders] = useState<IOrder[]>([]);
    const [assetSymbols, setAssetSymbols] = useState<string[]>([]);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 15, // Fixed page size to 15
        total: 0,
    });
    const [filters, setFilters] = useState({
        status: "",
        asset_symbol: "",
        order_type: "", // Single selection for order type
        sortBy: "id", // Default sortBy
        order: "desc", // Default order
        days: undefined as number | undefined, // Track selected days for Select
    });

    const access_token = localStorage.getItem("jwt") as string;

    // Fetch asset symbols on component mount
    useEffect(() => {
        const fetchAssetSymbols = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/coins/get-trading-symbol", {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!res.ok) {
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                const data = await res.json();
                if (Array.isArray(data)) {
                    setAssetSymbols(data);
                } else {
                    throw new Error("Unexpected data format for asset symbols");
                }
            } catch (error) {
                console.error("Error fetching asset symbols:", error);
                notification.error({
                    message: "Error fetching asset symbols",
                    description: error.message,
                });
            }
        };

        fetchAssetSymbols();
    }, []);

    // Fetch orders when filters or page change
    useEffect(() => {
        getData();
    }, [filters, meta.current]);

    const getData = async (page = meta.current) => {
        try {
            // Build query parameters for filtering
            const queryParams = new URLSearchParams();
            queryParams.append("page", (page - 1).toString()); // API expects page starting from 0
            queryParams.append("size", meta.pageSize.toString());
            if (filters.days !== undefined) queryParams.append("days", filters.days.toString());
            if (filters.status) queryParams.append("status", filters.status);
            if (filters.asset_symbol) queryParams.append("asset_symbol", filters.asset_symbol);
            if (filters.order_type) {
                queryParams.append("order_type", filters.order_type);
            }
            queryParams.append("sortBy", filters.sortBy);
            queryParams.append("order", filters.order);

            const res = await fetch(
                `http://localhost:5000/api/orders/admin?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from orders:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const ordersData = await res.json();
            console.log("API response (orders):", ordersData);

            if (ordersData.content && Array.isArray(ordersData.content)) {
                setListOrders(ordersData.content);
                setMeta((prev) => ({
                    ...prev,
                    current: page,
                    total: ordersData.totalElements, // Use totalElements from API
                }));
            } else {
                notification.error({
                    message: "No orders found",
                    description: JSON.stringify(ordersData.message || "Unknown error"),
                });
                setListOrders([]);
                setMeta((prev) => ({
                    ...prev,
                    total: 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            notification.error({
                message: "You do not have permission to access this endpoint.",
            });
            setListOrders([]);
            setMeta((prev) => ({
                ...prev,
                total: 0,
            }));
        }
    };

    const handleOnChange = async (page: number) => {
        setMeta((prev) => ({
            ...prev,
            current: page,
        }));
    };

    const handleDaysChange = (days: number | undefined) => {
        setFilters((prev) => ({
            ...prev,
            days: days,
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const handleStatusChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            status: value,
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const handleAssetSymbolChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            asset_symbol: value,
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    const handleOrderTypeChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            order_type: value,
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1,
            total: 0,
        }));
    };

    // Function to format date (only YYYY-MM-DD)
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

    // Function to format price (only red if negative, no green for positive)
    const formatPrice = (value: number | null) => {
        if (value === null) return "N/A";
        return (
            <span style={{ color: value < 0 ? "red" : "inherit" }}>
                ${Math.abs(value).toLocaleString()}
            </span>
        );
    };

    const columns: TableProps<IOrder>["columns"] = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "User ID",
            dataIndex: "userId",
            key: "userId",
        },
        {
            title: "Order Type",
            dataIndex: "orderType",
            key: "orderType",
        },
        {
            title: "Price",
            dataIndex: "price",
            key: "price",
            render: (price: number) => formatPrice(price),
        },
        {
            title: "Limit Price",
            dataIndex: "limitPrice",
            key: "limitPrice",
            render: (limitPrice: number | null) => formatPrice(limitPrice),
        },
        {
            title: "Stop Price",
            dataIndex: "stopPrice",
            key: "stopPrice",
            render: (stopPrice: number | null) => formatPrice(stopPrice),
        },
        {
            title: "Timestamp",
            dataIndex: "timestamp",
            key: "timestamp",
            render: (timestamp: string) => formatDate(timestamp),
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
                let color = "";
                switch (status) {
                    case "SUCCESS":
                        color = "green";
                        break;
                    case "CANCELLED":
                        color = "red";
                        break;
                    case "PENDING":
                        color = "blue";
                        break;
                    default:
                        color = "inherit";
                }
                return <span style={{ color }}>{status}</span>;
            },
        },
        {
            title: "Asset Symbol",
            dataIndex: "tradingSymbol",
            key: "tradingSymbol",
        },
        {
            title: "Quantity",
            dataIndex: ["orderItem", "quantity"],
            key: "quantity",
            render: (quantity: number) => quantity.toLocaleString(),
        },
        {
            title: "Buy Price",
            dataIndex: ["orderItem", "buyPrice"],
            key: "buyPrice",
            render: (buyPrice: number) => formatPrice(buyPrice),
        },
        {
            title: "Sell Price",
            dataIndex: ["orderItem", "sellPrice"],
            key: "sellPrice",
            render: (sellPrice: number) => formatPrice(sellPrice),
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
                <h2>Orders Table</h2>
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
                    <label style={{ marginRight: 8 }}>Status:</label>
                    <Select
                        style={{ width: 150 }}
                        placeholder="Select status"
                        onChange={handleStatusChange}
                        value={filters.status}
                        allowClear
                    >
                        <Option value="PENDING">Pending</Option>
                        <Option value="CANCELLED">Cancelled</Option>
                        <Option value="SUCCESS">Success</Option>
                    </Select>
                </div>
                <div>
                    <label style={{ marginRight: 8 }}>Asset Symbol:</label>
                    <Select
                        style={{ width: 150 }}
                        placeholder="Select asset symbol"
                        onChange={handleAssetSymbolChange}
                        value={filters.asset_symbol}
                        allowClear
                    >
                        {assetSymbols.map((symbol) => (
                            <Option key={symbol} value={symbol}>
                                {symbol}
                            </Option>
                        ))}
                    </Select>
                </div>
                <div>
                    <label style={{ marginRight: 8 }}>Order Type:</label>
                    <Select
                        style={{ width: 150 }}
                        placeholder="Select order type"
                        onChange={handleOrderTypeChange}
                        value={filters.order_type}
                        allowClear
                    >
                        <Option value="LIMIT_BUY">Limit Buy</Option>
                        <Option value="LIMIT_SELL">Limit Sell</Option>
                        <Option value="BUY">Buy</Option>
                        <Option value="SELL">Sell</Option>
                        <Option value="STOP_LIMIT_SELL">Stop Limit Sell</Option>
                        <Option value="STOP_LIMIT_BUY">Stop Limit Buy</Option>
                    </Select>
                </div>
            </Space>

            <Table
                columns={columns}
                dataSource={listOrders}
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
                    disabled: listOrders.length === 0,
                    nextIcon: listOrders.length === meta.pageSize ? undefined : null,
                    prevIcon: meta.current === 1 ? null : undefined,
                }}
            />
        </div>
    );
};

export default OrdersTable;