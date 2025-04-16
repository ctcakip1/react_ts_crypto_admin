import React, { useState, useEffect } from "react";
import { Select, message, DatePicker } from "antd";
import dayjs from "dayjs"; // For date formatting
import SummaryCards from "../components/charts/SummaryCards";

const { Option } = Select;
const { RangePicker } = DatePicker;

// Define interfaces for TypeScript
type ApiResponse = number; // API returns a plain number

interface DaysOption {
    value: number;
    label: string;
}

const DashboardPage: React.FC = () => {
    const [days, setDays] = useState<number | null>(null); // Initialize as null
    const [transactionTypes, setTransactionTypes] = useState<string[]>([]); // Default to no filter
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [customerFees, setCustomerFees] = useState<number>(0);
    const [totalByRange, setTotalByRange] = useState<number>(0); // New state for date range total
    const [loading, setLoading] = useState<boolean>(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null); // For startDate and endDate

    // Transaction type options
    const transactionTypeOptions: string[] = [
        "WITHDRAWAL",
        "WALLET_TRANSFER",
        "ADD_MONEY",
        "BUY_ASSET",
        "SELL_ASSET",
        "INTRODUCTORY_GIFT",
    ];

    // Days options (0 = Today, 1 = Yesterday, etc.)
    const daysOptions: DaysOption[] = [
        { value: 0, label: "Today" },
        { value: 1, label: "Yesterday" },
        { value: 2, label: "2 Days Ago" },
        { value: 3, label: "3 Days Ago" },
        { value: 4, label: "4 Days Ago" },
        { value: 5, label: "5 Days Ago" },
        { value: 6, label: "6 Days Ago" },
    ];

    // Fetch total transactions (by days)
    const fetchTotalTransactions = async (): Promise<void> => {
        if (dateRange || days == null) return; // Skip if date range is selected or days is null/undefined
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("days", days.toString()); // days is guaranteed to be a number here
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
        if (days == null && !dateRange) return; // Skip if days is null/undefined and no date range
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
            setDays(null); // Clear days filter when a date range is selected
        }
        if (!dates) {
            // Reset all metrics when date range is cleared
            setTotalTransactions(0);
            setCustomerFees(0);
            setTotalByRange(0);
        }
    };

    // Handle days change, ensuring undefined is converted to null
    const handleDaysChange = (value: number | undefined) => {
        setDays(value ?? null); // Convert undefined to null
        if (value == null) {
            // Reset all metrics when days is cleared
            setTotalTransactions(0);
            setCustomerFees(0);
            setTotalByRange(0);
        }
    };

    // Prepare data for SummaryCards
    const summaryData = {
        totalToday: totalTransactions,
        customerFees: customerFees,
        totalByRange: totalByRange,
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex flex-col w-full sm:w-1/4">
                    <label className="text-sm font-medium text-gray-700 mb-1">Select Days</label>
                    <Select
                        value={days ?? undefined} // Use undefined for placeholder when null
                        onChange={handleDaysChange} // Use new handler
                        placeholder="Select days"
                        className="w-full"
                        disabled={!!dateRange} // Disable when date range is selected
                        allowClear // Allow clearing the selection
                    >
                        {daysOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </div>

                <div className="flex flex-col w-full sm:w-1/4">
                    <label className="text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
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

                <div className="flex flex-col w-full sm:w-1/4">
                    <label className="text-sm font-medium text-gray-700 mb-1">Select Date Range</label>
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        format="YYYY-MM-DD"
                        className="w-full"
                        allowClear
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <SummaryCards data={summaryData} loading={loading} />
            </div>
        </div>
    );
};

export default DashboardPage;