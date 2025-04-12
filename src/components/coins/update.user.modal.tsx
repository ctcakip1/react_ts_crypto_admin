import { useState, useEffect } from "react";
import {
    Modal,
    Input,
    notification,
    Form,
    type FormProps,
    Switch,
    InputNumber,
} from "antd";
import { ICoins } from "./coin.table";

interface IProps {
    access_token: string;
    getData: any;
    isUpdateModalOpen: boolean;
    setIsUpdateModalOpen: (v: boolean) => void;
    dataUpdate: null | ICoins;
    setDataUpdate: any;
}

const UpdateCoinModal = (props: IProps) => {
    const {
        access_token,
        getData,
        isUpdateModalOpen,
        setIsUpdateModalOpen,
        dataUpdate,
        setDataUpdate,
    } = props;
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchCoinById = async () => {
            if (dataUpdate && isUpdateModalOpen) {
                try {
                    const res = await fetch(`http://localhost:5000/api/coins/${dataUpdate.id}`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    if (!res.ok) {
                        throw new Error(`HTTP error! Status: ${res.status}`);
                    }

                    const d = await res.json();
                    console.log("Data from getCoinById:", d);

                    const minimumBuyPrice = d.minimum_buy_price
                        ? parseFloat(d.minimum_buy_price)
                        : null;
                    const transactionFee = d.transaction_fee
                        ? parseFloat(d.transaction_fee)
                        : null;

                    console.log("Parsed minimum_buy_price:", minimumBuyPrice);
                    console.log("Parsed transaction_fee:", transactionFee);
                    console.log("is_new:", d.is_new);
                    console.log("is_delisted:", d.is_delisted);

                    form.setFieldsValue({
                        symbol: d.symbol,
                        name: d.name,
                        minimum_buy_price: minimumBuyPrice,
                        transaction_fee: transactionFee,
                        total_supply: 0, // Always set to 0, not fetched from backend
                        is_new: d.is_new,
                        is_delisted: d.is_delisted,
                    });
                    console.log("Form fields after set:", form.getFieldsValue());
                } catch (error) {
                    console.error("Error fetching coin by ID:", error);
                    notification.error({
                        message: "Error fetching coin data",
                        description: error.message,
                    });
                }
            }
        };

        fetchCoinById();
    }, [dataUpdate, isUpdateModalOpen, access_token, form]);

    const handleCloseCreateModal = () => {
        setIsUpdateModalOpen(false);
        form.resetFields();
        setDataUpdate(null);
    };

    const handleUpdateIsNew = async (checked: boolean) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/admin/coins/${dataUpdate?.id}/is-new?isNew=${checked}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    method: "PUT",
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const d = await res.json();
            console.log("Update is_new response:", d);
            notification.success({
                message: `Coin ${checked ? "marked as new" : "unmarked as new"} successfully`,
            });
            await getData();
        } catch (error) {
            console.error("Error updating is_new:", error);
            notification.error({
                message: "Error updating is_new",
                description: error.message,
            });
        }
    };

    const handleUpdateIsDelisted = async (checked: boolean) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/admin/coins/${dataUpdate?.id}/is-delisted?isDelisted=${checked}`,
                {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                        "Content-Type": "application/json",
                    },
                    method: "PUT",
                }
            );

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const d = await res.json();
            console.log("Update is_delisted response:", d);
            notification.success({
                message: `Coin ${checked ? "marked as delisted" : "unmarked as delisted"} successfully`,
            });
            await getData();
        } catch (error) {
            console.error("Error updating is_delisted:", error);
            notification.error({
                message: "Error updating is_delisted",
                description: error.message,
            });
        }
    };

    const onFinish: FormProps["onFinish"] = async (values) => {
        const { symbol, name, minimum_buy_price, transaction_fee, total_supply } = values;
        const data = {
            symbol,
            name,
            minimumBuyPrice: minimum_buy_price,
            transactionFee: transaction_fee != null ? transaction_fee : 0,
            totalSupply: total_supply != null ? total_supply : 0,
        };
        console.log("Form values:", values);
        console.log("Data sent to API:", data);

        try {
            const res = await fetch(`http://localhost:5000/api/admin/coins/${dataUpdate?.id}`, {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                method: "PUT",
                body: JSON.stringify(data),
            });

            const d = await res.json();
            console.log("API response:", JSON.stringify(d, null, 2));

            if (res.ok) {
                await getData(); // Refresh data to get updated quantity
                notification.success({
                    message: "Coin updated successfully",
                });
                handleCloseCreateModal();
            } else {
                notification.error({
                    message: d.message || "Unknown error",
                    description: "An error occurred while updating the coin",
                });
            }
        } catch (error) {
            console.error("Error updating coin:", error);
            notification.error({
                message: "Error updating coin",
                description: error.message,
            });
        }
    };

    return (
        <Modal
            title="Update a Coin"
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
                name="update_coin"
                onFinish={onFinish}
                layout="vertical"
                form={form}
            >
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Symbol"
                    name="symbol"
                    rules={[
                        {
                            required: true,
                            message: "Please input the coin symbol!",
                        },
                    ]}
                >
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Name"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "Please input the coin name!",
                        },
                    ]}
                >
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Minimum Buy Price"
                    name="minimum_buy_price"
                    rules={[
                        {
                            required: true,
                            message: "Please input the minimum buy price!",
                        },
                        {
                            validator: (_, value) =>
                                value > 0
                                    ? Promise.resolve()
                                    : Promise.reject("Minimum buy price must be greater than 0!"),
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        precision={6}
                        min={0.000001}
                        step={0.000001}
                    />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Transaction Fee"
                    name="transaction_fee"
                    rules={[
                        {
                            type: "number",
                            min: 0,
                            message: "Transaction fee must be a positive number!",
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        precision={6}
                        min={0}
                        step={0.000001}
                    />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Total Supply"
                    name="total_supply"
                    rules={[
                        {
                            required: true,
                            message: "Please input the total supply!",
                        },
                        {
                            validator: (_, value) =>
                                value >= 0
                                    ? Promise.resolve()
                                    : Promise.reject("Total supply must be a non-negative number!"),
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        precision={0}
                        min={0}
                        step={1}
                    />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Is New"
                    name="is_new"
                    valuePropName="checked"
                >
                    <Switch onChange={handleUpdateIsNew} />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Is Delisted"
                    name="is_delisted"
                    valuePropName="checked"
                >
                    <Switch onChange={handleUpdateIsDelisted} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UpdateCoinModal;