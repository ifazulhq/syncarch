require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// SQLite Database Setup
const dbPath = path.join(__dirname, 'chat_history.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite database:', err.message);
  } else {
    console.log('📦 Connected to SQLite database: chat_history.db');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Ensure password column allows NULL and add name & picture columns
  db.all("PRAGMA table_info(users)", (err, rows) => {
    if (!err && rows) {
      const passwordCol = rows.find(r => r.name === 'password');
      const hasName = rows.some(r => r.name === 'name');
      const hasPicture = rows.some(r => r.name === 'picture');
      const hasBio = rows.some(r => r.name === 'bio');
      const hasSettings = rows.some(r => r.name === 'settings');

      if (passwordCol && passwordCol.notnull === 1) {
        console.log('🔄 Migrating users table schema to allow NULL passwords...');
        db.serialize(() => {
          db.run(`CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            picture TEXT,
            bio TEXT,
            settings TEXT,
            password TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          db.run(`INSERT INTO users_temp (id, email, password, created_at) SELECT id, email, password, created_at FROM users`);
          db.run(`DROP TABLE users`);
          db.run(`ALTER TABLE users_temp RENAME TO users`);
          console.log('✅ Users table schema updated successfully.');
        });
      } else {
        if (!hasName) db.run("ALTER TABLE users ADD COLUMN name TEXT");
        if (!hasPicture) db.run("ALTER TABLE users ADD COLUMN picture TEXT");
        if (!hasBio) db.run("ALTER TABLE users ADD COLUMN bio TEXT");
        if (!hasSettings) db.run("ALTER TABLE users ADD COLUMN settings TEXT");
      }
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'Untitled Circuit',
      circuit_data TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      description TEXT,
      likes INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.all("PRAGMA table_info(projects)", (err, rows) => {
    if (!err && rows) {
      const hasPublic = rows.some(r => r.name === 'is_public');
      const hasDesc = rows.some(r => r.name === 'description');
      const hasLikes = rows.some(r => r.name === 'likes');
      const hasThumb = rows.some(r => r.name === 'thumbnail');
      const hasTags = rows.some(r => r.name === 'tags');

      if (!hasPublic) db.run("ALTER TABLE projects ADD COLUMN is_public INTEGER DEFAULT 0");
      if (!hasDesc) db.run("ALTER TABLE projects ADD COLUMN description TEXT");
      if (!hasLikes) db.run("ALTER TABLE projects ADD COLUMN likes INTEGER DEFAULT 0");
      if (!hasThumb) db.run("ALTER TABLE projects ADD COLUMN thumbnail TEXT");
      if (!hasTags) db.run("ALTER TABLE projects ADD COLUMN tags TEXT");
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS project_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      version_label TEXT NOT NULL,
      description TEXT,
      circuit_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'syncarch_jwt_super_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Authentication Routes
// POST /api/register - Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Database query error during registration:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function (insertErr) {
        if (insertErr) {
          console.error('Registration insertion error:', insertErr.message);
          return res.status(500).json({ error: 'Failed to create user account' });
        }
        return res.status(201).json({
          message: 'User registered successfully',
          userId: this.lastID
        });
      });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/login - Authenticate user & issue JWT
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database query error during login:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user || !user.password) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const jwtSecret = process.env.JWT_SECRET || 'syncarch_jwt_super_secret_key_2026';
      const token = jwt.sign(
        { id: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google - Authenticate or Register via Google OAuth ID Token
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID || '823433995803-pk9n9kheca4i4vrs400cqoqsebfj470i.apps.googleusercontent.com';
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }

    const email = payload.email;
    const given_name = payload.given_name || (payload.name ? payload.name.split(' ')[0] : null);
    const displayName = payload.name || payload.displayName || payload.given_name || (email ? email.split('@')[0] : 'Engineer');
    const name = displayName;
    const picture = payload.picture || payload.avatar || null;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('Database query error during Google auth:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      const jwtSecret = process.env.JWT_SECRET || 'syncarch_jwt_super_secret_key_2026';

      if (user) {
        // User exists, update profile picture and name
        db.run('UPDATE users SET name = ?, picture = ? WHERE id = ?', [name, picture, user.id]);

        const userPayload = {
          id: user.id,
          email: user.email,
          name,
          given_name: given_name || name,
          displayName: displayName || name,
          picture
        };

        const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '7d' });
        return res.json({
          message: 'Google authentication successful',
          token,
          user: userPayload
        });
      } else {
        // Insert new user with email, name, picture
        db.run('INSERT INTO users (email, name, picture) VALUES (?, ?, ?)', [email, name, picture], function (insertErr) {
          if (insertErr) {
            console.error('Error creating user via Google OAuth:', insertErr.message);
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const userId = this.lastID;
          const userPayload = {
            id: userId,
            email,
            name,
            given_name: given_name || name,
            displayName: displayName || name,
            picture
          };

          const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '7d' });
          return res.status(201).json({
            message: 'Google authentication successful',
            token,
            user: userPayload
          });
        });
      }
    });
  } catch (err) {
    console.error('Google OAuth Verification Error:', err.message);
    return res.status(401).json({ error: `Google authentication failed: ${err.message}` });
  }
});

// GET /api/user/settings - Fetch user's saved settings and profile metadata
app.get('/api/user/settings', verifyToken, (req, res) => {
  db.get('SELECT id, email, name, picture, bio, settings FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      console.error('Error fetching user settings:', err.message);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let parsedSettings = {};
    if (user.settings) {
      try {
        parsedSettings = typeof user.settings === 'string' ? JSON.parse(user.settings) : user.settings;
      } catch (e) {}
    }

    return res.json({
      settings: {
        theme: parsedSettings.theme || 'dark',
        gridPattern: parsedSettings.gridPattern || 'dots',
        clockSpeed: parsedSettings.clockSpeed ?? 100,
        animationGlow: parsedSettings.animationGlow ?? true,
        customApiKey: parsedSettings.customApiKey || '',
        displayName: user.name || parsedSettings.displayName || '',
        bio: user.bio || parsedSettings.bio || '',
        customAvatar: user.picture || parsedSettings.customAvatar || ''
      }
    });
  });
});

// PUT /api/user/settings - Update user's settings & profile metadata
app.put('/api/user/settings', verifyToken, (req, res) => {
  const { settings } = req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Settings payload is required' });
  }

  const settingsStr = typeof settings === 'string' ? settings : JSON.stringify(settings);
  const displayName = settings.displayName || settings.name || null;
  const picture = settings.customAvatar || settings.picture || null;
  const bio = settings.bio || null;

  db.run(
    'UPDATE users SET settings = ?, name = COALESCE(?, name), picture = COALESCE(?, picture), bio = COALESCE(?, bio) WHERE id = ?',
    [settingsStr, displayName, picture, bio, req.user.id],
    function (err) {
      if (err) {
        console.error('Error updating settings:', err.message);
        return res.status(500).json({ error: 'Failed to save settings' });
      }
      return res.json({ message: 'Settings saved successfully', settings });
    }
  );
});

// Protected Projects Routes (Requires Authorization: Bearer <token>)

// POST /api/projects - Create a new circuit project
app.post('/api/projects', verifyToken, (req, res) => {
  try {
    const { title, circuit_data, thumbnail, tags, is_public } = req.body;
    if (!circuit_data) {
      return res.status(400).json({ error: 'circuit_data is required' });
    }

    const projectTitle = title && title.trim() ? title.trim() : 'Untitled Circuit';
    const dataString = typeof circuit_data === 'string' ? circuit_data : JSON.stringify(circuit_data);
    const thumbString = thumbnail || '';
    const tagsString = typeof tags === 'string' ? tags : (Array.isArray(tags) ? tags.join(',') : '');
    const publicVal = is_public !== undefined ? (is_public ? 1 : 0) : 0;

    db.run(
      'INSERT INTO projects (user_id, title, circuit_data, thumbnail, tags, is_public, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [req.user.id, projectTitle, dataString, thumbString, tagsString, publicVal],
      function (err) {
        if (err) {
          console.error('Error creating project:', err.message);
          return res.status(500).json({ error: 'Failed to create project' });
        }
        return res.status(201).json({
          message: 'Project saved successfully',
          projectId: this.lastID,
          title: projectTitle,
          is_public: publicVal
        });
      }
    );
  } catch (err) {
    console.error('Project creation error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects - Fetch list of user projects
app.get('/api/projects', verifyToken, (req, res) => {
  db.all(
    'SELECT id, title, thumbnail, tags, is_public, description, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching user projects:', err.message);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      return res.json({ projects: rows });
    }
  );
});

// GET /api/projects/:id - Fetch full circuit data for a specific project
app.get('/api/projects/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  db.get(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?',
    [projectId, req.user.id],
    (err, row) => {
      if (err) {
        console.error('Error fetching project by ID:', err.message);
        return res.status(500).json({ error: 'Failed to fetch project' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Project not found or unauthorized' });
      }
      return res.json({ project: row });
    }
  );
});

// PUT /api/projects/:id - Update existing project circuit data, title, thumbnail, and tags
app.put('/api/projects/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const { title, circuit_data, thumbnail, tags, is_public } = req.body;

  const dataString = circuit_data ? (typeof circuit_data === 'string' ? circuit_data : JSON.stringify(circuit_data)) : null;
  const projectTitle = title && typeof title === 'string' && title.trim() ? title.trim() : null;
  const thumbString = thumbnail !== undefined ? thumbnail : null;
  const tagsString = tags !== undefined ? (typeof tags === 'string' ? tags : (Array.isArray(tags) ? tags.join(',') : '')) : null;

  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id], (err, existing) => {
    if (err || !existing) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const updatedTitle = projectTitle !== null ? projectTitle : existing.title;
    const updatedData = dataString !== null ? dataString : existing.circuit_data;
    const updatedThumb = thumbString !== null ? thumbString : (existing.thumbnail || '');
    const updatedTags = tagsString !== null ? tagsString : (existing.tags || '');
    const updatedPublic = is_public !== undefined ? (is_public ? 1 : 0) : existing.is_public;

    db.run(
      'UPDATE projects SET title = ?, circuit_data = ?, thumbnail = ?, tags = ?, is_public = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [updatedTitle, updatedData, updatedThumb, updatedTags, updatedPublic, projectId, req.user.id],
      function (updateErr) {
        if (updateErr) {
          console.error('Error updating project:', updateErr.message);
          return res.status(500).json({ error: 'Failed to update project' });
        }
        return res.json({ message: 'Project updated successfully', is_public: updatedPublic });
      }
    );
  });
});

// DELETE /api/projects/:id - Delete a user project
app.delete('/api/projects/:id', verifyToken, (req, res) => {
  const projectId = req.params.id;
  db.run(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [projectId, req.user.id],
    function (err) {
      if (err) {
        console.error('Error deleting project:', err.message);
        return res.status(500).json({ error: 'Failed to delete project' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found or unauthorized' });
      }
      return res.json({ message: 'Project deleted successfully' });
    }
  );
});

// --- PROJECT CHECKPOINTS & VERSION HISTORY ROUTES ---

// POST /api/projects/:id/checkpoints - Save a named circuit checkpoint version
app.post('/api/projects/:id/checkpoints', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const { version_label, description, circuit_data } = req.body;

  if (!version_label || !circuit_data) {
    return res.status(400).json({ error: 'version_label and circuit_data are required' });
  }

  const label = version_label.trim();
  const desc = description ? description.trim() : '';
  const dataString = typeof circuit_data === 'string' ? circuit_data : JSON.stringify(circuit_data);

  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id], (err, project) => {
    if (err || !project) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    db.run(
      'INSERT INTO project_checkpoints (project_id, user_id, version_label, description, circuit_data) VALUES (?, ?, ?, ?, ?)',
      [projectId, req.user.id, label, desc, dataString],
      function (insertErr) {
        if (insertErr) {
          console.error('Error creating checkpoint:', insertErr.message);
          return res.status(500).json({ error: 'Failed to create checkpoint' });
        }
        return res.status(201).json({
          message: 'Checkpoint created successfully',
          checkpointId: this.lastID,
          version_label: label
        });
      }
    );
  });
});

// GET /api/projects/:id/checkpoints - List version history checkpoints
app.get('/api/projects/:id/checkpoints', verifyToken, (req, res) => {
  const projectId = req.params.id;
  db.all(
    'SELECT id, project_id, version_label, description, created_at FROM project_checkpoints WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC',
    [projectId, req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching checkpoints:', err.message);
        return res.status(500).json({ error: 'Failed to fetch checkpoints' });
      }
      return res.json({ checkpoints: rows || [] });
    }
  );
});

// POST /api/projects/:id/checkpoints/:checkpointId/restore - Revert project topology to a checkpoint
app.post('/api/projects/:id/checkpoints/:checkpointId/restore', verifyToken, (req, res) => {
  const { id: projectId, checkpointId } = req.params;

  db.get(
    'SELECT circuit_data, version_label FROM project_checkpoints WHERE id = ? AND project_id = ? AND user_id = ?',
    [checkpointId, projectId, req.user.id],
    (err, checkpoint) => {
      if (err || !checkpoint) {
        return res.status(404).json({ error: 'Checkpoint not found or unauthorized' });
      }

      db.run(
        'UPDATE projects SET circuit_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [checkpoint.circuit_data, projectId, req.user.id],
        function (updateErr) {
          if (updateErr) {
            console.error('Error restoring checkpoint:', updateErr.message);
            return res.status(500).json({ error: 'Failed to restore checkpoint' });
          }
          return res.json({
            message: `Canvas restored to checkpoint ${checkpoint.version_label}`,
            circuit_data: JSON.parse(checkpoint.circuit_data)
          });
        }
      );
    }
  );
});

// --- PUBLIC COMMUNITY & MARKETPLACE ROUTES ---

// PUT /api/projects/:id/visibility - Toggle public/private visibility and update description & tags
app.put('/api/projects/:id/visibility', verifyToken, (req, res) => {
  const projectId = req.params.id;
  const { is_public, description, tags, thumbnail } = req.body;

  const publicVal = is_public ? 1 : 0;
  const descVal = description !== undefined ? description.trim() : '';

  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, req.user.id], (err, existing) => {
    if (err || !existing) {
      return res.status(404).json({ error: 'Project not found or unauthorized' });
    }

    const updatedTags = tags !== undefined ? (typeof tags === 'string' ? tags : (Array.isArray(tags) ? tags.join(',') : '')) : (existing.tags || '');
    const updatedThumb = thumbnail !== undefined ? thumbnail : (existing.thumbnail || '');

    db.run(
      'UPDATE projects SET is_public = ?, description = ?, tags = ?, thumbnail = ? WHERE id = ? AND user_id = ?',
      [publicVal, descVal, updatedTags, updatedThumb, projectId, req.user.id],
      function (updateErr) {
        if (updateErr) {
          console.error('Error updating project visibility:', updateErr.message);
          return res.status(500).json({ error: 'Failed to update visibility' });
        }
        return res.json({ message: 'Project visibility updated', is_public: publicVal, description: descVal, tags: updatedTags });
      }
    );
  });
});

// GET /api/community/projects - Fetch published public schematics
app.get('/api/community/projects', (req, res) => {
  db.all(
    `SELECT p.id, p.title, p.description, p.circuit_data, p.thumbnail, p.tags, p.likes, p.updated_at,
            u.id as author_id, u.name as author_name, u.picture as author_picture, u.email as author_email
     FROM projects p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_public = 1
     ORDER BY p.updated_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching community projects:', err.message);
        return res.status(500).json({ error: 'Failed to fetch community projects' });
      }
      return res.json({ projects: rows || [] });
    }
  );
});

// POST /api/community/projects/:id/clone - Clone a public project into user account
app.post('/api/community/projects/:id/clone', verifyToken, (req, res) => {
  const targetId = req.params.id;

  db.get('SELECT title, circuit_data, thumbnail, tags FROM projects WHERE id = ? AND is_public = 1', [targetId], (err, target) => {
    if (err || !target) {
      return res.status(404).json({ error: 'Public project not found' });
    }

    const newTitle = `Clone of ${target.title}`;
    db.run(
      'INSERT INTO projects (user_id, title, circuit_data, thumbnail, tags, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [req.user.id, newTitle, target.circuit_data, target.thumbnail || '', target.tags || ''],
      function (insertErr) {
        if (insertErr) {
          console.error('Error cloning project:', insertErr.message);
          return res.status(500).json({ error: 'Failed to clone project' });
        }
        return res.status(201).json({
          message: 'Project cloned successfully',
          projectId: this.lastID,
          title: newTitle,
          circuit_data: JSON.parse(target.circuit_data)
        });
      }
    );
  });
});

// GET /api/chat/history - Retrieve persistent chat messages
app.get('/api/chat/history', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at ASC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching chat history:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve chat history' });
    }
    return res.json({ messages: rows });
  });
});

