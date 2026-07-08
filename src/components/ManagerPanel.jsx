import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  ShieldCheck,
  Users,
  ClipboardList,
  BarChart3,
  Database,
  Trash2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Square,
  FileText,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  aggregateIncidentsByLga,
  createAdmin,
  deleteAdmin,
  extractLgaFromIncident,
  fetchAdmins,
  updateAdminProfile,
  ZAMFARA_LGAS
} from '../utils.js';

Chart.register(...registerables);

const MANAGER_STATUS_OPTIONS = ['Pending', 'Verified', 'Dispatched', 'Resolved'];

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || 'N/A';
  }
};

const getLgaLabel = (incident) => {
  const lga = extractLgaFromIncident(incident);
  return lga === 'Unknown LGA' ? lga : `${lga}`;
};

const buildChartData = (incidents) => {
  const counts = aggregateIncidentsByLga(incidents);
  const labels = [...ZAMFARA_LGAS, 'Unknown LGA'];
  const values = labels.map((lga) => counts[lga] || 0);
  return { labels, values };
};

const ManagerPanel = ({ incidents, onUpdateStatus, currentUser, onAuthUpdated, onLogout, addToast }) => {
  const { language } = useLanguage();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [adminView, setAdminView] = useState('list');
  const [adminList, setAdminList] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', agencyId: '', password: '', role: 'dispatcher' });
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileSending, setProfileSending] = useState(false);
  const [profileUpdates, setProfileUpdates] = useState({ email: currentUser?.email || '', password: '' });
  const [statusFilter, setStatusFilter] = useState('All');

  const incidentSummary = useMemo(() => ({
    total: incidents.length,
    pending: incidents.filter((inc) => inc.status === 'Pending').length,
    verified: incidents.filter((inc) => inc.status === 'Verified').length,
    dispatched: incidents.filter((inc) => inc.status === 'Dispatched').length,
    resolved: incidents.filter((inc) => inc.status === 'Resolved').length,
    highThreat: incidents.filter((inc) => inc.threatPriority === 'High').length,
    unknownLga: incidents.filter((inc) => extractLgaFromIncident(inc) === 'Unknown LGA').length
  }), [incidents]);

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'All') return incidents;
    return incidents.filter((inc) => inc.status === statusFilter);
  }, [incidents, statusFilter]);

  const chartData = useMemo(() => buildChartData(incidents), [incidents]);

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetchAdmins(currentUser?.token);
        setAdminList(response.admins || []);
      } catch (err) {
        console.warn('Failed to load admin list from backend, falling back to local cache.', err);
        setAdminList([]);
      }
    };

    if (currentUser?.token) {
      loadAdmins();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const data = {
      labels: chartData.labels,
      datasets: [
        {
          label: language === 'en' ? 'Incidents by LGA' : 'Rahotanni ta LGA',
          data: chartData.values,
          backgroundColor: 'rgba(183, 28, 28, 0.65)',
          borderColor: 'rgba(183, 28, 28, 1)',
          borderWidth: 2,
          borderRadius: 8,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };

    if (chartInstanceRef.current) {
      chartInstanceRef.current.data = data;
      chartInstanceRef.current.update();
      return;
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} ${language === 'en' ? 'incidents' : 'rahotanni'}`
            }
          }
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              color: '#1f2937',
              font: { size: 10 }
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: '#374151',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.18)'
            }
          }
        }
      }
    });

    return () => {
      chartInstanceRef.current?.destroy();
      chartInstanceRef.current = null;
    };
  }, [chartData, language]);

  const refreshAdminList = async () => {
    try {
      const response = await fetchAdmins(currentUser?.token);
      setAdminList(response.admins || []);
    } catch (err) {
      console.warn('Failed to refresh admin list from backend.', err);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!newAdmin.name || !newAdmin.email || !newAdmin.agencyId || !newAdmin.password) {
      setAdminError(language === 'en' ? 'Complete all fields to create an admin.' : 'Cika dukkan filaye don Æ™irÆ™irar mai gudanarwa.');
      return;
    }

    try {
      await createAdmin(newAdmin, currentUser?.token);
      await refreshAdminList();
      setAdminSuccess(language === 'en' ? 'Administrator created successfully.' : 'An Æ™irÆ™iri mai gudanarwa cikin nasara.');
      setNewAdmin({ name: '', email: '', agencyId: '', password: '', role: 'dispatcher' });
    } catch (err) {
      setAdminError(err.message || (language === 'en' ? 'Failed to create administrator.' : 'An kasa Æ™irÆ™irar mai gudanarwa.'));
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    try {
      await deleteAdmin(adminId, currentUser?.token);
      await refreshAdminList();
      addToast(language === 'en' ? 'Admin removed from registry.' : 'An cire mai gudanarwa daga rajista.', 'success');
    } catch (err) {
      addToast(err.message || (language === 'en' ? 'Unable to remove administrator.' : 'Ba za a iya cire mai gudanarwa ba.'), 'error');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileUpdates.email && !profileUpdates.password) {
      setProfileError(language === 'en' ? 'Enter a new email or password to save.' : 'Shigar da sabon imel ko kalmar sirri don adanawa.');
      return;
    }

    setProfileSending(true);
    try {
      const response = await updateAdminProfile({
        token: currentUser?.token,
        email: profileUpdates.email,
        password: profileUpdates.password || undefined,
      });

      setProfileSuccess(language === 'en' ? 'Profile updated successfully.' : 'An sabunta bayanan profile cikin nasara.');
      setProfileUpdates((prev) => ({ ...prev, password: '' }));
      if (response?.admin) {
        onAuthUpdated?.(response.admin);
      }
    } catch (err) {
      setProfileError(err.message || (language === 'en' ? 'Unable to update profile.' : 'Ba za a iya sabunta bayanai ba.'));
    } finally {
      setProfileSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-6 sm:p-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#B71C1C] font-black">
              {language === 'en' ? 'Manager Control Panel' : 'Babban Dakin Gudanarwa'}
            </p>
            <h1 className="text-3xl font-black text-slate-900 mt-2">
              {language === 'en' ? 'Zamfara Incident Command' : 'Babban Ofishin Kula da Rahotannin Zamfara'}
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              {language === 'en'
                ? 'Review incident performance, manage administrative access, and monitor local government safety trends with live analytics.'
                : 'Duba rahotannin alâ€™amura, sarrafa masarrafan gudanarwa, da sa ido kan yanayin tsaro a matakin LGA.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'en' ? 'Logout' : 'Fita'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em]">{language === 'en' ? 'Total Reports' : 'Jimillar Rahotanni'}</span>
                  <Square className="h-5 w-5 text-[#B71C1C]" />
                </div>
                <div className="text-4xl font-black text-slate-900">{incidentSummary.total}</div>
                <p className="mt-2 text-xs text-slate-500">{language === 'en' ? 'All collected incidents' : 'Dukkan rahotanni da aka tattara'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em]">{language === 'en' ? 'High Priority' : 'Mafi Muhimmanci'}</span>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-4xl font-black text-slate-900">{incidentSummary.highThreat}</div>
                <p className="mt-2 text-xs text-slate-500">{language === 'en' ? 'Clustered or critical alerts' : 'Rundunan rashin lafiya ko gaggawa'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em]">{language === 'en' ? 'Pending Review' : 'Ana Jira Bincike'}</span>
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-4xl font-black text-slate-900">{incidentSummary.pending}</div>
                <p className="mt-2 text-xs text-slate-500">{language === 'en' ? 'Awaiting dispatcher action' : 'Ana jiran mataki daga jamiâ€™i'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.3em]">{language === 'en' ? 'Resolved Cases' : 'An Warware'}</span>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-4xl font-black text-slate-900">{incidentSummary.resolved}</div>
                <p className="mt-2 text-xs text-slate-500">{language === 'en' ? 'Confirmed emergency closures' : 'An tabbatar an rufe rahotanni'}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{language === 'en' ? 'Incident Distribution' : 'Rarrabuwar Rahotanni'}</p>
                  <h2 className="text-xl font-black text-slate-900 mt-2">{language === 'en' ? 'Top LGAs in Zamfara' : 'Babban LGAs a Zamfara'}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-700">
                  <BarChart3 className="h-4 w-4" />
                  {language === 'en' ? 'LGA Chart' : 'Jadawalin LGA'}
                </div>
              </div>
              <div className="h-[340px]">
                <canvas ref={chartRef} aria-label="Incident distribution by local government area" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{language === 'en' ? 'Incident Command Table' : 'Tejin Rahotannin'}</p>
                <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-slate-700">
                  <FileText className="h-4 w-4" />
                  {language === 'en' ? 'Manage status' : 'Sarrafa matsayi'}
                </div>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm text-slate-600">
                  {language === 'en'
                    ? `Showing ${filteredIncidents.length} of ${incidentSummary.total} incident reports.`
                    : `Ana nuna ${filteredIncidents.length} daga ${incidentSummary.total} rahotanni.`}
                </div>
                <select
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">{language === 'en' ? 'All Statuses' : 'Dukkan Matsayi'}</option>
                  {MANAGER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm text-left">
                  <thead className="bg-slate-100 text-slate-500 uppercase tracking-[0.25em] text-[10px]">
                    <tr>
                      <th className="px-4 py-3">{language === 'en' ? 'Time' : 'Lokaci'}</th>
                      <th className="px-4 py-3">{language === 'en' ? 'Category' : 'Nauâ€™i'}</th>
                      <th className="px-4 py-3">{language === 'en' ? 'LGA' : 'LGA'}</th>
                      <th className="px-4 py-3">{language === 'en' ? 'Status' : 'Matsayi'}</th>
                      <th className="px-4 py-3">{language === 'en' ? 'Action' : 'Aiki'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((incident) => (
                      <tr key={incident._id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 align-top text-xs text-slate-600">{formatDateTime(incident.createdAt)}</td>
                        <td className="px-4 py-3 align-top font-semibold text-slate-900">{incident.category}</td>
                        <td className="px-4 py-3 align-top text-slate-700">{getLgaLabel(incident)}</td>
                        <td className="px-4 py-3 align-top">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ${incident.status === 'Pending' ? 'bg-red-100 text-red-700' : incident.status === 'Verified' ? 'bg-amber-100 text-amber-800' : incident.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {incident.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <select
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                            value={incident.status}
                            onChange={(e) => onUpdateStatus(incident._id, e.target.value)}
                          >
                            {MANAGER_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                    {filteredIncidents.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                          {language === 'en' ? 'No incidents found for the selected status.' : 'Babu rahotanni don matsayin da aka zaÉ“a.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{language === 'en' ? 'Manager Profile' : 'Bayanan Manaja'}</p>
                  <h2 className="text-xl font-black text-slate-900 mt-2">{language === 'en' ? 'Update Account' : 'Sabunta Asusun'}</h2>
                </div>
                <ShieldAlert className="h-5 w-5 text-[#B71C1C]" />
              </div>

              {profileError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700">{profileError}</div>
              )}
              {profileSuccess && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{profileSuccess}</div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{language === 'en' ? 'Email address' : 'Adireshin imel'}</label>
                <input
                  type="email"
                  value={profileUpdates.email}
                  onChange={(e) => setProfileUpdates({ ...profileUpdates, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />

                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{language === 'en' ? 'New password' : 'Sabuwar kalmar sirri'}</label>
                <input
                  type="password"
                  value={profileUpdates.password}
                  onChange={(e) => setProfileUpdates({ ...profileUpdates, password: e.target.value })}
                  placeholder={language === 'en' ? 'Leave blank to keep current password' : 'Bar shi babu don ci gaba da kalmar sirri'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />

                <button
                  type="submit"
                  disabled={profileSending}
                  className="w-full rounded-2xl bg-[#B71C1C] px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white hover:bg-red-800 transition disabled:opacity-60"
                >
                  {language === 'en' ? 'Save profile' : 'Ajiye bayanai'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{language === 'en' ? 'Admin Registry' : 'Rajistar Masu Gudanarwa'}</p>
                  <h2 className="text-xl font-black text-slate-900 mt-2">{language === 'en' ? 'Manage Access' : 'Sarrafa Izini'}</h2>
                </div>
                <Users className="h-5 w-5 text-[#B71C1C]" />
              </div>

              <div className="space-y-4">
                {adminList.map((admin) => (
                  <div key={admin._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{admin.name}</p>
                      <p className="text-[11px] text-slate-500">{admin.email}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mt-1">{admin.agencyId} • {admin.role}</p>
                    </div>
                    <button
                      type="button"
                      disabled={admin.email === 'admin@guardian.gov.ng' || admin.email === 'manager@guardian.gov.ng'}
                      onClick={() => handleDeleteAdmin(admin._id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                      {language === 'en' ? 'Remove' : 'Cire'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{language === 'en' ? 'Invite New Admin' : 'Ƙara Sabon Mai Gudanarwa'}</p>
                  <h2 className="text-lg font-black text-slate-900 mt-2">{language === 'en' ? 'Create Account' : 'Ƙirƙiri Asusu'}</h2>
                </div>
                <Plus className="h-5 w-5 text-emerald-500" />
              </div>

              {adminError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700">{adminError}</div>
              )}
              {adminSuccess && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{adminSuccess}</div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder={language === 'en' ? 'Full name' : 'Cikakken suna'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder={language === 'en' ? 'Email address' : 'Adireshin imel'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />
                <input
                  type="text"
                  value={newAdmin.agencyId}
                  onChange={(e) => setNewAdmin({ ...newAdmin, agencyId: e.target.value })}
                  placeholder={language === 'en' ? 'Agency ID' : 'Lambar Hukuma'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder={language === 'en' ? 'Password' : 'Kalmar sirri'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                />

                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]"
                >
                  <option value="dispatcher">{language === 'en' ? 'Dispatcher' : 'Mai Umurni'}</option>
                  <option value="manager">{language === 'en' ? 'Manager' : 'Manaja'}</option>
                </select>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#B71C1C] px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white hover:bg-red-800 transition"
                >
                  {language === 'en' ? 'Create administrator' : 'Ƙirƙiri mai gudanarwa'}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ManagerPanel;

