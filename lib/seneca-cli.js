const jsonic = require('jsonic');
const promisify = require('./promisify');
const vorpal = require('vorpal')();
const fsAutocomplete = require('vorpal-autocomplete-fs');
const { patchData } = require('./utilties');
const fs = require('fs');
const path = require('path');


const seneca = require('seneca').use('seneca-amqp-transport');

promisify.bind(seneca)();

const options = {
    type: 'amqp',
    url: undefined,
    pin: undefined
};
vorpal.command('set-url <url>', 'set the amqp url')
    .action(function setUrl(args, callback) {
        options.url = args.url;
        callback(`set url successful ${args.url}`);
    });

vorpal.command('get-url', 'get the amqp url')
    .action(function getUrl(args, callback) {
        if (options.url) {
            this.log(`${options.url}`);
        }
        else {
            this.log('url is not set');
        }
        callback();
    });

vorpal.command('set-pin <pin>', 'set the pin')
    .action(function setUrl(args, callback) {
        options.pin = args.pin;
        callback(`set pin successful ${args.pin}`);
    });


vorpal.command('get-pin', 'get the pin')
    .action(function getUrl(args, callback) {
        if (options.url) {
            this.log(`${options.pin}`);
        }
        else {
            this.log('pin is not set');
        }
        callback();
    });

vorpal.command('act <pattern> [data]', 'seneca act command')
    .action(function setUrl(args, callback) {
        const pattern = args.pattern;
        let data = args.data;
        data = patchData(data);

        this.log(pattern);
        this.log(data);
        const dataObj = jsonic(data);

        seneca.clientAsync(options)
            .then((senecaClient) => {
                return senecaClient.actAsync(pattern, dataObj);
            })
            .then((result) => {
                return callback(result);
            })
            .catch((err) => {
                this.log(err);
            });
    });

vorpal.command('load [file]')
    .autocomplete(fsAutocomplete())
    .action(function loadFile(args, callback) {
        this.log(args.file);
        const filePath = path.join(__dirname, '../', args.file);
        this.log(`filePath: ${filePath}`);
        let jsonObj = require(filePath); //eslint-disable-line
        this.log(jsonObj);

        callback();
    });

vorpal
    .delimiter('seneca-cli$')
    .show();

