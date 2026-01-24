const fs = require('fs');
const path = require('path');

const configDir = path.join(__dirname, '..', 'config');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('Config directory created');
} else {
  console.log('Config directory already exists');
}
