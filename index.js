var vorpal = require('vorpal')();

let url;
vorpal.command('set-url <url>', 'set the amqp url')
    .action(function (args, callback) {
        this.log(`set-url + args[0]: ${args.url}`);
        url = args.url;
        callback('set url successful');
    });

vorpal.command('get-url', 'get the amqp url')
    .action(function (args, callback) {
        this.log(`${url}`);
        callback();
    });



vorpal
    .delimiter('seneca-cli$')
    .show();

