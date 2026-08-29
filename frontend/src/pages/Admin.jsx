import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../services/endpoints';
import Card from '../components/Card';
import { Loader } from '../components/Loader';

const COLORS = ['#6c5ce7', '#e6533c', '#f5a623', '#0f9d8c', '#2f80ed', '#d8890a', '#27ae60', '#9b51e0'];

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [complaintTrends, setComplaintTrends] = useState(null);
  const [eventStats, setEventStats] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);

  useEffect(() => {
    adminApi.overview().then((r) => setOverview(r.data.data));
    adminApi.userGrowth().then((r) => setUserGrowth(r.data.data));
    adminApi.complaintTrends().then((r) => setComplaintTrends(r.data.data));
    adminApi.eventStats().then((r) => setEventStats(r.data.data));
    adminApi.popularCategories().then((r) => setPopularCategories(r.data.data));
  }, []);

  if (!overview) return <Loader label="Loading analytics…" />;

  const STAT_CARDS = [
    { label: 'Total Students', value: overview.totalStudents },
    { label: 'Total Faculty', value: overview.totalFaculty },
    { label: 'Total Clubs', value: overview.totalClubs },
    { label: 'Total Events', value: overview.totalEvents },
    { label: 'Total Complaints', value: overview.totalComplaints },
    { label: 'Resolved Complaints', value: overview.resolvedComplaints },
    { label: 'Marketplace Listings', value: overview.marketplaceListings },
    { label: 'Active Users', value: overview.activeUsers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Platform-wide analytics and moderation.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_CARDS.map((s) => (
          <Card key={s.label}>
            <p className="font-mono-data text-2xl font-semibold text-[var(--color-navy)]">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold">User Growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8f0" />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1b2340" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold">Complaint Trends by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={complaintTrends?.byCategory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8f0" />
              <XAxis dataKey="_id" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#e6533c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="#0f9d8c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold">Event Registrations by Category</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={eventStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6e8f0" />
              <XAxis dataKey="_id" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="totalRegistrations" fill="#f5a623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-sm font-semibold">Popular Post Categories</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={popularCategories} dataKey="postCount" nameKey="_id" outerRadius={80} label>
                {popularCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
