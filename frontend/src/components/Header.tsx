import { Bell, LogOut, User, X } from 'lucide-react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { notificationsApi, type BackendNotification } from '../services/api';

interface UiNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

export default function Header() {
  const { logout, role, user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationsApi.list();
      const rows = (response.data ?? []).map((item: BackendNotification) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        time: formatRelativeTime(item.created_at),
        unread: !item.is_read,
      }));
      setNotifications(rows);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      // Keep optimistic UI to avoid noisy failures in the dropdown.
    }
  };

  const profileData = {
    name: user?.name ?? 'User',
    email: user?.email ?? '',
    phone: 'Not provided',
    role: role?.toUpperCase() || 'USER',
    department: role === 'hod' || role === 'teacher' ? 'Assigned Department' : 'Administration',
    joinDate: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
    photo: user?.profile_photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 h-16 fixed top-0 right-0 left-64 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div>
            <h2 className="text-slate-800">
              {role === 'admin' && 'Administrator Dashboard'}
              {role === 'principal' && 'Principal Dashboard'}
              {role === 'hod' && 'HOD Dashboard'}
              {role === 'teacher' && 'Teacher Dashboard'}
            </h2>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-slate-100 rounded-lg transition"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>

            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <img
                src={profileData.photo}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-slate-200"
              />
            </button>

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-16 right-6 bg-white shadow-2xl border border-slate-200 rounded-xl w-96 z-30">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-slate-800">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-6 text-center text-slate-500">Loading notifications...</div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => markNotificationRead(notification.id)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                      notification.unread ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-2 rounded-full ${notification.unread ? 'bg-blue-600' : 'bg-slate-300'}`} />
                      <div className="flex-1">
                        <p className="text-slate-800">{notification.title}</p>
                        <p className="text-slate-600 text-sm mt-1">{notification.message}</p>
                        <p className="text-slate-500 text-xs mt-2">{notification.time}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500">No notifications</div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => {
                  setShowNotifications(false);
                  loadNotifications();
                }}
                className="text-blue-600 hover:text-blue-700 text-sm w-full text-center"
              >
                Refresh Notifications
              </button>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowProfile(false)}
          />
          <div className="fixed top-16 right-6 bg-white shadow-2xl border border-slate-200 rounded-xl w-96 z-30">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-slate-800">Profile</h3>
              <button
                onClick={() => setShowProfile(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={profileData.photo}
                  alt="Profile"
                  className="w-16 h-16 rounded-full border-2 border-slate-200"
                />
                <div>
                  <p className="text-slate-800">{profileData.name}</p>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {profileData.role}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-600 text-sm">Email</p>
                  <p className="text-slate-800">{profileData.email}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Phone</p>
                  <p className="text-slate-800">{profileData.phone}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Department</p>
                  <p className="text-slate-800">{profileData.department}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Member Since</p>
                  <p className="text-slate-800">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200">
              <button 
                onClick={() => {
                  setShowProfile(false);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm w-full text-center"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
