-- Creación de la tabla Admin
CREATE TABLE Admin (
    Username TEXT PRIMARY KEY,
    Password TEXT NOT NULL
);

-- Creación de la tabla Company
CREATE TABLE Company (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL UNIQUE,
    company_api_key TEXT
);

-- Creación de la tabla Location
CREATE TABLE Location (
    company_id INTEGER NOT NULL,
    location_name TEXT NOT NULL,
    location_country TEXT NOT NULL,
    location_city TEXT NOT NULL,
    location_meta TEXT,
    FOREIGN KEY (company_id) REFERENCES Company(ID)
);

-- Creación de la tabla Sensor
CREATE TABLE Sensor (
    location_id INTEGER NOT NULL,
    sensor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_name TEXT NOT NULL,
    sensor_category TEXT NOT NULL,
    sensor_meta TEXT,
    sensor_api_key TEXT,
    FOREIGN KEY (location_id) REFERENCES Location(company_id)
);

-- Creación de la tabla Sensor_Data
CREATE TABLE Sensor_Data (
    sensor_id INTEGER NOT NULL,
    data_key TEXT NOT NULL,
    data_value TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES Sensor(sensor_id),
    PRIMARY KEY (sensor_id, data_key, timestamp)
);

-- Trigger para generar company_api_key cuando se inserta una nueva compañía
CREATE TRIGGER generate_company_api_key
AFTER INSERT ON Company
FOR EACH ROW
BEGIN
    UPDATE Company
    SET company_api_key = hex(randomblob(16))
    WHERE ID = NEW.ID;
END;

-- Trigger para generar sensor_api_key cuando se inserta un nuevo sensor
CREATE TRIGGER generate_sensor_api_key
AFTER INSERT ON Sensor
FOR EACH ROW
BEGIN
    UPDATE Sensor
    SET sensor_api_key = hex(randomblob(16))
    WHERE sensor_id = NEW.sensor_id;
END;
