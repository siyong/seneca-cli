/**
 * Promisify seneca
 */
'use strict';
const _ = require('lodash');

module.exports = function exportPromisifySeneca() {
    const seneca = this;
    const senecaProto = Object.getPrototypeOf(seneca);

    senecaProto.closeAsync = function closeAsync() {
        return new Promise((resolve, reject) => {
            this.close((err) => {
                return (err && reject(err)) || resolve(1);
            });
        });
    };

    senecaProto.actAsync = function actAsync(...args) {
        return new Promise(function handleActAsync(resolve, reject) {
            function callback(err, out) {
                /**
                 * the result of out is alway in the form of
                 * {
                 *      success: bool,
                 *      data: Object
                 * }
                 */
                // err ? reject(err) : resolve(out);
                if (err) {
                    return reject(err);
                }

                if (out
                    && Object.prototype.hasOwnProperty.call(out, 'success')
                    && Object.prototype.hasOwnProperty.call(out, 'data')
                ) {
                    if (out.success === true) {
                        return resolve(out.data);
                    }
                    return reject(new Error(out.data));
                }

                // for other cases: resolve out for compatible
                return resolve(out);
            }

            const callArgs = _.concat(args, callback);

            try {
                this.act.call(this, ...callArgs);
            }
            catch (e) {
                if (e && e.code && !e.message) {
                    e.message = e.code;
                }
                reject(e);
            }
        }.bind(this));
    };

    senecaProto.readyAsync = senecaProto.readyAsync || function readyAsync() {
        return new Promise(function handleReadyAsync(resolve, reject) {
            this.ready(function readyAsyncHandleReady(err) {
                return (err && reject(err)) || resolve(this);
            });
        }.bind(this));
    };

    senecaProto.clientAsync = senecaProto.clientAsync || function clientAsync(...args) {
        this.client(...args);
        return new Promise(function handleReadyAsync(resolve, reject) {
            this.ready((err) => {
                return (err && reject(err)) || resolve(this);
            });
        }.bind(this));
    };
};