import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { adminService } from '../../../services/adminService';
import { formatPrice } from '../../../utils/formatPrice';

export default function Reports() {
  const [reportType, setReportType] = useState('sales'); // sales, products, vendors
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getReportsData({
        type: reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res?.success) {
        setData(res.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  // Export CSV
  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No data rows available to export.');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header] === null || row[header] === undefined ? '' : String(row[header]);
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `appsica_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Enterprise Reports & CSV Analytics Data
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Export platform sales audits, order fulfillment velocity, vendor payouts, and product inventory reports.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={handleExportCSV}
          disabled={data.length === 0}
        >
          <Download size={16} /> Export CSV File ({data.length} records)
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px', color: '#f87171', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* FILTER & DATE CONTROLS */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Report Type Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'sales', label: 'Sales & Orders Ledger' },
              { id: 'products', label: 'Products & Inventory' },
              { id: 'vendors', label: 'Vendor Settlements' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                style={{
                  background: reportType === tab.id ? '#6366f1' : 'rgba(255,255,255,0.04)',
                  color: reportType === tab.id ? '#fff' : '#cbd5e1',
                  border: '1px solid ' + (reportType === tab.id ? '#6366f1' : 'var(--ap-border)'),
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Range Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              <Calendar size={15} />
              <span>From:</span>
              <input
                type="date"
                className="admin-form-input"
                style={{ width: '140px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#94a3b8' }}>
              <span>To:</span>
              <input
                type="date"
                className="admin-form-input"
                style={{ width: '140px', padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={loadReport}>
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>
      </div>

      {/* REPORT PREVIEW TABLE */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <FileSpreadsheet size={18} /> Live Report Preview ({data.length} rows)
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Ready for CSV data extraction</span>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="admin-loading-spinner" />
            </div>
          ) : data.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '3rem' }}>
              No records found for the selected timeframe.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} style={{ textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 50).map((row, idx) => (
                  <tr key={idx}>
                    {Object.keys(data[0]).map((key) => (
                      <td key={key} style={{ whiteSpace: 'nowrap' }}>
                        {typeof row[key] === 'number' && (key.includes('total') || key.includes('Sales') || key.includes('price') || key.includes('commission') || key.includes('subtotal') || key.includes('Fee') || key.includes('Earnings'))
                          ? formatPrice(row[key])
                          : String(row[key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
