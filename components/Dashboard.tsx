
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import ServiceAdvisorDashboard from './dashboards/ServiceAdvisorDashboard';
import ForemanDashboard from './dashboards/ForemanDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import CustomerCareDashboard from './dashboards/CustomerCareDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Vui lòng đăng nhập.</div>;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case Role.Manager:
        return <ManagerDashboard />;
      case Role.ServiceAdvisor:
        return <ServiceAdvisorDashboard />;
      case Role.ForemanSC:
      case Role.ForemanDS:
        return <ForemanDashboard />;
      case Role.CustomerCare:
        return <CustomerCareDashboard />;
      default:
        return <div className="text-center p-8 bg-white rounded-lg shadow">Không có dashboard cho vai trò này.</div>;
    }
  };

  return <div className="container mx-auto">{renderDashboard()}</div>;
};

export default Dashboard;