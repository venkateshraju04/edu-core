import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  GraduationCap, 
  Calendar, 
  Settings,
  BookOpen,
  ClipboardList,
  UserCheck,
  BarChart3
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

export default function Sidebar() {
  const { role } = useAuth();

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: `/${role}`,
      icon: <LayoutDashboard className="w-5 h-5" />,
      roles: ['admin', 'principal', 'teacher', 'hod']
    },
    {
      name: 'Fees',
      path: '/admin/fees',
      icon: <DollarSign className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      name: 'Students',
      path: '/admin/students',
      icon: <Users className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      name: 'Teachers',
      path: '/admin/teachers',
      icon: <GraduationCap className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      name: 'Admissions',
      path: '/admin/admissions',
      icon: <UserCheck className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      name: 'Timetable',
      path: '/admin/timetable',
      icon: <Calendar className="w-5 h-5" />,
      roles: ['admin']
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['admin']
    },
    // Principal menu items
    {
      name: 'Departments',
      path: '/principal/departments',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['principal']
    },
    {
      name: 'Teacher Reviews',
      path: '/principal/teachers',
      icon: <GraduationCap className="w-5 h-5" />,
      roles: ['principal']
    },
    {
      name: 'Student Reports',
      path: '/principal/students',
      icon: <Users className="w-5 h-5" />,
      roles: ['principal']
    },
    // HOD menu items
    {
      name: 'Teacher Assignment',
      path: '/hod/teachers',
      icon: <GraduationCap className="w-5 h-5" />,
      roles: ['hod']
    },
    {
      name: 'Lesson Plans',
      path: '/hod/lessons',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['hod']
    },
    {
      name: 'Student Reports',
      path: '/hod/students',
      icon: <Users className="w-5 h-5" />,
      roles: ['hod']
    },
    // Teacher menu items
    {
      name: 'My Classes',
      path: '/teacher/classes',
      icon: <BookOpen className="w-5 h-5" />,
      roles: ['teacher']
    },
    {
      name: 'Student Marking',
      path: '/teacher/marking',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['teacher']
    },
    {
      name: 'Lesson Plans',
      path: '/teacher/lessons',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ['teacher']
    }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <aside className="w-64 bg-slate-800 min-h-screen fixed left-0 top-0 text-white">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-white">EduCore</h2>
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              {role}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}