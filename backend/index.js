// index.js (for Postgres/Neon)
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse');
const { Parser } = require('json2csv');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded images

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });


// Connect to PostgreSQL (Neon)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_PrZp4lxG9WNI@ep-wandering-grass-a4khr7ul-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

// GET all contacts
app.get('/contacts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts');
        const contacts = result.rows.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            favorite: !!c.favorite,
            tags: c.tags || '',
            profilePic: c.profilepic || ''  // ✅ Ensure profilePic is included
        }));
        res.json(contacts);
    } catch (err) {
        console.error('❌ Error fetching contacts:', err);
        res.status(500).json(err);
    }
});

// POST add a new contact
app.post('/contacts', async (req, res) => {
    const { name, email, phone, favorite, tags, profilePic } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const favValue = favorite ? 1 : 0;
    try {
        const result = await pool.query(
            'INSERT INTO contacts (name, email, phone, favorite, tags, profilePic) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, email, phone, favValue, tags || '', profilePic || '']
        );
        res.status(201).json({
            id: result.rows[0].id,
            name,
            email,
            phone,
            favorite: !!favValue,
            tags: tags || '',
            profilePic: profilePic || ''
        });
    } catch (err) {
        console.error('❌ Postgres insert error:', err);
        res.status(500).json(err);
    }
});

// POST to upload images and return file URL or filename
app.post('/upload', upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename });
});

// PUT update a contact
app.put('/contacts/:id', async (req, res) => {
    const contactId = req.params.id;
    const { name, email, phone, favorite, tags, profilePic } = req.body;
    const favValue = favorite ? 1 : 0;
    try {
        await pool.query(
            'UPDATE contacts SET name = $1, email = $2, phone = $3, favorite = $4, tags = $5, profilePic = $6 WHERE id = $7',
            [name, email, phone, favValue, tags || '', profilePic || '', contactId]
        );
        res.json({
            id: contactId,
            name,
            email,
            phone,
            favorite: !!favValue,
            tags: tags || '',
            profilePic: profilePic || ''
        });
    } catch (err) {
        console.error('❌ Error updating contact:', err);
        res.status(500).json(err);
    }
});

// DELETE a contact
app.delete('/contacts/:id', async (req, res) => {
    const contactId = req.params.id;
    try {
        await pool.query('DELETE FROM contacts WHERE id = $1', [contactId]);
        res.sendStatus(204);
    } catch (err) {
        console.error('❌ Error deleting contact:', err);
        res.status(500).json(err);
    }
});

// Export contacts to CSV
app.get('/contacts/export', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts');
        const fields = ['id', 'name', 'email', 'phone', 'favorite', 'tags', 'profilePic'];
        const parser = new Parser({ fields });
        const csv = parser.parse(result.rows);
        res.header('Content-Type', 'text/csv');
        res.attachment('contacts.csv');
        return res.send(csv);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Import contacts from CSV
app.post('/contacts/import', upload.single('csv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const contacts = [];
    fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => {
            contacts.push({
                name: row.name,
                email: row.email,
                phone: row.phone,
                tags: row.tags || '',
                favorite: row.favorite === '1' || row.favorite === 'true' || row.favorite === 'TRUE' ? 1 : 0,
                profilePic: row.profilePic || ''
            });
        })
        .on('end', async () => {
            let errors = [];
            for (const contact of contacts) {
                try {
                    await pool.query(
                        'INSERT INTO contacts (name, email, phone, favorite, tags, profilePic) VALUES ($1, $2, $3, $4, $5, $6)',
                        [contact.name, contact.email, contact.phone, contact.favorite, contact.tags, contact.profilePic]
                    );
                } catch (err) {
                    errors.push({ contact, error: err.message });
                }
            }
            fs.unlinkSync(filePath);
            if (errors.length > 0) {
                res.status(400).json({ message: 'Some contacts could not be imported.', errors });
            } else {
                res.json({ message: 'Contacts imported successfully', count: contacts.length });
            }
        })
        .on('error', (err) => {
            fs.unlinkSync(filePath);
            res.status(500).json({ error: 'Failed to parse CSV: ' + err.message });
        });
});

app.listen(3001, () => {
    console.log('✅ Backend running on http://localhost:3001');
});