// POST /api/chat - AI Assistant endpoint with SQLite Persistence
app.post('/api/chat', async (req, res) => {
  try {
    const messageText = req.body.prompt || req.body.message;
    if (!messageText) {
      return res.status(400).json({ error: 'Message or prompt is required' });
    }

    // Save user message to SQLite
    db.run('INSERT INTO messages (role, text) VALUES (?, ?)', ['user', messageText], (err) => {
      if (err) console.error('Failed to persist user message:', err.message);
    });

    const apiKey = req.headers['x-custom-api-key'] || req.body.customApiKey || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackMsg = "⚠️ AI_API_KEY is missing in backend .env file. Please add your Gemini API key to backend/.env (e.g., AI_API_KEY=...) to enable live AI responses!";
      db.run('INSERT INTO messages (role, text) VALUES (?, ?)', ['ai', fallbackMsg]);
      return res.json({ response: fallbackMsg });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "You are an ECE Assistant. User says: " + messageText }
            ]
          }
        ]
      })
    });

    const data = await apiRes.json();

    if (data.error) {
      console.error('Gemini REST API Error:', data.error);
      const errMsg = `⚠️ Gemini API Error: ${data.error.message || JSON.stringify(data.error)}`;
      db.run('INSERT INTO messages (role, text) VALUES (?, ?)', ['ai', errMsg]);
      return res.status(500).json({ response: errMsg });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text received from Gemini API.';

    // Save AI response message to SQLite
    db.run('INSERT INTO messages (role, text) VALUES (?, ?)', ['ai', responseText], (err) => {
      if (err) console.error('Failed to persist AI response message:', err.message);
    });

    return res.json({ response: responseText });
  } catch (err) {
    console.error('AI Route Error:', err.message);
    const errText = `⚠️ AI Service Error: ${err.message}`;
    db.run('INSERT INTO messages (role, text) VALUES (?, ?)', ['ai', errText]);
    return res.status(500).json({ response: errText });
  }
});

