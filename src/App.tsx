import React from 'react';
import DashboardPage from './screens/dashboard.page';
import './App.scss';
const App: React.FC = () => {
    return (
        <div className="app-container">
            <DashboardPage />
        </div>
    );
};

export default App;