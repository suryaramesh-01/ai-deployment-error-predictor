const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const samplesDir = path.join(__dirname, 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// 1. Create Sample Node.js Project ZIP
const nodeZip = new AdmZip();

const nodePackageJson = JSON.stringify({
  "name": "sample-e-commerce-api",
  "version": "1.0.0",
  "description": "E-commerce backend service with deployment issues",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "*"
  }
}, null, 2);

const nodeServerJs = `const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Missing from package.json!

const app = express();
app.use(cors());
app.use(express.json());

// Insecure AWS access key hardcoded!
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPL";

// References undefined environment variable in .env.example
const dbConnection = process.env.DATABASE_URL;

app.get('/api/products', async (req, res) => {
  res.json([{ id: 1, name: 'Cloud Server', price: 99.99 }]);
});

// Hardcoded port without process.env.PORT fallback and bound to 127.0.0.1
app.listen(5000, '127.0.0.1', () => {
  console.log('Server started on port 5000');
});
`;

const nodeDockerfile = `FROM node:18-alpine
# Missing WORKDIR
COPY package*.json ./
RUN npm install
# Missing .dockerignore
COPY . .
# Missing EXPOSE
# Missing CMD or ENTRYPOINT
`;

const nodeEnvExample = `PORT=5000
NODE_ENV=production
`;

nodeZip.addFile('package.json', Buffer.from(nodePackageJson, 'utf8'));
nodeZip.addFile('server.js', Buffer.from(nodeServerJs, 'utf8'));
nodeZip.addFile('Dockerfile', Buffer.from(nodeDockerfile, 'utf8'));
nodeZip.addFile('.env.example', Buffer.from(nodeEnvExample, 'utf8'));

nodeZip.writeZip(path.join(samplesDir, 'sample-node-project.zip'));
console.log('Created sample-node-project.zip');

// 2. Create Sample Python Project ZIP
const pyZip = new AdmZip();

const pyApp = `import os
from flask import Flask, jsonify
import requests # Missing from requirements.txt!

app = Flask(__name__)

# Hardcoded debug mode in production code
DEBUG = True

# Hardcoded DB credentials in source
MONGO_URI = "mongodb://dbadmin:SuperSecretPass123!@cluster0.example.com/mydb"

@app.route('/')
def index():
    return jsonify({"status": "running", "service": "orders-api"})

if __name__ == '__main__':
    # Bound to loopback interface 127.0.0.1
    app.run(host='127.0.0.1', port=8000, debug=DEBUG)
`;

const pyReqs = `Flask==2.3.2
gunicorn==21.2.0
`;

const pyDocker = `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
`;

pyZip.addFile('app.py', Buffer.from(pyApp, 'utf8'));
pyZip.addFile('requirements.txt', Buffer.from(pyReqs, 'utf8'));
pyZip.addFile('Dockerfile', Buffer.from(pyDocker, 'utf8'));

pyZip.writeZip(path.join(samplesDir, 'sample-python-project.zip'));
console.log('Created sample-python-project.zip');