// User palette of vibrant colors for cursor / lock indicators
const USER_COLORS = [
  '#38bdf8', // Neon Sky
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16'  // Lime
];

const USER_NAMES = [
  'Volt Architect',
  'Circuit Master',
  'Logic Weaver',
  'Quantum Engineer',
  'Signal Hacker',
  'Silicon Smith',
  'Binary Wizard',
  'Pulse Designer'
];

let colorIndex = 0;
let nameIndex = 0;

// In-Memory Canvas State
let components = [
  {
    id: 'esp32-1',
    type: 'ESP32',
    x: 120,
    y: 140,
    label: 'ESP32-WROOM-32',
    state: { powered: true, wifi: 'ONLINE', pinStates: { GPIO4: 1, GPIO5: 0 } },
    pins: [
      { id: '3V3', name: '3V3', type: 'power', direction: 'output' },
      { id: 'GND', name: 'GND', type: 'power', direction: 'output' },
      { id: 'GPIO4', name: 'IO4 (TX)', type: 'digital', direction: 'output' },
      { id: 'GPIO5', name: 'IO5 (RX)', type: 'digital', direction: 'input' },
      { id: 'GPIO18', name: 'IO18 (CLK)', type: 'digital', direction: 'output' },
      { id: 'GPIO19', name: 'IO19 (MISO)', type: 'digital', direction: 'input' }
    ]
  },
  {
    id: 'nand-1',
    type: 'NAND',
    x: 450,
    y: 160,
    label: '74HC00 Dual NAND',
    state: { inputA: 1, inputB: 1, output: 0 },
    pins: [
      { id: 'inA', name: 'A', type: 'digital', direction: 'input' },
      { id: 'inB', name: 'B', type: 'digital', direction: 'input' },
      { id: 'outY', name: 'Y', type: 'digital', direction: 'output' }
    ]
  },
  {
    id: 'dff-1',
    type: 'DFF',
    x: 750,
    y: 180,
    label: '7474 D Flip-Flop',
    state: { d: 1, clk: 0, q: 0, qBar: 1 },
    pins: [
      { id: 'd', name: 'D', type: 'digital', direction: 'input' },
      { id: 'clk', name: 'CLK', type: 'digital', direction: 'input' },
      { id: 'q', name: 'Q', type: 'digital', direction: 'output' },
      { id: 'qBar', name: '~Q', type: 'digital', direction: 'output' }
    ]
  },
  {
    id: 'switch-1',
    type: 'SWITCH',
    x: 140,
    y: 420,
    label: 'Logic Input Switch',
    state: { active: true },
    pins: [
      { id: 'out', name: 'OUT', type: 'digital', direction: 'output' }
    ]
  },
  {
    id: 'led-1',
    type: 'LED',
    x: 780,
    y: 440,
    label: 'Status Indicator LED',
    state: { active: false },
    pins: [
      { id: 'in', name: 'IN', type: 'digital', direction: 'input' }
    ]
  }
];

