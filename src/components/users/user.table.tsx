import { useEffect, useState } from "react";
import {
    Table,
    Button,
    notification,
    message,
    Popconfirm,
} from "antd";
import type { TableProps } from "antd";
import {
    PlusCircleOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import CreateUserModal from "./create.user.modal";
import UpdateUserModal from "./update.user.modal";

export interface ITwoFactorAuth {
    sendTo: string | null;
    enable: boolean;
}

export interface IUsers {
    id: string;
    fullName: string;
    email: string;
    role: string;
    mobile: string;
    avatar?: string;
    twoFactorAuth?: ITwoFactorAuth;
    referenceCode?: string;
    referredBy?: string | null;
    referralCount?: number;
    verified?: boolean;
}

const UsersTable = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [listUsers, setListUsers] = useState<IUsers[]>([]);
    const [dataUpdate, setDataUpdate] = useState<null | IUsers>(null);
    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    });
    const jwt = localStorage.getItem("jwt") as string;

    useEffect(() => {
        console.log("check useEffect");
        getData();
    }, []);

    const getData = async (page = 1, pageSize = 10) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/users/admin?page=${page - 1}&size=${pageSize}&sortBy=id&sortDir=asc`,
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from users:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const d = await res.json();
            if (d.content) {
                setListUsers(d.content);
                setMeta({
                    current: d.number + 1,
                    pageSize: d.size,
                    pages: d.totalPages,
                    total: d.totalElements,
                });
            } else {
                notification.error({
                    message: "No users found",
                    description: JSON.stringify(d.message || "Unknown error"),
                });
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            notification.error({
                message: "Error fetching users",
                description: error.message,
            });
        }
    };

    const confirm = async (user: IUsers) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/users/admin/${user.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        "Content-Type": "application/json",
                    },
                    method: "DELETE",
                }
            );

            if (res.ok) {
                // Nếu status 200 hoặc 204, coi như xóa thành công
                message.success("Delete User Success");
                await getData(meta.current, meta.pageSize);
            } else {
                // Nếu có lỗi, thử lấy thông báo từ body (nếu có)
                let errorMessage = "Có lỗi xảy ra khi xóa người dùng.";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (jsonError) {
                    // Nếu không có JSON trong body, dùng mã trạng thái
                    errorMessage = `HTTP error! Status: ${res.status}`;
                }
                notification.error({
                    message: "Error deleting user",
                    description: errorMessage,
                });
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            notification.error({
                message: "Error deleting user",
                description: error.message,
            });
        }
    };

    const handleOnChange = async (page: number, pageSize: number) => {
        await getData(page, pageSize);
    };

    const columns: TableProps<IUsers>["columns"] = [
        {
            title: "Email",
            dataIndex: "email",
        },
        {
            title: "Full Name",
            dataIndex: "fullName",
        },
        {
            title: "Role",
            dataIndex: "role",
        },
        {
            title: "Mobile",
            dataIndex: "mobile",
        },
        {
            title: "Verified",
            dataIndex: "verified",
            render: (verified: boolean) => (verified ? "Yes" : "No"),
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
                            title="Delete the user"
                            description={`Are you sure to delete this user. Name = ${record.fullName}?`}
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
                <h2>Table Users</h2>
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

            <Table
                columns={columns}
                dataSource={listUsers}
                rowKey={"id"}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showTotal: (total, range) =>
                        `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page: number, pageSize: number) => {
                        handleOnChange(page, pageSize);
                    },
                    showSizeChanger: true,
                }}
            />

            <CreateUserModal
                access_token={jwt}
                getData={getData}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
            />
            <UpdateUserModal
                access_token={jwt}
                getData={getData}
                isUpdateModalOpen={isUpdateModalOpen}
                setIsUpdateModalOpen={setIsUpdateModalOpen}
                dataUpdate={dataUpdate}
                setDataUpdate={setDataUpdate}
            />
        </div>
    );
};

export default UsersTable;