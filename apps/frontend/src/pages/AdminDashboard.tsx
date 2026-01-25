import React from 'react';
import { AdminLayout } from '../layouts/AdminLayout';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Manage licenses and submissions here.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