let wires = [
  {
    id: 'wire-1',
    fromCompId: 'esp32-1',
    fromPin: 'GPIO4',
    toCompId: 'nand-1',
    toPin: 'inA',
    active: true
  },
  {
    id: 'wire-2',
    fromCompId: 'switch-1',
    fromPin: 'out',
    toCompId: 'nand-1',
    toPin: 'inB',
    active: true
  }
];

// Socket ID -> User metadata
const users = new Map();

// Component ID -> { socketId, name, color }
const locks = new Map();

// Helper to evaluate component logic across circuit
function reevaluateLogic() {
  const pinSignals = new Map();

  // 1. Initial Power & Source Nodes
  components.forEach(comp => {
    if (comp.type === 'SWITCH') {
      pinSignals.set(`${comp.id}:out`, comp.state.active ? 1 : 0);
    } else if (comp.type === 'VCC') {
      pinSignals.set(`${comp.id}:out`, 1);
    } else if (comp.type === 'GND') {
      pinSignals.set(`${comp.id}:out`, 0);
    } else if (comp.type === 'CLOCK') {
      pinSignals.set(`${comp.id}:out`, comp.state.signal ?? 1);
    } else if (comp.type === 'ESP32') {
      pinSignals.set(`${comp.id}:GPIO4`, comp.state.pinStates?.GPIO4 ?? 1);
      pinSignals.set(`${comp.id}:3V3`, 1);
      pinSignals.set(`${comp.id}:GND`, 0);
    } else if (comp.type === 'ARDUINO') {
      pinSignals.set(`${comp.id}:D2`, comp.state.pinStates?.D2 ?? 1);
      pinSignals.set(`${comp.id}:5V`, 1);
      pinSignals.set(`${comp.id}:GND`, 0);
    } else if (comp.type === 'LDR') {
      pinSignals.set(`${comp.id}:out`, (comp.state.lux ?? 500) > 200 ? 1 : 0);
    } else if (comp.type === 'POTENTIOMETER') {
      pinSignals.set(`${comp.id}:wiper`, (comp.state.position ?? 50) > 50 ? 1 : 0);
    }
  });

  // 2. Pass 1 Signal Transfer across wires
  wires.forEach(wire => {
    const signalVal = pinSignals.get(`${wire.fromCompId}:${wire.fromPin}`) ?? 0;
    wire.active = signalVal === 1;
    pinSignals.set(`${wire.toCompId}:${wire.toPin}`, signalVal);
  });

  // 3. Logic Gate & Subsystem Evaluation
  components.forEach(comp => {
    if (comp.type === 'NAND') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = !(inA === 1 && inB === 1) ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'AND') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = (inA === 1 && inB === 1) ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'OR') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = (inA === 1 || inB === 1) ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'NOT') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const out = inA === 1 ? 0 : 1;
      comp.state = { ...comp.state, inputA: inA, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'NOR') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = !(inA === 1 || inB === 1) ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'XNOR') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = inA === inB ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'HALF_ADDER') {
      const a = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const b = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const sum = a !== b ? 1 : 0;
      const carry = (a === 1 && b === 1) ? 1 : 0;
      comp.state = { ...comp.state, inputA: a, inputB: b, sum, carry };
      pinSignals.set(`${comp.id}:sum`, sum);
      pinSignals.set(`${comp.id}:carry`, carry);
    } else if (comp.type === 'FULL_ADDER') {
      const a = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const b = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const cin = pinSignals.get(`${comp.id}:cin`) ?? 0;
      const sum = ((a ^ b ^ cin) & 1);
      const cout = ((a & b) | (cin & (a ^ b))) ? 1 : 0;
      comp.state = { ...comp.state, inputA: a, inputB: b, cin, sum, cout };
      pinSignals.set(`${comp.id}:sum`, sum);
      pinSignals.set(`${comp.id}:cout`, cout);
    } else if (comp.type === 'DEMUX14') {
      const d = pinSignals.get(`${comp.id}:inData`) ?? 0;
      const s0 = pinSignals.get(`${comp.id}:s0`) ?? 0;
      const s1 = pinSignals.get(`${comp.id}:s1`) ?? 0;
      const sel = (s1 << 1) | s0;
      const y0 = sel === 0 ? d : 0;
      const y1 = sel === 1 ? d : 0;
      const y2 = sel === 2 ? d : 0;
      const y3 = sel === 3 ? d : 0;
      comp.state = { ...comp.state, inData: d, s0, s1, y0, y1, y2, y3 };
      pinSignals.set(`${comp.id}:y0`, y0);
      pinSignals.set(`${comp.id}:y1`, y1);
      pinSignals.set(`${comp.id}:y2`, y2);
      pinSignals.set(`${comp.id}:y3`, y3);
    } else if (comp.type === 'SR_LATCH') {
      const s = pinSignals.get(`${comp.id}:s`) ?? 0;
      const r = pinSignals.get(`${comp.id}:r`) ?? 0;
      let q = comp.state.q ?? 0;
      let qBar = comp.state.qBar ?? 1;
      let invalidState = false;

      if (s === 1 && r === 1) {
        q = 0;
        qBar = 0;
        invalidState = true;
      } else if (s === 1 && r === 0) {
        q = 1;
        qBar = 0;
      } else if (s === 0 && r === 1) {
        q = 0;
        qBar = 1;
      }
      comp.state = { ...comp.state, s, r, q, qBar, invalidState };
      pinSignals.set(`${comp.id}:q`, q);
      pinSignals.set(`${comp.id}:qBar`, qBar);
    } else if (comp.type === 'SHIFT_REG_4BIT') {
      const dataIn = pinSignals.get(`${comp.id}:dataIn`) ?? 0;
      const clk = pinSignals.get(`${comp.id}:clk`) ?? 0;
      const reset = pinSignals.get(`${comp.id}:reset`) ?? 0;
      const prevClk = comp.state.prevClk ?? 0;
      let buffer = [...(comp.state.buffer || [0, 0, 0, 0])];

      if (reset === 1) {
        buffer = [0, 0, 0, 0];
      } else if (clk === 1 && prevClk === 0) {
        buffer = [dataIn, buffer[0], buffer[1], buffer[2]];
      }

      comp.state = {
        ...comp.state,
        buffer,
        prevClk: clk,
        q0: buffer[0],
        q1: buffer[1],
        q2: buffer[2],
        q3: buffer[3]
      };
      pinSignals.set(`${comp.id}:q0`, buffer[0]);
      pinSignals.set(`${comp.id}:q1`, buffer[1]);
      pinSignals.set(`${comp.id}:q2`, buffer[2]);
      pinSignals.set(`${comp.id}:q3`, buffer[3]);
    } else if (comp.type === 'COUNTER_4BIT') {
      const enable = pinSignals.get(`${comp.id}:enable`) ?? 1;
      const clk = pinSignals.get(`${comp.id}:clk`) ?? 0;
      const reset = pinSignals.get(`${comp.id}:reset`) ?? 0;
      const prevClk = comp.state.prevClk ?? 0;
      let count = comp.state.count ?? 0;

      if (reset === 1) {
        count = 0;
      } else if (clk === 1 && prevClk === 0 && enable === 1) {
        count = (count + 1) % 16;
      }

      const q0 = count & 1;
      const q1 = (count & 2) >> 1;
      const q2 = (count & 4) >> 2;
      const q3 = (count & 8) >> 3;
      const overflow = count === 15 ? 1 : 0;

      comp.state = { ...comp.state, count, prevClk: clk, q0, q1, q2, q3, overflow };
      pinSignals.set(`${comp.id}:q0`, q0);
      pinSignals.set(`${comp.id}:q1`, q1);
      pinSignals.set(`${comp.id}:q2`, q2);
      pinSignals.set(`${comp.id}:q3`, q3);
      pinSignals.set(`${comp.id}:overflow`, overflow);
    } else if (comp.type === 'XOR') {
      const inA = pinSignals.get(`${comp.id}:inA`) ?? 0;
      const inB = pinSignals.get(`${comp.id}:inB`) ?? 0;
      const out = inA !== inB ? 1 : 0;
      comp.state = { ...comp.state, inputA: inA, inputB: inB, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'MUX21') {
      const i0 = pinSignals.get(`${comp.id}:i0`) ?? 0;
      const i1 = pinSignals.get(`${comp.id}:i1`) ?? 0;
      const sel = pinSignals.get(`${comp.id}:sel`) ?? 0;
      const out = sel === 1 ? i1 : i0;
      comp.state = { ...comp.state, i0, i1, sel, output: out };
      pinSignals.set(`${comp.id}:outY`, out);
    } else if (comp.type === 'DEC38') {
      const a0 = pinSignals.get(`${comp.id}:a0`) ?? 0;
      const a1 = pinSignals.get(`${comp.id}:a1`) ?? 0;
      const a2 = pinSignals.get(`${comp.id}:a2`) ?? 0;
      const activeLine = (a2 << 2) | (a1 << 1) | a0;
      comp.state = { ...comp.state, activeLine };
      for (let i = 0; i < 8; i++) {
        pinSignals.set(`${comp.id}:y${i}`, i === activeLine ? 1 : 0);
      }
    }
  });

  // 4. Pass 2 Signal Transfer for Downstream Connections
  wires.forEach(wire => {
    const signalVal = pinSignals.get(`${wire.fromCompId}:${wire.fromPin}`) ?? 0;
    wire.active = signalVal === 1;
    pinSignals.set(`${wire.toCompId}:${wire.toPin}`, signalVal);
  });

  // 5. Flip-Flop & Visual Output Evaluation
  components.forEach(comp => {
    if (comp.type === 'DFF') {
      const d = pinSignals.get(`${comp.id}:d`) ?? 0;
      const clk = pinSignals.get(`${comp.id}:clk`) ?? 0;
      const q = clk === 1 ? d : (comp.state.q ?? 0);
      comp.state = { ...comp.state, d, clk, q, qBar: q === 1 ? 0 : 1 };
      pinSignals.set(`${comp.id}:q`, comp.state.q);
      pinSignals.set(`${comp.id}:qBar`, comp.state.qBar);
    } else if (comp.type === 'LED') {
      const active = (pinSignals.get(`${comp.id}:in`) ?? 0) === 1;
      comp.state = { ...comp.state, active };
    }
  });
}

