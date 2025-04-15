import { Button, message, notification, Popconfirm, Table, TableProps, Spin } from "antd";
import { PlusCircleOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState, useMemo } from "react";
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
        pageSize: 10,
        total: 0,
    });
    const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
    const access_token = localStorage.getItem("jwt") || "";

    // Cache dữ liệu assets
    const [assetsCache, setAssetsCache] = useState<Record<string, number>>({});

    useEffect(() => {
        console.log("Check useEffect");
        getData(meta.current);
    }, []);

    const getData = async (page: number) => {
        setIsLoading(true);
        const validPage = Math.max(1, Math.floor(Number(page) || 1));
        try {
            // Gọi API lấy danh sách coins
            const res = await fetch(
                `http://localhost:5000/api/coins?page=${validPage - 1}&size=${meta.pageSize}`,
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
                // Gọi API lấy assets một lần duy nhất
                let updatedAssetsCache = { ...assetsCache };
                if (!Object.keys(assetsCache).length) {
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
                    if (Array.isArray(assetData)) {
                        updatedAssetsCache = assetData.reduce((acc: Record<string, number>, asset: any) => {
                            if (asset.coinDTO?.symbol) {
                                acc[asset.coinDTO.symbol] = asset.quantity || 0;
                            }
                            return acc;
                        }, {});
                        setAssetsCache(updatedAssetsCache);
                    }
                }

                // Gắn quantity từ cache
                const coinsWithQuantity = coinsData.map((coin: ICoins) => ({
                    ...coin,
                    quantity: updatedAssetsCache[coin.symbol] ?? 0,
                }));

                setListCoins(coinsWithQuantity);
                setMeta({
                    current: validPage,
                    pageSize: meta.pageSize,
                    total: coinsData.length === meta.pageSize ? (validPage * meta.pageSize) : coinsData.length,
                });
            } else {
                notification.error({
                    message: "No coins found",
                    description: JSON.stringify(coinsData.message || "Unknown error"),
                });
                setListCoins([]);
                setMeta({
                    current: validPage,
                    pageSize: meta.pageSize,
                    total: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching coins:", error);
            notification.error({
                message: "Error fetching coins",
                description: error.message,
            });
            setListCoins([]);
            setMeta({
                current: validPage,
                pageSize: meta.pageSize,
                total: 0,
            });
        } finally {
            setIsLoading(false);
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
        await getData(page);
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

            {isLoading ? (
                <Spin tip="Loading coins..." size="large" style={{ display: "block", margin: "50px auto" }} />
            ) : (
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
                        showSizeChanger: false,
                        disabled: listCoins.length === 0,
                        nextIcon: listCoins.length === meta.pageSize ? undefined : null,
                        prevIcon: meta.current === 1 ? null : undefined,
                    }}
                />
            )}

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