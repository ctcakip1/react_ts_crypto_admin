import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { notification, Form, Input, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

// Define the interface for the wallet data based on the API response
interface IUserWallet {
    id: string;
    userId: string;
    balance: number;
    heldBalance: number;
}

const UserWalletDisplay = () => {
    const { userId } = useParams<{ userId: string }>(); // Get userId from URL
    const navigate = useNavigate();
    const [walletData, setWalletData] = useState<IUserWallet | null>(null);
    const [form] = Form.useForm();
    const access_token = localStorage.getItem("jwt") as string;

    useEffect(() => {
        fetchWalletData();
    }, [userId]);

    const fetchWalletData = async () => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/wallet/admin/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from wallet:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            setWalletData(data);
            // Set form values with the fetched data
            form.setFieldsValue({
                id: data.id,
                userId: data.userId,
                balance: data.balance,
                heldBalance: data.heldBalance,
            });
        } catch (error) {
            console.error("Error fetching wallet data:", error);
            notification.error({
                message: "Error fetching wallet data",
                description: "You do not have permission to access this endpoint or an error occurred.",
            });
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <h2>User Wallet (User ID: {userId})</h2>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/users")}
                >
                    Back
                </Button>
            </div>

            <Form form={form} layout="vertical">
                <Form.Item label="Wallet ID" name="id">
                    <Input disabled />
                </Form.Item>
                <Form.Item label="User ID" name="userId">
                    <Input disabled />
                </Form.Item>
                <Form.Item label="Balance" name="balance">
                    <Input disabled addonAfter="$" />
                </Form.Item>
                <Form.Item label="Held Balance" name="heldBalance">
                    <Input disabled addonAfter="$" />
                </Form.Item>
            </Form>
        </div>
    );
};

export default UserWalletDisplay;