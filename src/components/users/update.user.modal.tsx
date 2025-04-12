import { useState, useEffect } from "react";
import {
    Modal,
    Input,
    notification,
    Form,
    Select,
    InputNumber,
    type FormProps,
} from "antd";
import { IUsers } from "./user.table";
interface IProps {
    access_token: string;
    getData: any;
    isUpdateModalOpen: boolean;
    setIsUpdateModalOpen: (v: boolean) => void;
    dataUpdate: null | IUsers;
    setDataUpdate: any;
}

const UpdateUserModal = (props: IProps) => {
    const {
        access_token,
        getData,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        dataUpdate,
        setDataUpdate,
    } = props;
    const { Option } = Select;
    const [form] = Form.useForm();

    useEffect(() => {
        if (dataUpdate) {
            form.setFieldsValue({
                fullName: dataUpdate.fullName,
                mobile: dataUpdate.mobile,
                role: dataUpdate.role,
            });
        }
    }, [dataUpdate]);

    const handleCloseCreateModal = () => {
        setIsUpdateModalOpen(false);
        form.resetFields();
        setDataUpdate(null);
    };

    const onFinish: FormProps["onFinish"] = async (values) => {
        const { fullName, mobile, role } = values;
        const data = {
            fullName,
            mobile,
            role,
        };
        console.log("Data sent to API:", data); // In dữ liệu gửi lên để debug

        const res = await fetch(`http://localhost:5000/api/users/admin/${dataUpdate?.id}`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
            },
            method: "PUT", // Sử dụng PUT thay vì PATCH
            body: JSON.stringify(data),
        });

        const d = await res.json();
        if (res.ok) {
            // Success
            await getData();
            notification.success({
                message: "User updated successfully",
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
            title="Update a User"
            open={isUpdateModalOpen}
            onOk={() => {
                form.submit();
            }}
            onCancel={() => {
                handleCloseCreateModal();
            }}
            maskClosable={false}
        >
            <Form
                name="update_user"
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

export default UpdateUserModal;