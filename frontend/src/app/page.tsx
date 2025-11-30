'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState([
    {
      title: 'Total Suppliers',
      value: '...',
      icon: '🏢',
      color: 'from-blue-500 to-blue-600',
      href: '/suppliers',
    },
    {
      title: 'Products',
      value: '...',
      icon: '📦',
      color: 'from-purple-500 to-purple-600',
      href: '/products',
    },
    {
      title: 'Purchase Orders',
      value: '...',
      icon: '📝',
      color: 'from-cyan-500 to-cyan-600',
      href: '/purchase-orders',
    },
    {
      title: 'QC Reports',
      value: '...',
      icon: '✅',
      color: 'from-green-500 to-green-600',
      href: '/qc-reports',
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [suppliers, products, pos, qc] = await Promise.all([
          apiClient.getSuppliers(),
          apiClient.getProducts(),
          apiClient.getPurchaseOrders(),
          apiClient.getQCReports(),
        ]);

        setStats([
          {
            title: 'Total Suppliers',
            value: suppliers.length.toString(),
            icon: '🏢',
            color: 'from-blue-500 to-blue-600',
            href: '/suppliers',
          },
          {
            title: 'Products',
            value: products.length.toString(),
            icon: '📦',
            color: 'from-purple-500 to-purple-600',
            href: '/products',
          },
          {
            title: 'Purchase Orders',
            value: pos.length.toString(),
            icon: '📝',
            color: 'from-cyan-500 to-cyan-600',
            href: '/purchase-orders',
          },
          {
            title: 'QC Reports',
            value: qc.length.toString(),
            icon: '✅',
            color: 'from-green-500 to-green-600',
            href: '/qc-reports',
          },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);


  const quickActions = [
    { name: 'Create Local PO', href: '/purchase-orders/create/local', icon: '➕', color: 'btn-primary' },
    { name: 'Create Import PO', href: '/purchase-orders/create/import', icon: '🌍', color: 'btn-secondary' },
    { name: 'Add Supplier', href: '/suppliers/create', icon: '🏢', color: 'btn-success' },
    { name: 'Add Product', href: '/products/create', icon: '📦', color: 'btn-primary' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600">Welcome to the Pharma Factory Management System</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <div className="card cursor-pointer group">
              <div className="flex items-center justify-between mb-4">
                <div className={`text-4xl p-3 rounded-lg bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                {stat.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <button className={`btn ${action.color} w-full justify-center`}>
                <span className="text-lg">{action.icon}</span>
                {action.name}
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Procurement Flow */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Procurement Flow</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold">Create Purchase Request</h3>
              <p className="text-sm text-gray-600">Request items from suppliers (Local or Import)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold">QC Inspection</h3>
              <p className="text-sm text-gray-600">Quality control team inspects and accepts/rejects items</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-cyan-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold">Generate Receipts</h3>
              <p className="text-sm text-gray-600">Admin generates receipts for accepted and rejected items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

