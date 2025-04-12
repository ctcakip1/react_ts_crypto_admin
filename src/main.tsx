import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./App.scss";
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    Link,
} from "react-router-dom";
import UsersPage from "./screens/users.page.tsx";
import { FireOutlined, SmileOutlined, SpotifyOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import CoinsPage from "./screens/coins.page.tsx";
import TransactionsPage from "./screens/transactions.page.tsx";

const items: MenuProps["items"] = [
    {
        label: <Link to={"/"}>Home</Link>,
        key: "home",
        icon: <FireOutlined />,
    },
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
];

const LayoutAdmin = () => {
    const getData = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/auth/signin", {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    email: "admin@gmail.com",
                    password: "123456",
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response from signin:", errorText);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const d = await res.json();
            if (d.jwt) {
                localStorage.setItem("jwt", d.jwt);
                console.log("JWT saved:", d.jwt);
            } else {
                console.error("No JWT in signin response:", d);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    return (
        <div>
            <Header />
            <Outlet />
        </div>
    );
};

const Header: React.FC = () => {
    const [current, setCurrent] = useState("home");

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
        <Menu
            onClick={onClick}
            selectedKeys={[current]}
            mode="horizontal"
            items={items}
        />
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
        ],
    },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);