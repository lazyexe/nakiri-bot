// const { WAProto } = require('baileys');
const { Command, commands } = require('../../utils/command.js');
// const { metadl } = require('../../utils/scrape.js');
// const { deletedMessagesLog } = require('../../utils/globalMap.js');
const { default: axios } = require('axios');
const { tmpfiles } = require('../../utils/uploader.js');
const currencyInstance = require('../../utils/currency.js');

Command({
  name: 'test',
  description: 'Test command',
  alias: ['test'],
  // eslint-disable-next-line no-unused-vars
  run: async ({ sock, m, options }) => {
    console.log(await currencyInstance.validateCurrencyCirculation());
  }
});
