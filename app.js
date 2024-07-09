const express = require('express');
const exphbs = require('express-handlebars');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const handlebarsHelpers = require('handlebars-helpers')();

const app = express();
const db = new sqlite3.Database('./db/iot_api.db');

// Configuración de Handlebars
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        baseUrl: () => {
            return ''; // Aquí podrías agregar la base URL si es necesario
        },
        ...handlebarsHelpers
    }
}));

app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta de inicio
app.get('/', (req, res) => {
    res.render('home');
});

// Ruta para la página de documentación de la API
app.get('/api-docs', (req, res) => {
    res.render('api');
});

// Crear nuevo admin
app.post('/api/v1/admin', (req, res) => {
    const { Username, Password } = req.body;

    db.run('INSERT INTO Admin (Username, Password) VALUES (?, ?)', [Username, Password], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ success: 'true' });
    });
});

// Obtener todos los admin
app.get('/api/v1/admins', (req, res) => {
    db.all('SELECT Username FROM Admin', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Crear nueva compañia
app.post('/api/v1/company', (req, res) => {
    const { company_name } = req.body;

    db.run('INSERT INTO Company (company_name) VALUES (?)', [company_name], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Obtener el ID de la compañía recién insertada
        const companyId = this.lastID;

        // Consultar para obtener el company_api_key
        db.get('SELECT company_api_key FROM Company WHERE ID = ?', [companyId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ success: 'true', company_api_key: row.company_api_key });
        });
    });
});

// Obtener todas las compañias
app.get('/api/v1/companies', (req, res) => {
    db.all('SELECT ID, company_name FROM Company', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Crear nueva ubicación
app.post('/api/v1/location', (req, res) => {
    const { company_api_key, company_id, location_name, location_country, location_city, location_meta } = req.body;

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('INSERT INTO Location (company_id, location_name, location_country, location_city, location_meta) VALUES (?, ?, ?, ?, ?)', [company_id, location_name, location_country, location_city, location_meta], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        });
    });
});

// Obtener todas las ubicaciones
app.get('/api/v1/locations', (req, res) => {
    db.all('SELECT * FROM Location', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Obtener una ubicación por ID
app.get('/api/v1/location/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM Location WHERE rowid = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Actualizar una ubicación
app.put('/api/v1/location/:id', (req, res) => {
    const { id } = req.params;
    const {company_api_key, location_name, location_country, location_city, location_meta } = req.body;

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('UPDATE Location SET location_name = ?, location_country = ?, location_city = ?, location_meta = ? WHERE rowid = ?', [location_name, location_country, location_city, location_meta, id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        });
    });    
});

// Eliminar una ubicación
app.delete('/api/v1/location/:id', (req, res) => {
    const { id } = req.params;
    const { company_api_key } = req.body;

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('DELETE FROM Location WHERE rowid = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        });
    });        
});

// Crear nuevo sensor
app.post('/api/v1/sensor', (req, res) => {
    const { company_api_key, location_id, sensor_name, sensor_category, sensor_meta } = req.body;

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('INSERT INTO Sensor (location_id, sensor_name, sensor_category, sensor_meta) VALUES (?, ?, ?, ?)', [location_id, sensor_name, sensor_category, sensor_meta], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Obtener el ID del sensor recién insertado
            const sensor_id = this.lastID;

            // Consultar para obtener el sensor_api_key
            db.get('SELECT sensor_api_key FROM Sensor WHERE sensor_id = ?', [sensor_id], (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ success: 'true', sensor_api_key: row.sensor_api_key });
            });
        });
    });
});


// Obtener todos los sensores
app.get('/api/v1/sensors', (req, res) => {
    db.all('SELECT location_id, sensor_id, sensor_name, sensor_category, sensor_meta FROM Sensor', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Obtener un sensor por ID
app.get('/api/v1/sensor/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT location_id, sensor_id, sensor_name, sensor_category, sensor_meta FROM Sensor WHERE sensor_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// Actualizar un sensor
app.put('/api/v1/sensor/:id', (req, res) => {
    const { id } = req.params;
    const { company_api_key, sensor_name, sensor_category, sensor_meta } = req.body;

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('UPDATE Sensor SET sensor_name = ?, sensor_category = ?, sensor_meta = ? WHERE sensor_id = ?', [sensor_name, sensor_category, sensor_meta, id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        });
    });
});

// Eliminar un sensor
app.delete('/api/v1/sensor/:id', (req, res) => {
    const { id } = req.params;
    const { company_api_key } = req.body;
    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        db.run('DELETE FROM Sensor WHERE sensor_id = ?', [id], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ changes: this.changes });
        });
    });
    
});

// Insertar datos del sensor
app.post('/api/v1/sensor_data', (req, res) => {
    const { api_key, json_data } = req.body;

    // Verificar si el sensor_api_key es válido
    db.get('SELECT * FROM Sensor WHERE sensor_api_key = ?', [api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const sensor_id = row.sensor_id;

        // Insertar los datos del sensor
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            const stmt = db.prepare('INSERT INTO Sensor_Data (sensor_id, data_key, data_value) VALUES (?, ?, ?)');
            json_data.forEach(({ data_key, data_value }) => {
                stmt.run(sensor_id, data_key, data_value);
            });
            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                db.run('COMMIT');
                res.status(201).json({ success: true });
            });
        });
    });
});

// Consultar datos del sensor
app.get('/api/v1/sensor_data', (req, res) => {
    const { company_api_key } = req.headers;
    const { from, to, sensor_id } = req.query;

    // Convertir from y to a timestamps si es necesario
    const fromTimestamp = parseInt(from, 10);
    const toTimestamp = parseInt(to, 10);

    // Verificar la validez de company_api_key
    db.get('SELECT * FROM Company WHERE company_api_key = ?', [company_api_key], (err, row) => {
        if (err || !row) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Obtener los datos del sensor según los parámetros
        let query = 'SELECT * FROM Sensor_Data WHERE sensor_id IN (' + sensor_id + ')';
        const params = [];

        if (from && to) {
            query += ' AND timestamp BETWEEN ? AND ?';
            params.push(fromTimestamp, toTimestamp);
        }

        db.all(query, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        });
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
