import React, { useState, useEffect } from "react";
import { Select, message, DatePicker } from "antd";
import dayjs from "dayjs";
import SummaryCards from "../components/charts/SummaryCards";
import DailyVolumeChart from "../components/charts/DailyVolumeChart";
import MonthlyVolumeChart from "../components/charts/MonthlyVolumeChart";
import "../styles/dashboardPage.scss";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Define interfaces for TypeScript
type ApiResponse = number;

interface DaysOption {
    value: number;
    label: string;
}

interface MonthsOption {
    value: number;
    label: string;
}

const DashboardPage: React.FC = () => {
    const [days, setDays] = useState<number | null>(null);
    const [months, setMonths] = useState<number | null>(null); // New state for months
    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [totalByRange, setTotalByRange] = useState<number>(0);
    const [customerFees, setCustomerFees] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

    // Transaction type options
    const transactionTypeOptions: string[] = [
        "WITHDRAWAL",
        "WALLET_TRANSFER",
        "ADD_MONEY",
        "BUY_ASSET",
        "SELL_ASSET",
        "INTRODUCTORY_GIFT",
    ];

    // Days options
    const daysOptions: DaysOption[] = [
        { value: 0, label: "Today" },
        { value: 1, label: "Yesterday" },
        { value: 2, label: "2 Days Ago" },
        { value: 3, label: "3 Days Ago" },
        { value: 4, label: "4 Days Ago" },
        { value: 5, label: "5 Days Ago" },
        { value: 6, label: "6 Days Ago" },
    ];

    // Months options (1 to 12 months)
    const monthsOptions: MonthsOption[] = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `${i + 1} Month${i + 1 > 1 ? "s" : ""}`,
    }));

    // Fetch total transactions (by days)
    const fetchTotalTransactions = async (): Promise<void> => {
        if (dateRange || days == null) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("days", days.toString());
            if (transactionTypes.length > 0) {
                params.append("transaction_type", transactionTypes.join(","));
            }

            const url = `http://localhost:5000/api/history/admin/total-amount-transaction?${params.toString()}`;
            console.log("Fetching total transactions from:", url);

            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("JWT token not found in localStorage");
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Total transactions API error:", response.status, errorText);
                throw new Error(`Failed to fetch total transactions: ${response.status} ${errorText}`);
            }

            const data: ApiResponse = parseFloat(await response.text());
            console.log("Total transactions response:", data);
            setTotalTransactions(isNaN(data) ? 0 : data);
        } catch (error) {
            console.error("Error in fetchTotalTransactions:", error);
            message.error((error as Error).message || "Error fetching total transactions");
            setTotalTransactions(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch fees collected from customers
    const fetchCustomerFees = async (): Promise<void> => {
        if (days == null && !dateRange) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (!dateRange && days != null) params.append("days", days.toString());
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
                params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
            }
            params.append("transaction_type", "CUSTOMER_BUY_ASSET,CUSTOMER_SELL_ASSET");

            const baseUrl = dateRange
                ? "http://localhost:5000/api/history/admin/total-amount-transaction-by-range"
                : "http://localhost:5000/api/history/admin/total-amount-transaction";
            const url = `${baseUrl}?${params.toString()}`;
            console.log("Fetching customer fees from:", url);

            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("JWT token not found in localStorage");
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Customer fees API error:", response.status, errorText);
                throw new Error(`Failed to fetch customer fees: ${response.status} ${errorText}`);
            }

            const data: ApiResponse = parseFloat(await response.text());
            console.log("Customer fees response:", data);
            setCustomerFees(isNaN(data) ? 0 : data);
        } catch (error) {
            console.error("Error in fetchCustomerFees:", error);
            message.error((error as Error).message || "Error fetching customer fees");
            setCustomerFees(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch total transactions by date range
    const fetchTotalByRange = async (): Promise<void> => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            setTotalByRange(0);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
            params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
            if (transactionTypes.length > 0) {
                params.append("transaction_type", transactionTypes.join(","));
            }

            const url = `http://localhost:5000/api/history/admin/total-amount-transaction-by-range?${params.toString()}`;
            console.log("Fetching total by range from:", url);

            const jwt = localStorage.getItem("jwt");
            if (!jwt) {
                throw new Error("JWT token not found in localStorage");
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Total by range API error:", response.status, errorText);
                throw new Error(`Failed to fetch total by range: ${response.status} ${errorText}`);
            }

            const data: ApiResponse = parseFloat(await response.text());
            console.log("Total by range response:", data);
            setTotalByRange(isNaN(data) ? 0 : data);
        } catch (error) {
            console.error("Error in fetchTotalByRange:", error);
            message.error((error as Error).message || "Error fetching total by range");
            setTotalByRange(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when days, transactionTypes, or dateRange change
    useEffect(() => {
        fetchTotalTransactions();
        fetchCustomerFees();
        fetchTotalByRange();
    }, [days, transactionTypes, dateRange]);

    // Handle date range change
    const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
        setDateRange(dates);
        if (dates) {
            setDays(null);
        }
        if (!dates) {
            setTotalTransactions(0);
            setCustomerFees(0);
            setTotalByRange(0);
        }
    };

    // Handle days change
    const handleDaysChange = (value: number | undefined) => {
        setDays(value ?? null);
        if (value == null) {
            setTotalTransactions(0);
            setCustomerFees(0);
            setTotalByRange(0);
        }
    };

    // Handle months change
    const handleMonthsChange = (value: number | undefined) => {
        setMonths(value ?? null);
    };

    // Prepare data for SummaryCards
    const summaryData = {
        totalToday: totalTransactions,
        customerFees: customerFees,
        totalByRange: totalByRange,
    };

    return (
        <div className="dashboard-page">
            {/* Filters */}
            <div className="filters">
                <div className="filter-item">
                    <label className="filter-label">Select Days</label>
                    <Select
                        value={days ?? undefined}
                        onChange={handleDaysChange}
                        placeholder="Select days"
                        className="w-full"
                        disabled={!!dateRange}
                        allowClear
                    >
                        {daysOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className="filter-item">
                    <label className="filter-label">Transaction Type</label>
                    <Select
                        mode="multiple"
                        value={transactionTypes}
                        onChange={(value: string[]) => setTransactionTypes(value)}
                        placeholder="Select transaction types"
                        className="w-full"
                        allowClear
                    >
                        {transactionTypeOptions.map((type) => (
                            <Option key={type} value={type}>
                                {type}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className="filter-item">
                    <label className="filter-label">Select Date Range</label>
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        format="YYYY-MM-DD"
                        className="w-full"
                        allowClear
                    />
                </div>

                <div className="filter-item">
                    <label className="filter-label">Select Months</label>
                    <Select
                        value={months ?? undefined}
                        onChange={handleMonthsChange}
                        placeholder="Select months"
                        className="w-full"
                        allowClear
                    >
                        {monthsOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <SummaryCards data={summaryData} loading={loading} />
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                <DailyVolumeChart days={days} dateRange={dateRange} transactionTypes={transactionTypes} />
                <MonthlyVolumeChart transactionTypes={transactionTypes} months={months} />
            </div>
        </div>
    );
};

export default DashboardPage;