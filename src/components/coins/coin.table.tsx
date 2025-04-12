import { Button, message, notification, Popconfirm, Table, TableProps } from "antd";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import UpdateCoinModal from "./update.user.modal";
import CreateCoinModal from "./create.table.modal";

export interface ICoins {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    total_volume: number;
    price_change_percentage_1h_in_currency: number;
    price_change_percentage_24h_in_currency: number;
    price_change_percentage_7d_in_currency: number;
    minimum_buy_price: string | null;
    transaction_fee: string | null;
    is_new: boolean;
    is_delisted: boolean;
    quantity?: number;
}

const CoinsTable = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [listCoins, setListCoins] = useState<ICoins[]>([]);
    const [dataUpdate, setDataUpdate] = useState<null | ICoins>(null);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10, // Fixed pageSize to 10
        total: 0,
    });
    const access_token = localStorage.getItem("jwt") as string;

    // Fetch data on initial load only
    useEffect(() => {
        console.log("Check useEffect");
        getData(1); // Fetch the first page on initial load
    }, []); // Empty dependency array to run only once on mount

    const getData = async (page: number) => {
        try {
            // Fetch the list of coins with pagination
            const res = await fetch(
                `http://localhost:5000/api/coins?page=${page - 1}&size=${meta.pageSize}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from coins:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const coinsData = await res.json();
            console.log("API response (coins):", coinsData);

            if (Array.isArray(coinsData)) {
                // Fetch quantity for each coin using GET /api/asset
                const coinsWithQuantity = await Promise.all(
                    coinsData.map(async (coin: ICoins) => {
                        try {
                            const assetRes = await fetch(
                                `http://localhost:5000/api/asset/admin`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${access_token}`,
                                        "Content-Type": "application/json",
                                    },
                                }
                            );

                            if (!assetRes.ok) {
                                throw new Error(`HTTP error! Status: ${assetRes.status}`);
                            }

                            const assetData = await assetRes.json();

                            // Find the asset that matches the coin's symbol
                            const matchingAsset = Array.isArray(assetData)
                                ? assetData.find((asset: any) => asset.coinDTO.symbol === coin.symbol)
                                : null;

                            return {
                                ...coin,
                                quantity: matchingAsset ? matchingAsset.quantity : 0,
                            };
                        } catch (error) {
                            console.error(`Error fetching quantity for ${coin.symbol}:`, error);
                            return { ...coin, quantity: 0 }; // Default to 0 if fetch fails
                        }
                    })
                );

                setListCoins(coinsWithQuantity);
                setMeta((prev) => ({
                    ...prev,
                    current: page,
                    total: coinsWithQuantity.length === meta.pageSize ? prev.total + meta.pageSize : prev.total,
                }));
            } else {
                notification.error({
                    message: "No coins found",
                    description: JSON.stringify(coinsData.message || "Unknown error"),
                });
                setListCoins([]);
                setMeta((prev) => ({
                    ...prev,
                    total: 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching coins:", error);
            notification.error({
                message: "Error fetching coins",
                description: error.message,
            });
            setListCoins([]);
            setMeta((prev) => ({
                ...prev,
                total: 0,
            }));
        }
    };

    const confirm = async (coin: ICoins) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/admin/coins/${coin.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    method: "DELETE",
                }
            );

            if (res.ok) {
                message.success("Delete Coin Success");
                await getData(meta.current);
            } else {
                let errorMessage = "An error occurred while deleting the coin.";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    errorMessage = `HTTP error! Status: ${res.status}`;
                }
                notification.error({
                    message: "Error deleting coin",
                    description: errorMessage,
                });
            }
        } catch (error) {
            console.error("Error deleting coin:", error);
            notification.error({
                message: "Error deleting coin",
                description: error.message,
            });
        }
    };

    const handleOnChange = async (page: number) => {
        await getData(page); // Fetch data for the new page
        setMeta((prev) => ({
            ...prev,
            current: page,
        }));
    };

    const columns: TableProps<ICoins>["columns"] = [
        {
            title: "Coin",
            dataIndex: "name",
            render: (name: string, record: ICoins) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                        src={record.image}
                        alt={name}
                        style={{ width: 24, height: 24, marginRight: 8 }}
                    />
                    <span>{name}</span>
                </div>
            ),
        },
        {
            title: "Price",
            dataIndex: "current_price",
            render: (price: number) => `$${price.toLocaleString()}`,
        },
        {
            title: "1h",
            dataIndex: "price_change_percentage_1h_in_currency",
            render: (change: number) => (
                <span style={{ color: change >= 0 ? "green" : "red" }}>
                    {change ? Math.abs(change).toFixed(1) : "N/A"}%
                </span>
            ),
        },
        {
            title: "24h",
            dataIndex: "price_change_percentage_24h",
            render: (change: number) => (
                <span style={{ color: change >= 0 ? "green" : "red" }}>
                    {change ? Math.abs(change).toFixed(1) : "N/A"}%
                </span>
            ),
        },
        {
            title: "7d",
            dataIndex: "price_change_percentage_7d_in_currency",
            render: (change: number) => (
                <span style={{ color: change >= 0 ? "green" : "red" }}>
                    {change ? Math.abs(change).toFixed(1) : "N/A"}%
                </span>
            ),
        },
        {
            title: "24h Volume",
            dataIndex: "total_volume",
            render: (volume: number) => `$${volume.toLocaleString()}`,
        },
        {
            title: "Market Cap",
            dataIndex: "market_cap",
            render: (marketCap: number) => `$${marketCap.toLocaleString()}`,
        },
        {
            title: "Quantity",
            dataIndex: "quantity",
            render: (quantity: number) => (quantity ? quantity.toLocaleString() : "N/A"),
        },
        {
            title: "Action",
            render: (value, record) => {
                return (
                    <div>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setDataUpdate(record);
                                setIsUpdateModalOpen(true);
                            }}
                        >
                            Edit
                        </Button>

                        <Popconfirm
                            title="Delete the coin"
                            description={`Are you sure to delete this coin. Name = ${record.name}?`}
                            onConfirm={() => confirm(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                danger
                                style={{ marginLeft: "20px" }}
                                icon={<DeleteOutlined />}
                            >
                                Delete
                            </Button>
                        </Popconfirm>
                    </div>
                );
            },
        },
    ];

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h2>Table Coins</h2>
                <div>
                    <Button
                        icon={<PlusCircleOutlined />}
                        type="primary"
                        onClick={() => {
                            setIsCreateModalOpen(true);
                        }}
                    >
                        Add New
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={listCoins}
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
                    showSizeChanger: false, // Disable page size changer
                    disabled: listCoins.length === 0, // Disable pagination if no data
                    nextIcon: listCoins.length === meta.pageSize ? undefined : null, // Disable "Next" if less than 10 records
                    prevIcon: meta.current === 1 ? null : undefined, // Disable "Prev" if on first page
                }}
            />

            <CreateCoinModal
                access_token={access_token}
                getData={getData}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
            />
            <UpdateCoinModal
                access_token={access_token}
                getData={getData}
                isUpdateModalOpen={isUpdateModalOpen}
                setIsUpdateModalOpen={setIsUpdateModalOpen}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />
        </div>
    );
};

export default CoinsTable;