// Perform initial logic evaluation
reevaluateLogic();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', components: components.length, users: users.size });
});

io.on('connection', (socket) => {
  const userColor = USER_COLORS[colorIndex % USER_COLORS.length];
  const userName = `${USER_NAMES[nameIndex % USER_NAMES.length]} #${socket.id.slice(0, 4)}`;
  colorIndex++;
  nameIndex++;

  const userInfo = {
    id: socket.id,
    name: userName,
    color: userColor,
    cursor: { x: 0, y: 0 },
    roomId: 'global'
  };

  users.set(socket.id, userInfo);
  console.log(`[Connect] ${userName} (${socket.id}) connected.`);

  // Send initial canvas state to newly joined client
  const locksObj = {};
  locks.forEach((val, key) => {
    locksObj[key] = val;
  });

  socket.emit('init:state', {
    myUser: userInfo,
    users: Array.from(users.values()),
    components,
    wires,
    locks: locksObj
  });

  // 0. Room Join & Session Handling
  socket.on('room:join', ({ roomId }) => {
    if (!roomId) return;
    const targetRoom = String(roomId);
    const oldRoom = userInfo.roomId;

    if (oldRoom && oldRoom !== targetRoom) {
      socket.leave(oldRoom);
      const oldRoomUsers = Array.from(users.values()).filter(u => u.roomId === oldRoom && u.id !== socket.id);
      io.to(oldRoom).emit('room:users', { roomId: oldRoom, users: oldRoomUsers });
    }

    userInfo.roomId = targetRoom;
    socket.join(targetRoom);

    const roomUsers = Array.from(users.values()).filter(u => u.roomId === targetRoom);
    io.to(targetRoom).emit('room:users', { roomId: targetRoom, users: roomUsers });

    socket.emit('init:state', {
      myUser: userInfo,
      users: roomUsers,
      components,
      wires,
      locks: locksObj
    });

    console.log(`[Room] ${userInfo.name} joined room "${targetRoom}". Room user count: ${roomUsers.length}`);
  });

  // 0. User Profile Identification & Sync
  socket.on('user:identify', (data) => {
    if (users.has(socket.id) && data) {
      const u = users.get(socket.id);
      if (data.email) u.email = data.email;
      if (data.name) u.name = data.name;
      if (data.picture || data.avatar) u.picture = data.picture || data.avatar;
      
      const currentRoom = u.roomId || 'global';
      const roomUsers = Array.from(users.values()).filter(usr => usr.roomId === currentRoom);
      io.to(currentRoom).emit('room:users', { roomId: currentRoom, users: roomUsers });
      io.to(currentRoom).emit('user:joined', u);
    }
  });

  // 1. Real-Time Cursor Motion (Throttled on client)
  socket.on('cursor:move', (coords) => {
    if (users.has(socket.id)) {
      const u = users.get(socket.id);
      u.cursor = coords;
      socket.to(u.roomId || 'global').emit('cursor:updated', {
        socketId: socket.id,
        cursor: coords
      });
    }
  });

  // 2. Block-Locking Mechanism
  socket.on('component:lock', ({ componentId }) => {
    const existingLock = locks.get(componentId);
    const currentRoom = userInfo.roomId || 'global';

    if (!existingLock || existingLock.socketId === socket.id) {
      const lockData = {
        socketId: socket.id,
        name: userInfo.name,
        color: userInfo.color
      };
      locks.set(componentId, lockData);
      socket.emit('component:lock_ack', { componentId, success: true });
      io.to(currentRoom).emit('component:locked', { componentId, lock: lockData });
      console.log(`[Lock] Component ${componentId} locked by ${userInfo.name} in room ${currentRoom}`);
    } else {
      socket.emit('component:lock_ack', {
        componentId,
        success: false,
        lockedBy: existingLock
      });
    }
  });

  socket.on('component:unlock', ({ componentId }) => {
    const existingLock = locks.get(componentId);
    const currentRoom = userInfo.roomId || 'global';
    if (existingLock && existingLock.socketId === socket.id) {
      locks.delete(componentId);
      io.to(currentRoom).emit('component:unlocked', { componentId });
      console.log(`[Unlock] Component ${componentId} unlocked by ${userInfo.name}`);
    }
  });

  // 3. Drag / Position Movement Updates
  socket.on('component:move', ({ id, x, y }) => {
    const comp = components.find(c => c.id === id);
    const currentRoom = userInfo.roomId || 'global';
    if (comp) {
      const existingLock = locks.get(id);
      if (!existingLock || existingLock.socketId === socket.id) {
        comp.x = x;
        comp.y = y;
        socket.to(currentRoom).emit('component:moved', { id, x, y, movedBy: socket.id });
      }
    }
  });

  socket.on('component:rotate', ({ id, rotation }) => {
    const comp = components.find(c => c.id === id);
    const currentRoom = userInfo.roomId || 'global';
    if (comp) {
      comp.rotation = rotation;
      socket.to(currentRoom).emit('component:rotated', { id, rotation });
    }
  });

  // 4. Component Creation & Canvas Sync
  socket.on('canvas:sync', (data) => {
    const currentRoom = userInfo.roomId || 'global';
    if (data && Array.isArray(data.components)) components = data.components;
    if (data && Array.isArray(data.wires)) wires = data.wires;
    reevaluateLogic();
    socket.to(currentRoom).emit('canvas:sync', { components, wires });
  });

  socket.on('component:add', (newComp) => {
    const currentRoom = userInfo.roomId || 'global';
    if (newComp && newComp.id) {
      if (!components.some(c => c.id === newComp.id)) {
        components.push(newComp);
      }
      reevaluateLogic();
      io.to(currentRoom).emit('canvas:sync', { components, wires });
    }
  });

  // 5. Component Logic State Toggle & Update
  socket.on('component:toggle', ({ id, state: statePayload }) => {
    const comp = components.find(c => c.id === id);
    const currentRoom = userInfo.roomId || 'global';
    if (comp) {
      if (statePayload) {
        comp.state = { ...comp.state, ...statePayload };
      } else if (comp.type === 'SWITCH') {
        comp.state.active = !comp.state.active;
      } else if (comp.type === 'ESP32') {
        comp.state.pinStates.GPIO4 = comp.state.pinStates.GPIO4 === 1 ? 0 : 1;
      }
      reevaluateLogic();
      io.to(currentRoom).emit('canvas:sync', { components, wires });
    }
  });

  socket.on('component:update', ({ id, state: statePayload }) => {
    const comp = components.find(c => c.id === id);
    const currentRoom = userInfo.roomId || 'global';
    if (comp && statePayload) {
      comp.state = { ...comp.state, ...statePayload };
      reevaluateLogic();
      io.to(currentRoom).emit('canvas:sync', { components, wires });
    }
  });

  // 6. Component Deletion
  socket.on('component:delete', ({ id }) => {
    const currentRoom = userInfo.roomId || 'global';
    components = components.filter(c => c.id !== id);
    wires = wires.filter(w => w.fromCompId !== id && w.toCompId !== id);
    locks.delete(id);
    reevaluateLogic();
    io.to(currentRoom).emit('component:deleted', { id });
    io.to(currentRoom).emit('canvas:sync', { components, wires });
  });

  // 7. Wire Connection Addition & Deletion
  socket.on('wire:add', (wire) => {
    const currentRoom = userInfo.roomId || 'global';
    const exists = wires.some(w => 
      w.fromCompId === wire.fromCompId && w.fromPin === wire.fromPin &&
      w.toCompId === wire.toCompId && w.toPin === wire.toPin
    );
    if (!exists) {
      wires.push(wire);
      reevaluateLogic();
      io.to(currentRoom).emit('canvas:sync', { components, wires });
    }
  });

  socket.on('wire:delete', ({ id }) => {
    const currentRoom = userInfo.roomId || 'global';
    wires = wires.filter(w => w.id !== id);
    reevaluateLogic();
    io.to(currentRoom).emit('canvas:sync', { components, wires });
  });

  // 8. Disconnect Cleanup
  socket.on('disconnect', () => {
    const currentRoom = userInfo.roomId || 'global';
    console.log(`[Disconnect] ${userInfo.name} (${socket.id}) left room ${currentRoom}.`);
    users.delete(socket.id);

    // Clean up locks held by this disconnected user
    const unlockedIds = [];
    locks.forEach((lock, compId) => {
      if (lock.socketId === socket.id) {
        locks.delete(compId);
        unlockedIds.push(compId);
      }
    });

    unlockedIds.forEach(id => {
      io.to(currentRoom).emit('component:unlocked', { componentId: id });
    });

    const remainingRoomUsers = Array.from(users.values()).filter(u => u.roomId === currentRoom);
    io.to(currentRoom).emit('room:users', { roomId: currentRoom, users: remainingRoomUsers });
    io.to(currentRoom).emit('user:left', { socketId: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`⚡ SyncArch Socket.io Server running on port ${PORT}`);
});
