const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// CREATE a project
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const projResult = await client.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', userId]
    );
    const project = projResult.rows[0];

    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, userId, 'admin']
    );

    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    client.release();
  }
});

// GET all projects for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pm.role
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE p.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ADD member to project (admin only)
router.post('/:id/members', auth, async (req, res) => {
  const { email, role = 'member' } = req.body;
  const projectId = req.params.id;

  try {
    const myRole = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );
    if (myRole.rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add members' });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!userResult.rows[0]) {
      return res.status(404).json({ error: 'User not found. They must sign up first.' });
    }

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [projectId, userResult.rows[0].id, role]
    );

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// GET members of a project
router.get('/:id/members', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role
       FROM users u
       JOIN project_members pm ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;