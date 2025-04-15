import React from 'react';
import { Checkbox, DatePicker, Input, Space, Select } from 'antd';
import moment, { Moment } from 'moment';

const { Option } = Select;

interface FiltersProps {
    transactionTypes: string[];
    setTransactionTypes: (types: string[]) => void;
    allTransactionTypes: string[];
    startDate: string;
    endDate: string;
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    days: number;
    setDays: (days: number) => void;
    months: number;
    setMonths: (months: number) => void;
    searchUser: string;
    setSearchUser: (user: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
    transactionTypes,
    setTransactionTypes,
    allTransactionTypes,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    days,
    setDays,
    months,
    setMonths,
    searchUser,
    setSearchUser,
}) => {
    const handleDateRangeChange = (
        dates: [Moment | null, Moment | null] | null,
        dateStrings: [string, string]
    ) => {
        if (dates) {
            setStartDate(dateStrings[0]);
            setEndDate(dateStrings[1]);
        } else {
            setStartDate('');
            setEndDate('');
        }
    };

    return (
        <div className="filters">
            <Space direction="vertical" size="middle">
                <div>
                    <h4>Loại giao dịch</h4>
                    <Checkbox.Group
                        options={allTransactionTypes}
                        value={transactionTypes}
                        onChange={(values: string[]) => setTransactionTypes(values)}
                    />
                </div>
                <div>
                    <h4>Khoảng thời gian</h4>
                    <DatePicker.RangePicker
                        value={[
                            startDate ? moment(startDate) : null,
                            endDate ? moment(endDate) : null,
                        ]}
                        onChange={handleDateRangeChange}
                        format="YYYY-MM-DD"
                        allowClear
                    />
                </div>
                <div>
                    <h4>Ngày giao dịch</h4>
                    <Select
                        value={days}
                        onChange={setDays}
                        style={{ width: 150 }}
                    >
                        <Option value={0}>Hôm nay</Option>
                        <Option value={1}>Hôm qua</Option>
                        <Option value={2}>2 ngày trước</Option>
                        <Option value={3}>3 ngày trước</Option>
                        <Option value={7}>7 ngày trước</Option>
                        <Option value={14}>14 ngày trước</Option>
                    </Select>
                </div>
                <div>
                    <h4>Tháng giao dịch</h4>
                    <Select
                        value={months}
                        onChange={setMonths}
                        style={{ width: 150 }}
                    >
                        <Option value={0}>Tháng này</Option>
                        <Option value={1}>Tháng trước</Option>
                        <Option value={2}>2 tháng trước</Option>
                        <Option value={3}>3 tháng trước</Option>
                        <Option value={6}>6 tháng trước</Option>
                    </Select>
                </div>
                <div>
                    <h4>Tìm kiếm người dùng</h4>
                    <Input
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                        placeholder="Tìm theo ID người dùng"
                        style={{ width: 200 }}
                    />
                </div>
            </Space>
        </div>
    );
};

export default Filters;