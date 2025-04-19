import React, { useState, useEffect } from "react";
import { Select, message, DatePicker } from "antd";
import dayjs from "dayjs";
import SummaryCards from "../components/charts/SummaryCards";
import DailyVolumeChart from "../components/charts/DailyVolumeChart";
import MonthlyVolumeChart from "../components/charts/MonthlyVolumeChart";
import DailyFeeTransactionChart from "../components/charts/DailyFeeTransactionChart";
import MonthlyFeeTransactionChart from "../components/charts/MonthlyFeeTransactionChart";
import "../styles/dashboardPage.scss";
import TransactionByCoinTable from "../components/charts/TransactionByCoinTable";
import TransactionTable from "../components/charts/TransactionTable";

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
    const [days, setDays] = useState<number | null>(0); // Default to "Today"
    const [months, setMonths] = useState<number | null>(1); // Default to "1 Month"
    const [transactionTypes, setTransactionTypes] = useState<string[]>(["BUY_ASSET", "SELL_ASSET"]); // Default to BUY_ASSET and SELL_ASSET
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [totalFees, setTotalFees] = useState<number>(0);
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
        { value: 7, label: "A week" },
        { value: 30, label: "A month" },
        { value: 90, label: "Three month" },
        { value: 365, label: "One year" },
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

    // Fetch total transactions by date range
    const fetchTotalByRange = async (): Promise<void> => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
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
            setTotalTransactions(isNaN(data) ? 0 : data);
        } catch (error) {
            console.error("Error in fetchTotalByRange:", error);
            message.error((error as Error).message || "Error fetching total by range");
            setTotalTransactions(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch total transaction fees (by days or date range)
    const fetchTotalFees = async (): Promise<void> => {
        if (days == null && !dateRange) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (!dateRange && days != null) {
                params.append("days", days.toString());
            }
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
                params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
            }
            if (transactionTypes.length > 0) {
                params.append("transaction_type", transactionTypes.join(","));
            }

            const baseUrl = dateRange
                ? "http://localhost:5000/api/history/admin/total-fee-transaction-by-range"
                : "http://localhost:5000/api/history/admin/total-fee-transaction";
            const url = `${baseUrl}?${params.toString()}`;
            console.log("Fetching total fees from:", url);

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
                console.error("Total fees API error:", response.status, errorText);
                throw new Error(`Failed to fetch total fees: ${response.status} ${errorText}`);
            }

            const data: ApiResponse = parseFloat(await response.text());
            console.log("Total fees response:", data);
            setTotalFees(isNaN(data) ? 0 : data);
        } catch (error) {
            console.error("Error in fetchTotalFees:", error);
            message.error((error as Error).message || "Error fetching total fees");
            setTotalFees(0);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when days, transactionTypes, or dateRange change
    useEffect(() => {
        fetchTotalTransactions();
        fetchTotalFees();
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
            setTotalFees(0);
        }
    };

    // Handle days change
    const handleDaysChange = (value: number | undefined) => {
        setDays(value ?? null);
        if (value == null) {
            setTotalTransactions(0);
            setTotalFees(0);
        }
    };

    // Handle months change
    const handleMonthsChange = (value: number | undefined) => {
        setMonths(value ?? null);
    };

    // Handle transaction type change (prevent clearing all)
    const handleTransactionTypeChange = (value: string[]) => {
        if (value.length === 0) {
            message.warning("You must select at least one transaction type.");
            return; // Prevent clearing all
        }
        setTransactionTypes(value);
    };

    // Prepare data for SummaryCards
    const summaryData = {
        totalTransactions,
        totalFees,
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
                        onChange={handleTransactionTypeChange}
                        placeholder="Select transaction types"
                        className="w-full"
                        allowClear={false} // Disable clearing to enforce at least one selection
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
            <div className="charts-section">
                <DailyFeeTransactionChart days={days} dateRange={dateRange} transactionTypes={transactionTypes} />
                <MonthlyFeeTransactionChart transactionTypes={transactionTypes} months={months} />
            </div>

            {/* Transaction by Coin Table */}
            <TransactionByCoinTable days={days} dateRange={dateRange} />

            {/* Transaction Table */}
            <TransactionTable days={days} dateRange={dateRange} transactionTypes={transactionTypes} />
        </div>
    );
};

export default DashboardPage;