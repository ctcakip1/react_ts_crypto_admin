import { useEffect, useState } from "react";
import { notification, Table, TableProps, Select, Space, Dropdown, Button, Menu } from "antd";

const { Option } = Select;

// Define the interface for withdrawals based on the updated API response
export interface IWithdrawal {
    withdrawal: {
        id: number;
        status: string;
        amount: number;
        userId: number;
        dateTime: string;
    };
    bankAccount: string;
    bankName: string;
    accountHolderName: string | null;
}

const WithdrawalsTable = () => {
    const [listWithdrawals, setListWithdrawals] = useState<IWithdrawal[]>([]);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 15, // Fixed page size to 15
        total: 0,
    });
    const [filters, setFilters] = useState({
        withdrawalStatus: "", // Change to string instead of array
    });

    const access_token = localStorage.getItem("jwt") as string;

    useEffect(() => {
        getData();
    }, [filters, meta.current]); // Re-fetch data when filters or current page change

    const getData = async (page = meta.current) => {
        try {
            // Build query parameters for pagination (page and size are always required)
            const queryParams = new URLSearchParams();
            queryParams.append("page", (page - 1).toString());
            queryParams.append("size", meta.pageSize.toString());

            // Only add withdrawalStatus to query if it's selected (not empty)
            if (filters.withdrawalStatus) {
                queryParams.append("withdrawalStatus", filters.withdrawalStatus);
            }

            // Use the correct API endpoint
            const res = await fetch(
                `http://localhost:5000/api/withdrawal/admin?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                console.log("Error response from withdrawals:", errorData);
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }

            const withdrawalsData = await res.json();
            console.log("API response (withdrawals):", withdrawalsData);

            if (Array.isArray(withdrawalsData)) {
                setListWithdrawals(withdrawalsData);
                // Estimate total: if we get 15 records, assume there might be more
                setMeta((prev) => ({
                    ...prev,
                    current: page,
                    total: withdrawalsData.length === meta.pageSize ? prev.total + meta.pageSize : prev.total,
                }));
            } else {
                notification.error({
                    message: "No withdrawals found",
                    description: JSON.stringify(withdrawalsData.message || "Unknown error"),
                });
                setListWithdrawals([]);
                setMeta((prev) => ({
                    ...prev,
                    total: 0,
                }));
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
            notification.error({
                message: "Error fetching withdrawals",
                description: error.message,
            });
            setListWithdrawals([]);
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

    const handleWithdrawalStatusChange = (value: string) => {
        setFilters((prev) => ({
            ...prev,
            withdrawalStatus: value,
        }));
        setMeta((prev) => ({
            ...prev,
            current: 1, // Reset to page 1 when filters change
            total: 0, // Reset total when filters change
        }));
    };

    // Function to handle the action (DECLINE or Accept)
    const handleAction = async (withdrawalId: number, action: "DECLINE" | "Accept") => {
        try {
            const acceptValue = action === "DECLINE" ? 0 : 1; // 0 for DECLINE, 1 for Accept
            const queryParams = new URLSearchParams();
            queryParams.append("accept", acceptValue.toString());

            const res = await fetch(
                `http://localhost:5000/api/withdrawal/${withdrawalId}/proceed?${queryParams.toString()}`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }

            // API returns JSON on success
            const responseData = await res.json();
            notification.success({
                message: `${action} Successful`,
                description: `Withdrawal ${withdrawalId} has been ${action.toLowerCase()}d.`,
            });

            // Refresh the table data after action
            getData(meta.current);
        } catch (error) {
            console.error(`Error ${action.toLowerCase()}ing withdrawal:`, error);
            notification.error({
                message: `${action} Failed`,
                description: error.message || `Failed to ${action.toLowerCase()} withdrawal.`,
            });
        }
    };

    // Function to format date using JavaScript's Date (only YYYY-MM-DD)
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

    const columns: TableProps<IWithdrawal>["columns"] = [
        {
            title: "ID",
            dataIndex: ["withdrawal", "id"],
            key: "id",
        },
        {
            title: "Status",
            dataIndex: ["withdrawal", "status"],
            key: "status",
            render: (status: string) => {
                let color = "";
                switch (status) {
                    case "SUCCESS":
                        color = "green";
                        break;
                    case "DECLINE":
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
            title: "Amount",
            dataIndex: ["withdrawal", "amount"],
            key: "amount",
            render: (amount: number) => `$${amount.toLocaleString()}`,
        },
        {
            title: "User ID",
            dataIndex: ["withdrawal", "userId"],
            key: "userId",
        },
        {
            title: "Date",
            dataIndex: ["withdrawal", "dateTime"],
            key: "dateTime",
            render: (date: string) => formatDate(date), // Only show YYYY-MM-DD
        },
        {
            title: "Bank Account ID",
            dataIndex: "bankAccount",
            key: "bankAccount",
        },
        {
            title: "Bank Name",
            dataIndex: "bankName",
            key: "bankName",
        },
        {
            title: "Account Holder Name",
            dataIndex: "accountHolderName",
            key: "accountHolderName",
            render: (name: string | null) => name || "N/A", // Handle null value
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => {
                // Only show action dropdown for PENDING status
                if (record.withdrawal.status !== "PENDING") {
                    return null;
                }

                const menu = (
                    <Menu>
                        <Menu.Item
                            key="decline"
                            onClick={() => handleAction(record.withdrawal.id, "DECLINE")}
                        >
                            Decline
                        </Menu.Item>
                        <Menu.Item
                            key="accept"
                            onClick={() => handleAction(record.withdrawal.id, "Accept")}
                        >
                            Accept
                        </Menu.Item>
                    </Menu>
                );

                return (
                    <Dropdown overlay={menu} trigger={["click"]}>
                        <Button>Action</Button>
                    </Dropdown>
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
                    marginBottom: 16,
                }}
            >
                <h2>Withdrawals Table</h2>
            </div>

            <Space style={{ marginBottom: 16 }}>
                <div>
                    <label style={{ marginRight: 8 }}>Withdrawal Status:</label>
                    <Select
                        allowClear
                        style={{ width: 300 }}
                        placeholder="Select withdrawal status"
                        onChange={handleWithdrawalStatusChange}
                        value={filters.withdrawalStatus || undefined} // Ensure value is undefined when cleared
                    >
                        <Option value="PENDING">Pending</Option>
                        <Option value="SUCCESS">Success</Option>
                        <Option value="DECLINE">Decline</Option>
                    </Select>
                </div>
            </Space>

            <Table
                columns={columns}
                dataSource={listWithdrawals}
                rowKey={(record) => record.withdrawal.id.toString()} // Use withdrawal.id as rowKey
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
                    disabled: listWithdrawals.length === 0, // Disable pagination if no data
                    nextIcon: listWithdrawals.length === meta.pageSize ? undefined : null, // Disable "Next" if less than 15 records
                    prevIcon: meta.current === 1 ? null : undefined, // Disable "Prev" if on first page
                }}
            />
        </div>
    );
};

export default WithdrawalsTable;