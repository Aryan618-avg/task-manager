const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// CREATE a task (admin only)
router.post('/project/:projectId', auth, async (req, res) => {
  const { title, description, assigned_to, due_date } = req.body;
  const { projectId } = req.params;

  if (!title) return res.status(400).json({ error: 'Task title is required' });

  try {
    const myRole = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );
    if (myRole.rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create tasks' });
    }

    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_to, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, title, description || '', assigned_to || null, due_date || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET all tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              u.name AS assignee_name,
              CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS overdue
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// UPDATE task status
router.patch('/:taskId/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be todo, in_progress, or done' });
  }

  try {
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const myRole = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, req.user.id]
    );

    const isAssignee = task.assigned_to === req.user.id;
    const isAdmin = myRole.rows[0]?.role === 'admin';

    if (!isAssignee && !isAdmin) {
      return res.status(403).json({ error: 'You are not allowed to update this task' });
    }

    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.taskId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// GET my tasks across all projects (dashboard)
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              p.name AS project_name,
              CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN true ELSE false END AS overdue
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your tasks' });
  }
});

module.exports = router;