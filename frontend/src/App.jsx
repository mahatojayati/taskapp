import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${response.status})`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function loadTasks() {
    try {
      setError('');
      setTasks(await request('/api/tasks'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []);

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const task = await request('/api/tasks', {
        method: 'POST', body: JSON.stringify({ title: title.trim() })
      });
      setTasks(current => [task, ...current]);
      setTitle('');
      setError('');
    } catch (err) { setError(err.message); }
  }

  async function toggleTask(task) {
    try {
      const updated = await request(`/api/tasks/${task.id}`, {
        method: 'PATCH', body: JSON.stringify({ completed: !task.completed })
      });
      setTasks(current => current.map(item => item.id === task.id ? updated : item));
    } catch (err) { setError(err.message); }
  }

  async function deleteTask(id) {
    try {
      await request(`/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(current => current.filter(task => task.id !== id));
    } catch (err) { setError(err.message); }
  }

  const visibleTasks = useMemo(() => tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  }), [tasks, filter]);

  const completed = tasks.filter(task => task.completed).length;

  return (
    <main className="page">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">✓</span> taskflow</a>
        <span className="top-note">A little progress, every day.</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="subtitle">Capture your tasks. Keep your focus. Get things done.</p>
      </section>

      <section className="panel">
        <form className="add-form" onSubmit={addTask}>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="What needs to get done?" maxLength="200" aria-label="New task" />
          <button type="submit" disabled={!title.trim()}>Add task <span>＋</span></button>
        </form>

        <div className="list-heading">
          <div>
            <h2>Your tasks</h2>
            <p>{completed} of {tasks.length} completed</p>
          </div>
          <div className="filters" aria-label="Filter tasks">
            {['all', 'active', 'completed'].map(item =>
              <button key={item} className={filter === item ? 'selected' : ''}
                onClick={() => setFilter(item)} type="button">{item}</button>
            )}
          </div>
        </div>

        {error && <div className="error" role="alert">{error}</div>}
        {loading ? <div className="empty">Loading your tasks…</div> :
          visibleTasks.length === 0 ?
            <div className="empty">
              <span className="empty-icon">✳</span>
              <strong>{tasks.length ? 'Nothing in this view' : 'A fresh start.'}</strong>
              <span>{tasks.length ? 'Try another filter.' : 'Add your first task above.'}</span>
            </div> :
            <ul className="task-list">
              {visibleTasks.map(task => (
                <li key={task.id} className={task.completed ? 'task done' : 'task'}>
                  <button className="check" onClick={() => toggleTask(task)}
                    aria-label={task.completed ? 'Mark as active' : 'Mark as completed'}>
                    {task.completed ? '✓' : ''}
                  </button>
                  <span className="task-title">{task.title}</span>
                  <button className="delete" onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}>×</button>
                </li>
              ))}
            </ul>
        }
        <footer className="panel-footer"><span>✦</span> One step at a time.</footer>
      </section>
      <p className="copyright">TASKFLOW · SIMPLE BY DESIGN</p>
    </main>
  );
}
