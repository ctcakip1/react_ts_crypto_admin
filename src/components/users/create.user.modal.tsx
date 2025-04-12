import { useState } from "react";
import {
    Modal,
    Input,
    notification,
    Form,
    type FormProps,
    Select,
} from "antd";

interface IProps {
    access_token: string;
    getData: any;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (v: boolean) => void;
}

const CreateUserModal = (props: IProps) => {
    const { access_token, getData, isCreateModalOpen, setIsCreateModalOpen } = props;
    const { Option } = Select;
    const [form] = Form.useForm();

    const handleCloseCreateModal = () => {
        form.resetFields();
        setIsCreateModalOpen(false);
    };

    const onFinish: FormProps["onFinish"] = async (values) => {
        const { fullName, email, mobile, password, role } = values;
        const data = { fullName, email, mobile, password, role };
        console.log("Data sent to API:", data); // In dữ liệu gửi lên để debug

        const res = await fetch("http://localhost:5000/api/users/admin", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify(data),
        });

        const d = await res.json();
        if (res.ok) {
            // Success
            await getData();
            notification.success({
                message: "User created successfully",
            });
            handleCloseCreateModal();
        } else {
            // Error
            notification.error({
                message: d.message || "Unknown error",
                description: "Có lỗi xảy ra",
            });
        }
    };

    return (
        <Modal
            title="Add New User"
            open={isCreateModalOpen}
            onOk={() => {
                form.submit();
            }}
            onCancel={() => {
                handleCloseCreateModal();
            }}
            maskClosable={false}
        >
            <Form
                name="create_user"
                onFinish={onFinish}
                layout="vertical"
                form={form}
            >
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Full Name"
                    name="fullName"
                    rules={[
                        {
                            required: true,
                            message: "Please input the full name!",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Email"
                    name="email"
                    rules={[
                        {
                            required: true,
                            message: "Please input the email!",
                        },
                        {
                            type: "email",
                            message: "Please input a valid email!",
                        },
                    ]}
                >
                    <Input type="email" />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Mobile"
                    name="mobile"
                    rules={[
                        {
                            required: true,
                            message: "Please input the mobile number!",
                        },
                        {
                            pattern: /^[0-9]+$/,
                            message: "Mobile number must contain only digits!",
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Password"
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: "Please input the password!",
                        },
                        {
                            min: 8,
                            message: "Password must be at least 8 characters!",
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: "Please select a role!" }]}
                >
                    <Select
                        placeholder="Select a role"
                        allowClear
                    >
                        <Option value="ROLE_ADMIN">ADMIN</Option>
                        <Option value="ROLE_CUSTOMER">CUSTOMER</Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CreateUserModal;