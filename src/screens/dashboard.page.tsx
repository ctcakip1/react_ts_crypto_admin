import React, { useState, useEffect, useCallback } from 'react';
import { Row, Alert } from 'antd';
import moment from 'moment';
import '../styles/dashboardPage.scss';
import { SummaryData, Transaction, VolumeData } from '../types/backend';
import Filters from '../components/charts/Filters';
import SummaryCards from '../components/charts/SummaryCards';
import DailyVolumeChart from '../components/charts/DailyVolumeChart';
import MonthlyVolumeChart from '../components/charts/MonthlyVolumeChart';
import TransactionTable from '../components/charts/TransactionTable';

const API_BASE_URL = 'http://localhost:5000';
const jwt = localStorage.getItem("jwt");

const DashboardPage: React.FC = () => {
    const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [days, setDays] = useState<number>(0); // 0 = today, 1 = yesterday, etc.
    const [months, setMonths] = useState<number>(0); // 0 = this month, 1 = last month, etc.
    const [searchUser, setSearchUser] = useState<string>('');
    const [summaryData, setSummaryData] = useState<SummaryData>({
        totalToday: 0,
        totalRange: 0,
        customerFees: 0,
        transactionCount: 0,
    });
    const [dailyVolume, setDailyVolume] = useState<VolumeData[]>([]);
    const [monthlyVolume, setMonthlyVolume] = useState<VolumeData[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    const allTransactionTypes: string[] = [
        'WITHDRAWAL',
        'WALLET_TRANSFER',
        'ADD_MONEY',
        'BUY_ASSET',
        'SELL_ASSET',
        'INTRODUCTORY_GIFT',
    ];

    const validateJwt = useCallback(() => {
        if (!jwt) {
            setError('No authentication token found. Please log in.');
            return false;
        }
        try {
            return true;
        } catch (err) {
            console.error('Invalid JWT:', err);
            setError('Invalid authentication token. Please log in again.');
            localStorage.removeItem("jwt");
            return false;
        }
    }, []);

    // Compute days and date range for API queries
    const computeDateRange = useCallback(() => {
        let computedStartDate = '';
        let computedEndDate = '';
        let computedDays = days;

        if (startDate && endDate) {
            // Use custom date range
            computedStartDate = startDate;
            computedEndDate = endDate;
            // Compute equivalent days for APIs that require it
            computedDays = moment(endDate).diff(moment(startDate), 'days') + 1;
        } else if (days >= 0) {
            // Use days to compute a single-day range
            const targetDate = moment().subtract(days, 'days');
            computedStartDate = targetDate.format('YYYY-MM-DD');
            computedEndDate = computedStartDate;
            computedDays = 1;
        } else if (months >= 0) {
            // Use months to compute a full-month range
            const targetMonth = moment().subtract(months, 'months');
            computedStartDate = targetMonth.startOf('month').format('YYYY-MM-DD');
            computedEndDate = targetMonth.endOf('month').format('YYYY-MM-DD');
            computedDays = moment(computedEndDate).diff(moment(computedStartDate), 'days') + 1;
        }

        return { computedStartDate, computedEndDate, computedDays };
    }, [startDate, endDate, days, months]);

    const fetchSummary = useCallback(async () => {
        if (!validateJwt()) return;

        try {
            const { computedStartDate, computedEndDate, computedDays } = computeDateRange();

            // Total transaction (previously total today)
            const typeQuery = transactionTypes.length
                ? `transaction_type=${transactionTypes.join(',')}`
                : '';
            const daysQuery = computedDays >= 0 ? `days=${computedDays}` : '';
            const totalQuery = [typeQuery, daysQuery].filter(Boolean).join('&');
            const totalRes = await fetch(
                `${API_BASE_URL}/api/history/admin/total-amount-transaction${totalQuery ? `?${totalQuery}` : ''}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (totalRes.status === 403) {
                const errorData = await totalRes.json();
                console.error('403 Error Details (total):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!totalRes.ok) {
                throw new Error(`Failed to fetch total: ${totalRes.status}`);
            }
            const total: number = await totalRes.json();

            // Total range
            const rangeQueryParts = [];
            if (computedStartDate) rangeQueryParts.push(`startDate=${computedStartDate}`);
            if (computedEndDate) rangeQueryParts.push(`endDate=${computedEndDate}`);
            if (transactionTypes.length) rangeQueryParts.push(`transaction_type=${transactionTypes.join(',')}`);
            const rangeQuery = rangeQueryParts.length ? `?${rangeQueryParts.join('&')}` : '';
            const totalRangeRes = await fetch(
                `${API_BASE_URL}/api/history/admin/total-amount-transaction-by-range${rangeQuery}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (totalRangeRes.status === 403) {
                const errorData = await totalRangeRes.json();
                console.error('403 Error Details (totalRange):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!totalRangeRes.ok) {
                throw new Error(`Failed to fetch total range: ${totalRangeRes.status}`);
            }
            const totalRange: number = await totalRangeRes.json();

            // Customer fees
            const feesTypes = ['CUSTOMER_BUY_ASSET', 'CUSTOMER_SELL_ASSET'];
            const feesQuery = `?transaction_type=${feesTypes.join(',')}`;
            const feesRes = await fetch(
                `${API_BASE_URL}/api/history/admin/total-amount-transaction${feesQuery}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (feesRes.status === 403) {
                const errorData = await feesRes.json();
                console.error('403 Error Details (fees):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!feesRes.ok) {
                throw new Error(`Failed to fetch customer fees: ${feesRes.status}`);
            }
            const customerFees: number = await feesRes.json();

            // Transaction count
            const transactionsRes = await fetch(
                `${API_BASE_URL}/api/history/admin/transaction${typeQuery ? `?${typeQuery}` : ''}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (transactionsRes.status === 403) {
                const errorData = await transactionsRes.json();
                console.error('403 Error Details (transactions):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!transactionsRes.ok) {
                throw new Error(`Failed to fetch transactions: ${transactionsRes.status}`);
            }
            const transactionsData = await transactionsRes.json();
            if (!Array.isArray(transactionsData)) {
                console.error('Expected transactions array, got:', transactionsData);
                setSummaryData({
                    totalToday: total,
                    totalRange,
                    customerFees,
                    transactionCount: 0,
                });
                return;
            }

            const today = moment().format('YYYY-MM-DD');
            const count = transactionsData.filter((tx: Transaction) =>
                moment(tx.date).isSame(today, 'day')
            ).length;

            setSummaryData({
                totalToday: total,
                totalRange,
                customerFees,
                transactionCount: count,
            });
            setError(null);
        } catch (error) {
            console.error('Error fetching summary data:', error);
            setError('Failed to load summary data. Please try again.');
            setSummaryData({
                totalToday: 0,
                totalRange: 0,
                customerFees: 0,
                transactionCount: 0,
            });
        }
    }, [transactionTypes, validateJwt, computeDateRange]);

    const fetchDailyVolume = useCallback(async () => {
        if (!validateJwt()) return;

        try {
            const { computedStartDate, computedEndDate, computedDays } = computeDateRange();
            if (!computedStartDate || !computedEndDate) {
                setDailyVolume([]);
                return;
            }

            const typeQuery = transactionTypes.length
                ? `transaction_type=${transactionTypes.join(',')}`
                : '';
            const dateQuery = startDate && endDate
                ? `startDate=${computedStartDate}&endDate=${computedEndDate}`
                : `days=${computedDays}`;
            const query = [typeQuery, dateQuery].filter(Boolean).join('&');
            const res = await fetch(
                `${API_BASE_URL}/api/history/admin/total-volume/chart${query ? `?${query}` : ''}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (res.status === 403) {
                const errorData = await res.json();
                console.error('403 Error Details (dailyVolume):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!res.ok) {
                throw new Error(`Failed to fetch daily volume: ${res.status}`);
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error('Expected daily volume array, got:', data);
                setDailyVolume([]);
                return;
            }
            const formattedData: VolumeData[] = data.map(([timestamp, volume]: [number, number]) => ({
                date: moment(timestamp).format('MM-DD'),
                volume,
            }));
            setDailyVolume(formattedData);
            setError(null);
        } catch (error) {
            console.error('Error fetching daily volume:', error);
            setError('Failed to load daily volume chart. Please try again.');
            setDailyVolume([]);
        }
    }, [transactionTypes, validateJwt, computeDateRange, startDate, endDate]);

    const fetchMonthlyVolume = useCallback(async () => {
        if (!validateJwt()) return;

        try {
            const { computedStartDate, computedEndDate } = computeDateRange();
            if (!computedStartDate || !computedEndDate) {
                setMonthlyVolume([]);
                return;
            }

            const typeQuery = transactionTypes.length
                ? `transaction_type=${transactionTypes.join(',')}`
                : '';
            const monthsQuery = startDate && endDate ? '' : `months=${months}`;
            const dateQuery = startDate && endDate
                ? `startDate=${computedStartDate}&endDate=${computedEndDate}`
                : '';
            const query = [typeQuery, monthsQuery, dateQuery].filter(Boolean).join('&');
            const res = await fetch(
                `${API_BASE_URL}/api/history/admin/total-volume-by-month/chart${query ? `?${query}` : ''}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (res.status === 403) {
                const errorData = await res.json();
                console.error('403 Error Details (monthlyVolume):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!res.ok) {
                throw new Error(`Failed to fetch monthly volume: ${res.status}`);
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error('Expected monthly volume array, got:', data);
                setMonthlyVolume([]);
                return;
            }
            const formattedData: VolumeData[] = data.map(([timestamp, volume]: [number, number]) => ({
                month: moment(timestamp).format('MM/YYYY'),
                volume,
            }));
            setMonthlyVolume(formattedData);
            setError(null);
        } catch (error) {
            console.error('Error fetching monthly volume:', error);
            setError('Failed to load monthly volume chart. Please try again.');
            setMonthlyVolume([]);
        }
    }, [transactionTypes, validateJwt, computeDateRange, startDate, endDate, months]);

    const fetchTransactions = useCallback(async () => {
        if (!validateJwt()) return;

        try {
            const { computedStartDate, computedEndDate } = computeDateRange();
            const typeQuery = transactionTypes.length
                ? `?transaction_type=${transactionTypes.join(',')}`
                : '';
            const res = await fetch(
                `${API_BASE_URL}/api/history/admin/transaction${typeQuery}`,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );
            if (res.status === 403) {
                const errorData = await res.json();
                console.error('403 Error Details (transactions):', errorData);
                setError('Access forbidden: Invalid or expired token.');
                return;
            }
            if (!res.ok) {
                throw new Error(`Failed to fetch transactions: ${res.status}`);
            }
            const data = await res.json();
            if (!Array.isArray(data)) {
                console.error('Expected transactions array, got:', data);
                setTransactions([]);
                return;
            }
            const filtered = data.filter(
                (tx: Transaction) =>
                    (!computedStartDate ||
                        !computedEndDate ||
                        moment(tx.date).isBetween(computedStartDate, computedEndDate, undefined, '[]')) &&
                    (!searchUser ||
                        String(tx.wallet.userId).toLowerCase().includes(searchUser.toLowerCase()))
            );
            setTransactions(filtered);
            setError(null);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('Failed to load transactions. Please try again.');
            setTransactions([]);
        }
    }, [transactionTypes, searchUser, validateJwt, computeDateRange]);

    useEffect(() => {
        if (!validateJwt()) return;

        const fetchData = async () => {
            await Promise.all([
                fetchSummary(),
                fetchDailyVolume(),
                fetchMonthlyVolume(),
                fetchTransactions(),
            ]);
        };

        fetchData();
    }, [fetchSummary, fetchDailyVolume, fetchMonthlyVolume, fetchTransactions, validateJwt]);

    return (
        <div className="dashboard-container">
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}
            <Filters
                transactionTypes={transactionTypes}
                setTransactionTypes={setTransactionTypes}
                allTransactionTypes={allTransactionTypes}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                days={days}
                setDays={setDays}
                months={months}
                setMonths={setMonths}
                searchUser={searchUser}
                setSearchUser={setSearchUser}
            />
            <Row gutter={[16, 16]} className="summary-row">
                <SummaryCards data={summaryData} />
            </Row>
            <DailyVolumeChart data={dailyVolume} transactionTypes={transactionTypes} />
            <MonthlyVolumeChart data={monthlyVolume} transactionTypes={transactionTypes} />
            <TransactionTable data={transactions} />
        </div>
    );
};

export default DashboardPage;