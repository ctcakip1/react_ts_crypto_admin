import React, { useState } from "react";
import { Button, Checkbox, Input, Form, Typography, notification } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Link } = Typography;

const LoginPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            // Gửi yêu cầu đăng nhập
            const res = await fetch("http://localhost:5000/api/auth/signin", {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            if (data.jwt) {
                localStorage.setItem("jwt", data.jwt);

                // Gọi API để lấy thông tin user và role
                const profileRes = await fetch("http://localhost:5000/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${data.jwt}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!profileRes.ok) {
                    const profileError = await profileRes.json();
                    throw new Error(profileError.message || `HTTP error! Status: ${profileRes.status}`);
                }

                const profileData = await profileRes.json();
                const role = profileData.role;
                localStorage.setItem("role", role); // Lưu role vào localStorage

                notification.success({
                    message: "Login Successful",
                    description: "You have successfully logged in!",
                });

                // Nếu role không phải ROLE_ADMIN, chỉ cho phép truy cập trang Home
                if (role !== "ROLE_ADMIN") {
                    notification.warning({
                        message: "Access Limited",
                        description: "You do not have admin privileges. Access to management pages is restricted.",
                    });
                }

                navigate("/", { replace: true }); // Chuyển hướng sau khi đăng nhập
            } else {
                throw new Error("No JWT in response");
            }
        } catch (error) {
            notification.error({
                message: "Login Failed",
                description: error.message || "An unexpected error occurred.",
            });
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#f0f2f5",
                overflow: "hidden",
                margin: 0,
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: 400,
                    padding: 24,
                    backgroundColor: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    boxSizing: "border-box",
                }}
            >
                <Title level={2} style={{ textAlign: "center", marginBottom: 16 }}>
                    Login
                </Title>

                <Form
                    name="login_form"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        label="Username or Email"
                        name="email"
                        rules={[{ required: true, message: "Please input your email!" }]}
                    >
                        <Input placeholder="Username or Email" size="large" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Please input your password!" }]}
                    >
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            size="large"
                            suffix={
                                <Button
                                    type="link"
                                    onClick={() => setShowPassword(!showPassword)}
                                    icon={
                                        showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />
                                    }
                                    style={{ color: "#00c4b4" }}
                                >
                                    {showPassword ? "hide" : "show"}
                                </Button>
                            }
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            style={{ width: "100%", backgroundColor: "#00c4b4", borderColor: "#00c4b4" }}
                        >
                            Log in
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default LoginPage;