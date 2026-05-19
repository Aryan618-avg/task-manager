import { useEffect, useState } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('member');
  const user = JSON.parse(localStorage.getItem('user'));

  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', due_date: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [projRes, taskRes, memberRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks/project/${id}`),
          api.get(`/projects/${id}/members`),
        ]);
        setProject(projRes.data);
        setMyRole(projRes.data.role);
        setTasks(taskRes.data);
        setMembers(memberRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const createTask = async () => {
    if (!newTask.title.trim()) return alert('Task title is required');
    try {
      const { data } = await api.post(`/tasks/project/${id}`, newTask);
      setTasks([data, ...tasks]);
      setNewTask({ title: '', description: '', assigned_to: '', due_date: '' });
      setShowAddTask(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: data.status } : t));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const addMember = async () => {
    if (!memberEmail.trim()) return;
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      const res = await api.get(`/projects/${id}/members`);
      setMembers(res.data);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'overdue') return t.overdue;
    return t.status === filter;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </button>
          <h1 className="text-lg font-bold text-gray-800">{project?.name}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${
            myRole === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
          }`}>{myRole}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6">

          {/* Tasks Section - left 2/3 */}
          <div className="col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">Tasks</h2>
              {myRole === 'admin' && (
                <button onClick={() => setShowAddTask(!showAddTask)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  + Add Task
                </button>
              )}
            </div>

            {/* Add Task Form */}
            {showAddTask && (
              <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
                <p className="font-medium text-sm text-gray-700 mb-3">New Task</p>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title *"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                >
                  <option value="">Assign to (optional)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
                <div className="flex gap-2">
                  <button onClick={createTask}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Create Task
                  </button>
                  <button onClick={() => setShowAddTask(false)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
              {['all', 'todo', 'in_progress', 'done', 'overdue'].map(f => (
                <button key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Task List */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
                No tasks found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(t => (
                  <div key={t.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm ${
                      t.overdue ? 'border-red-200' : ''
                    }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-800">{t.title}</p>
                          {t.overdue && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>
                          )}
                        </div>
                        {t.description && (
                          <p className="text-xs text-gray-500 mb-2">{t.description}</p>
                        )}
                        <div className="flex gap-3 text-xs text-gray-400">
                          {t.assignee_name && <span>👤 {t.assignee_name}</span>}
                          {t.due_date && <span>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        className={`text-xs border rounded-lg px-2 py-1 ml-3 focus:outline-none ${
                          t.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                          t.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members Section - right 1/3 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">Members</h2>
              {myRole === 'admin' && (
                <button onClick={() => setShowAddMember(!showAddMember)}
                  className="text-blue-600 text-sm hover:underline">
                  + Add
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="bg-white border rounded-xl p-3 mb-3 shadow-sm">
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Member email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <button onClick={addMember}
                  className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  Add Member
                </button>
              </div>
            )}

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}