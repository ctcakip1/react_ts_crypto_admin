import { notification, Spin, Table, TableProps } from "antd";
import { useEffect, useState } from "react";
import { ICoins } from "./coin.table";
const NewCoinsPage = () => {
    const [listCoins, setListCoins] = useState<ICoins[]>([]);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const access_token = localStorage.getItem("jwt") || "";
    const [assetsCache, setAssetsCache] = useState<Record<string, number>>({});

    useEffect(() => {
        getData();
    }, []);

    const getData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `http://localhost:5000/api/coins/new-listing`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const coinsData = await res.json();

            if (Array.isArray(coinsData)) {
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
                    current: 1,
                    pageSize: meta.pageSize,
                    total: coinsData.length,
                });
            } else {
                notification.error({
                    message: "No new coins found",
                    description: JSON.stringify(coinsData.message || "Unknown error"),
                });
                setListCoins([]);
                setMeta({
                    current: 1,
                    pageSize: meta.pageSize,
                    total: 0,
                });
            }
        } catch (error) {
            console.error("Error fetching new coins:", error);
            notification.error({
                message: "Error fetching new coins",
                description: error.message,
            });
            setListCoins([]);
            setMeta({
                current: 1,
                pageSize: meta.pageSize,
                total: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOnChange = (page: number) => {
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
    ];

    return (
        <div>
            <h2>New Coins</h2>
            {isLoading ? (
                <Spin tip="Loading new coins..." size="large" style={{ display: "block", margin: "50px auto" }} />
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
                    }}
                />
            )}
        </div>
    );
};
export default NewCoinsPage