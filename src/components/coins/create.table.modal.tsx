import {
    Modal,
    Input,
    notification,
    Form,
    type FormProps,
    InputNumber,
} from "antd";

interface IProps {
    access_token: string;
    getData: any;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (v: boolean) => void;
}

const CreateCoinModal = (props: IProps) => {
    const { access_token, getData, isCreateModalOpen, setIsCreateModalOpen } = props;
    const [form] = Form.useForm();

    const handleCloseCreateModal = () => {
        form.resetFields();
        setIsCreateModalOpen(false);
    };

    const onFinish: FormProps["onFinish"] = async (values) => {
        const { coinId, minimumBuyPrice, transactionFee } = values;
        const data = {
            coinId,
            minimumBuyPrice, // Send as number
            transactionFee: transactionFee != null ? transactionFee : 0,
            totalSupply: 0,

        };
        console.log("Form values:", values);
        console.log("Data sent to API:", data);

        try {
            const res = await fetch("http://localhost:5000/api/admin/coins/add", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            });

            const d = await res.json();
            console.log("API response:", JSON.stringify(d, null, 2));

            if (res.ok) {
                await getData();
                notification.success({
                    message: "Coin created successfully",
                });
                handleCloseCreateModal();
            } else {
                // Giả định lỗi Jackson liên quan đến coinId không tồn tại
                const errorMessage = d.message && d.message.includes("JsonNode")
                    ? "CoinId không tồn tại"
                    : d.message || "Unknown error";
                notification.error({
                    message: errorMessage,
                    description: "An error occurred while creating the coin",
                });
            }
        } catch (error) {
            console.error("Error creating coin:", error);
            notification.error({
                message: "CoinId không tồn tại",
                description: error.message,
            });
        }
    };

    return (
        <Modal
            title="Add New Coin"
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
                name="create_coin"
                onFinish={onFinish}
                layout="vertical"
                form={form}
            >
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Coin ID"
                    name="coinId"
                    rules={[
                        {
                            required: true,
                            message: "Please input the coin ID!",
                        }
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: "5px" }}
                    label="Minimum Buy Price"
                    name="minimumBuyPrice"
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
                    name="transactionFee"
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
            </Form>
        </Modal>
    );
};

export default CreateCoinModal;