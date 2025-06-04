const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());

//multer functionality
const multer = require('multer');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Connect to MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Isimbana21', // Change as needed
    database: 'contact_db'
});

// Connect and verify
db.connect((err) => {
    if (err) {
        console.error('❌ MySQL connection failed:', err);
        process.exit(1);
    }
    console.log('✅ MySQL connected successfully!');
});

// GET all contacts (with favorite)
app.get('/contacts', (req, res) => {
    db.query('SELECT * FROM contacts', (err, results) => {
        if (err) return res.status(500).json(err);
        // Convert MySQL 0/1 to boolean for frontend
        const contacts = results.map(c => ({ ...c, favorite: Boolean(c.favorite) }));
        res.json(contacts);
    });
});

// POST add a new contact
app.post('/contacts', (req, res) => {
    const { name, email, phone, favorite, tags, profilePic } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const favValue = favorite ? 1 : 0;

    db.query(
        'INSERT INTO contacts (name, email, phone, favorite, tags, profilePic) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone, favValue, tags || '', profilePic || ''],
        (err, results) => {
            if (err) {
                console.error('❌ MySQL insert error:', err);
                return res.status(500).json(err);
            }
            res.status(201).json({
                id: results.insertId,
                name,
                email,
                phone,
                favorite: !!favValue,
                tags: tags || '',
                profilePic: profilePic || ''
            });
        }
    );
});

//POST to upload images and return file URL or filename
app.post('/upload', upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Optionally rename file or process as needed
    res.json({ filename: req.file.filename });
});







// PUT update a contact
app.put('/contacts/:id', (req, res) => {
    const contactId = req.params.id;
    const { name, email, phone, favorite, tags, profilePic } = req.body;
    const favValue = favorite ? 1 : 0;

    db.query(
        'UPDATE contacts SET name = ?, email = ?, phone = ?, favorite = ?, tags = ?, profilePic = ? WHERE id = ?',
        [name, email, phone, favValue, tags || '', profilePic || '', contactId],


        (err, results) => {
            if (err) {
                console.error('❌ Error updating contact:', err);
                return res.status(500).json(err);
            }
            res.json({
                id: contactId,
                name,
                email,
                phone,
                favorite: !!favValue,
                tags: tags || '',
                profilePic: profilePic || ''
            });
        }
    );
});

// DELETE a contact
app.delete('/contacts/:id', (req, res) => {
    const contactId = req.params.id;

    db.query('DELETE FROM contacts WHERE id = ?', [contactId], (err, results) => {
        if (err) {
            console.error('❌ Error deleting contact:', err);
            return res.status(500).json(err);
        }
        res.sendStatus(204);
    });
});


const { Parser } = require('json2csv');

//Export contacts to CSV
app.get('/contacts/export', (req, res) => {
    db.query('SELECT * FROM contacts', (err, results) => {
        if (err) return res.status(500).json(err);

        //Select fields to include in CSV
        const fields = ['id', 'name', 'email', 'phone', 'favorite', 'tags', 'profilePic'];
        const options = { fields };

        try {
            const parser = new Parser(options);
            const csv = parser.parse(results);
            res.header('Content-Type', 'text/csv');
            res.attachment('contacts.csv');
            return res.send(csv);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }


    });

});

const fs = require('fs');
const { parse } = require('csv-parse'); // Add at top

app.post('/contacts/import', upload.single('csv'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const contacts = [];
    fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (row) => {
            // Map CSV columns to your contact schema
            contacts.push({
                name: row.name,
                email: row.email,
                phone: row.phone,
                tags: row.tags || '',
                favorite: row.favorite === '1' || row.favorite === 'true' || row.favorite === 'TRUE' ? 1 : 0,
                profilePic: row.profilePic || ''
            });
        })
        .on('end', () => {
            // Bulk insert (one by one for simplicity)
            let completed = 0;
            let errors = [];
            contacts.forEach(contact => {
                db.query(
                    'INSERT INTO contacts (name, email, phone, favorite, tags, profilePic) VALUES (?, ?, ?, ?, ?, ?)',
                    [contact.name, contact.email, contact.phone, contact.favorite, contact.tags, contact.profilePic],
                    (err, results) => {
                        completed++;
                        if (err) {
                            errors.push({ contact, error: err.message });
                        }
                        if (completed === contacts.length) {
                            // Clean up temp file
                            fs.unlinkSync(filePath);
                            if (errors.length > 0) {
                                res.status(400).json({ message: 'Some contacts could not be imported.', errors });
                            } else {
                                res.json({ message: 'Contacts imported successfully', count: contacts.length });
                            }
                        }
                    }
                );
            });
        })
        .on('error', (err) => {
            fs.unlinkSync(filePath);
            res.status(500).json({ error: 'Failed to parse CSV: ' + err.message });
        });
});



app.listen(3001, () => {
    console.log('✅ Backend running on http://localhost:3001');
});
