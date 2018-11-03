const SHA256 = require('crypto-js/sha256');
const levelDBService = require('./levelSandbox');

class Block {
	constructor(data) {
    this.hash = '';
    this.height = 0;
    this.body = data;
    this.time = 0;
    this.previousBlockHash = '';
  }
}

class Blockchain {
  constructor() {
    this.getBlockHeight()
      .then((height) => {
        if (height === -1) {
          let newBlock = new Block('First block in the chain - Genesis block');
          this.addBlock(newBlock).then(() => console.log('Added genesis block'));
        }
      });
  }

  // Add new block
  async addBlock(newBlock) {
    // Block height  
    const height = await this.getBlockHeight();
    newBlock.height = height + 1;

    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0, -3);

    // previous block hash
    if(newBlock.height > 0) {
      const previousBlock = await this.getBlock(height);
      newBlock.previousBlockHash = previousBlock.hash;
      console.log(`Previous Block hash: ${newBlock.previousBlockHash}`);
    }

    // Block hash with SHA256 using newBlock and converting to a string
    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
    console.log(`New Block hash: ${newBlock.hash}`);

    // Adding block object to chain
    await levelDBService.addBlockToDB(newBlock.height, JSON.stringify(newBlock));
  }

  // Get block height
  async getBlockHeight() {
    return await levelDBService.getBlockHeightFromDB();
  }

  // get block
  async getBlock(blockHeight) {
    // return object as a single string
    return JSON.parse(await levelDBService.getBlockFromDB(blockHeight));
  }

  // validate block
  async validateBlock(blockHeight) {
    // get block object
    let block = await this.getBlock(blockHeight);

    // get block hash
    let blockHash = block.hash;

    // remove block hash to test block integrity
    block.hash = '';

    // generate block hash
    let validBlockHash = SHA256(JSON.stringify(block)).toString();

    // Compare
    if (blockHash === validBlockHash) {
        return true;
      } else {
        console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
      }
  }

  // Validate blockchain
  async validateChain() {
    let errorLog = [];
    let previousBlockHash = '';
    const height = await this.getBlockHeight();

    for (let i = 0; i <= height; i++) {
      // compare blocks hash link
      let block = await this.getBlock(i);

      if ((!this.validateBlock(block.height)) || (block.previousBlockHash !== previousBlockHash)) {
        errorLog.push(i)
      }
      previousBlockHash = block.hash;
    }

    if (errorLog.length > 0) {
      console.log('Block errors = ' + errorLog.length);
      console.log('Blocks: '+errorLog);
    } else {
      console.log('No errors detected');
    }
  }
}

let blockchain = new Blockchain();

(function theLoop(i) {
  setTimeout(() => {
    blockchain.addBlock(new Block(`Test item #${i}`)).then(() => {
      if (--i) {
        theLoop(i);
      }
    })
  }, 100);
})(10);

setTimeout(() => blockchain.validateChain(), 3000);