const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

const levelDBService = {
  // Add data to levelDB with key/value pair
  addBlockToDB: (key,value) => new Promise((resolve, reject) => {
    db.put(key, value, (err) => {
      if (err) {
        reject(err);
      }

      console.log(`Block #${key} added successfully`);
      resolve(`Block #${key} added successfully`);
    })
  }),

  // Get block from levelDB by key
  getBlockFromDB: (key) => new Promise((resolve, reject) => {
    db.get(key, (err, value) => {
      if (err) {
        reject(err);
      }
      resolve(value)
    })
  }),

  getBlockHeightFromDB: () => new Promise((resolve, reject) => {
    let height = -1;
    db.createReadStream().on('data', (data) => {
      height++
    }).on('error', (error) => {
      reject(error)
    }).on('close', () => {
      resolve(height)
    })
  })
};

module.exports = levelDBService;
