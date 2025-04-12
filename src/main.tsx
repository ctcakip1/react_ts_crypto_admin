import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./App.scss";
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";
import UsersPage from "./screens/users.page.tsx";
import { FireOutlined, SmileOutlined, SpotifyOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Button, Dropdown, Form, Input, Menu, message, Modal, notification, type MenuProps, Descriptions } from "antd";
import CoinsPage from "./screens/coins.page.tsx";
import TransactionsPage from "./screens/transactions.page.tsx";
import OrdersPage from "./screens/orders.page.tsx";
import LoginPage from "./screens/login.page.tsx";
import WithdrawalsPage from "./screens/withdrawals.page.tsx";
import UserWalletTransactionTable from "./components/transactions/user.transaction.table.tsx";
import UserWalletDisplay from "./components/transactions/user.wallet.display.tsx";

// Định nghĩa interface cho dữ liệu profile
interface UserProfile {
    id: number;
    fullName: string;
    email: string;
    mobile: string;
    avatar: string;
    twoFactorAuth: {
        sendTo: string;
        enable: boolean;
    };
    role: string;
    referralCode: string;
    referredBy: string | null;
    referralCount: number;
    verified: boolean;
}

const LayoutAdmin = () => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        const storedRole = localStorage.getItem("role");

        if (!jwt) {
            setIsAuthenticated(false);
            navigate("/login");
        } else {
            setIsAuthenticated(true);
            if (storedRole) {
                setUserRole(storedRole);
            } else {
                fetch("http://localhost:5000/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                })
                    .then((res) => {
                        if (!res.ok) {
                            throw new Error(`HTTP error! Status: ${res.status}`);
                        }
                        return res.json();
                    })
                    .then((data) => {
                        const role = data.role;
                        setUserRole(role);
                        localStorage.setItem("role", role);
                    })
                    .catch((error) => {
                        console.error("Error fetching user profile:", error);
                        notification.error({
                            message: "Error fetching user profile",
                            description: error.message,
                        });
                        localStorage.removeItem("jwt");
                        localStorage.removeItem("role");
                        setIsAuthenticated(false);
                        navigate("/login");
                    });
            }
        }
    }, [navigate]);

    if (isAuthenticated === null || userRole === null) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div>
            <Header userRole={userRole} />
            <Outlet />
        </div>
    );
};

