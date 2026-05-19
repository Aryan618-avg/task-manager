import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/my-tasks'),
        ]);
        setProjects(projRes.data);
        setMyTasks(taskRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const { data } = await api.post('/projects', { name: newProjectName });
      setProjects([data, ...projects]);
      setNewProjectName('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create project');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const overdue = myTasks.filter(t => t.overdue);
  const inProgress = myTasks.filter(t => t.status === 'in_progress');
  const done = myTasks.filter(t => t.status === 'done');

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold text-blue-600">TaskManager</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, {user?.name}</span>
          <button onClick={logout}
            className="text-sm text-red-500 hover:underline">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500 mb-1">Total tasks</p>
            <p className="text-3xl font-bold text-gray-800">{myTasks.length}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-5 shadow-sm border border-orange-100">
            <p className="text-sm text-orange-500 mb-1">Overdue</p>
            <p className="text-3xl font-bold text-orange-600">{overdue.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-5 shadow-sm border border-green-100">
            <p className="text-sm text-green-500 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{done.length}</p>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">My Projects</h2>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
            />
            <button onClick={createProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              + Create
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No projects yet. Create one above!</p>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition">
                  <div>
                    <p className="font-medium text-gray-800">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    p.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-800 mb-4">My Tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No tasks assigned to you yet.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map(t => (
                <div key={t.id}
                  className={`flex justify-between items-center p-4 border rounded-lg ${
                    t.overdue ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'
                  }`}>
                  <div>
                    <p className="font-medium text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.overdue && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Overdue</span>
                    )}
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      t.status === 'done' ? 'bg-green-100 text-green-700' :
                      t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}