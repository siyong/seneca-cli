const jsonic = require('jsonic');
const promisify = require('./promisify');
const vorpal = require('vorpal')();
const fsAutocomplete = require('vorpal-autocomplete-fs');
const { patchData } = require('./utilties');
const path = require('path');


const seneca = require('seneca').use('seneca-amqp-transport');

promisify.bind(seneca)();

const options = {
    type: 'amqp',
    url: undefined,
    pin: undefined
};
let loadRunnerConfig = null;
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
        const cwd = process.cwd();
        const filePath = path.join(cwd, args.file);
        this.log(`filePath: ${filePath}`);
        let jsonObj = require(filePath); //eslint-disable-line
        this.log(jsonObj);
        loadRunnerConfig = jsonObj;
        callback();
    });

vorpal.command('run', 'run the loaded json')
    .action(function getUrl(args, callback) {
        const _v = this;
        this.log(loadRunnerConfig);

        this.log(`Starting load test: ${loadRunnerConfig.name}`);
        let perLoopFnArray = [];
        const fnFactory = function (client, run) {
            _v.log(`generating fn: ${run.name}`);
            return function fn() {
                // _v.log(`running fn: ${run.name}`);
                return new Promise((resolve, reject) => {
                    let data = patchData(run.data);
                    data = jsonic(data);
                    // _v.log(`Starting run in promise: ${run.name}, ${run.pattern}, ${data}`);
                    client.actAsync(run.pattern, data)
                        .then((res) => {
                            // _v.log(`End run: ${run.name}, wait ${run.delayNext}`);
                            setTimeout(() => {
                                return resolve(res);
                            }, run.delayNext);
                        })
                        .catch(err => reject(err));
                });
            };
        };

        const oneInstanceRunner = function () {
            return seneca.clientAsync(options)
                .then((senecaClient) => {
                    _v.log('setting up perLoopFn array');
                    for (let i = 0; i < loadRunnerConfig.loop; i += 1) {
                        const innerFnArray = loadRunnerConfig.runs.map(run => fnFactory(senecaClient, run));
                        /*   _v.log(`assert innerFnArray ${innerFnArray[0]}`);
                    _v.log(`assert innerFnArray ${typeof innerFnArray[0]}`); */
                        perLoopFnArray = perLoopFnArray.concat(innerFnArray);
                    }
                    return perLoopFnArray;
                })
                .then((fnArray) => {
                    _v.log('reducing..');
                    return fnArray.reduce((p, fn) => p.then(() => fn()), Promise.resolve());
                })
                .then(() => {
                    _v.log('completed..');
                });
        };

        const runnerPromiseArray = [];
        for (let i = 0; i < loadRunnerConfig.instances; i += 1) {
            runnerPromiseArray.push(oneInstanceRunner());
        }
        Promise.all(runnerPromiseArray)
            .then(() => {
                callback();
            });
    });

vorpal.command('cwd', 'display current directory')
    .action(function cwdFn(args, callback) {
        const cwd = process.cwd();
        callback(cwd);
    });

vorpal
    .delimiter('seneca-cli$')
    .show();