const Header: React.FC<{ userRole: string }> = ({ userRole }) => {
    const [current, setCurrent] = useState("home");
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("jwt"));
    const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);
    const [form] = Form.useForm();

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    const handleLogout = () => {
        localStorage.removeItem("jwt");
        localStorage.removeItem("role");
        setIsLoggedIn(false);
        message.success("Logout Success");
        navigate("/login");
    };

    const handleChangePassword = async (values: { oldPassword: string; newPassword: string }) => {
        try {
            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("No JWT found. Please log in again.");
            }

            const res = await fetch("http://localhost:5000/api/users/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                notification.error({
                    message: "Change Password Failed",
                    description: errorData.message || "An error occurred while changing the password.",
                });
                return;
            }

            const responseText = await res.text();
            notification.success({
                message: "Password Changed",
                description: responseText || "Your password has been changed successfully.",
            });

            setIsChangePasswordModalVisible(false);
            form.resetFields();
            handleLogout();
        } catch (error) {
            notification.error({
                message: "Change Password Failed",
                description: error.message || "An unexpected error occurred.",
            });
        }
    };

    const handleViewProfile = async () => {
        try {
            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("No JWT found. Please log in again.");
            }

            const res = await fetch("http://localhost:5000/api/users/profile", {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            setProfileData(data);
            setIsProfileModalVisible(true);
        } catch (error) {
            notification.error({
                message: "Error fetching profile",
                description: error.message || "An unexpected error occurred.",
            });
        }
    };

    const dropdownMenu = (
        <Menu>
            <Menu.Item key="profile" onClick={handleViewProfile}>
                Profile
            </Menu.Item>
            <Menu.Item key="change-password" onClick={() => setIsChangePasswordModalVisible(true)}>
                Change Password
            </Menu.Item>
            <Menu.Item key="logout" onClick={handleLogout}>
                Logout
            </Menu.Item>
        </Menu>
    );

    const items: MenuProps["items"] = [
        {
            label: <Link to={"/"}>Home</Link>,
            key: "home",
            icon: <FireOutlined />,
        },
        ...(userRole === "ROLE_ADMIN"
            ? [
                {
                    label: <Link to={"/users"}>Manage Users</Link>,
                    key: "users",
                    icon: <SmileOutlined />,
                },
                {
                    label: <Link to={"/coins"}>Manage Coins</Link>,
                    key: "coins",
                    icon: <SpotifyOutlined />,
                },
                {
                    label: <Link to={"/transactions"}>Manage Transactions</Link>,
                    key: "transactions",
                    icon: <SpotifyOutlined />,
                },
                {
                    label: <Link to={"/orders"}>Manage Orders</Link>,
                    key: "orders",
                    icon: <SpotifyOutlined />,
                },
                {
                    label: <Link to={"/withdrawals"}>Manage Withdrawals</Link>,
                    key: "withdrawals",
                    icon: <SpotifyOutlined />,
                },
            ]
            : []),
    ];

    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" }}>
            <Menu
                onClick={onClick}
                selectedKeys={[current]}
                mode="horizontal"
                items={items}
                style={{ flex: 1 }}
            />
            {isLoggedIn ? (
                <Dropdown overlay={dropdownMenu} trigger={["click"]}>
                    <Button type="link" icon={<UserOutlined />} style={{ fontSize: 20 }} />
                </Dropdown>
            ) : (
                <Button type="link" onClick={() => navigate("/login")}>
                    Login
                </Button>
            )}

            <Modal
                title="Change Password"
                visible={isChangePasswordModalVisible}
                onCancel={() => {
                    setIsChangePasswordModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
            >
                <Form form={form} onFinish={handleChangePassword} layout="vertical">
                    <Form.Item
                        label="Old Password"
                        name="oldPassword"
                        rules={[{ required: true, message: "Please input your old password!" }]}
                    >
                        <Input.Password placeholder="Old Password" />
                    </Form.Item>
                    <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[{ required: true, message: "Please input your new password!" }]}
                    >
                        <Input.Password placeholder="New Password" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
                            Change Password
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="User Profile"
                visible={isProfileModalVisible}
                onCancel={() => setIsProfileModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsProfileModalVisible(false)}>
                        Close
                    </Button>,
                ]}
            >
                {profileData ? (
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label="ID">{profileData.id}</Descriptions.Item>
                        <Descriptions.Item label="Full Name">{profileData.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Email">{profileData.email}</Descriptions.Item>
                        <Descriptions.Item label="Mobile">{profileData.mobile}</Descriptions.Item>
                        <Descriptions.Item label="Role">{profileData.role}</Descriptions.Item>
                        <Descriptions.Item label="Referral Code">{profileData.referralCode}</Descriptions.Item>
                        <Descriptions.Item label="Referred By">{profileData.referredBy || "N/A"}</Descriptions.Item>
                        <Descriptions.Item label="Referral Count">{profileData.referralCount}</Descriptions.Item>
                        <Descriptions.Item label="Verified">
                            {profileData.verified ? (
                                <CheckCircleOutlined style={{ color: "green", fontSize: "20px" }} />
                            ) : (
                                <CloseCircleOutlined style={{ color: "red", fontSize: "20px" }} />
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Two-Factor Auth">
                            {profileData.twoFactorAuth.enable ? `Enabled (Send to: ${profileData.twoFactorAuth.sendTo})` : "Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Avatar">
                            <img src={profileData.avatar} alt="Avatar" style={{ width: 100, height: 100 }} />
                        </Descriptions.Item>
                    </Descriptions>
                ) : (
                    <p>Loading profile data...</p>
                )}
            </Modal>
        </div>
    );
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <LayoutAdmin />,
        children: [
            { index: true, element: <App /> },
            {
                path: "users",
                element: <UsersPage />,
            },
            {
                path: "coins",
                element: <CoinsPage />,
            },
            {
                path: "transactions",
                element: <TransactionsPage />,
            },
            {
                path: "orders",
                element: <OrdersPage />,
            },
            {
                path: "withdrawals",
                element: <WithdrawalsPage />,
            },
            {
                path: "users/:userId/wallet-transactions", // Route mới
                element: <UserWalletTransactionTable />,
            },
            {
                path: "users/:userId/wallet", // New route for UserWallet
                element: <UserWalletDisplay />,
            },
        ],
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);