"use strict";
exports.__esModule = true;
var data = {
    epoch_height: 1
};
var near_sdk_as_1 = require("near-sdk-as");
//mocked "env" fns for the Wasm contract
module.exports = {
    abort: function (_msg, _file, line, column) {
        console.error("abort called at index.ts:" + line + ":" + column);
    },
    get: near_sdk_as_1.Storage.get,
    /*
    (import "env" "abort" (func $~lib/builtins/abort (type $t15)))
    (import "env" "storage_has_key" (func env/imports/_storage_has_key (type $t20)))
    (import "env" "storage_read" (func env/imports/_storage_read (type $t21)))
    (import "env" "register_len" (func env/imports/_register_len (type $t13)))
    (import "env" "read_register" (func env/imports/_read_register (type $t9)))
    (import "env" "epoch_height" (func env/imports/_epoch_height (type $t11)))
    (import "env" "account_locked_balance" (func env/imports/_account_locked_balance (type $t8)))
    (import "env" "account_balance" (func env/imports/_account_balance (type $t8)))
    (import "env" "attached_deposit" (func env/imports/_attached_deposit (type $t8)))
    (import "env" "storage_write" (func env/imports/_storage_write (type $t28)))
    (import "env" "storage_remove" (func env/imports/_storage_remove (type $t21)))
    (import "env" "log_utf8" (func env/imports/_log_utf8 (type $t9)))
    (import "env" "predecessor_account_id" (func env/imports/_predecessor_account_id (type $t8)))
    (import "env" "current_account_id" (func env/imports/_current_account_id (type $t8)))
    (import "env" "promise_results_count" (func env/imports/_promise_results_count (type $t11)))
    (import "env" "promise_result" (func env/imports/_promise_result (type $t20)))
    (import "env" "input" (func env/imports/_input (type $t8)))
    (import "env" "panic" (func env/imports/_panic (type $t3)))
    (import "env" "value_return" (func env/imports/_value_return (type $t9)))
    */
    storage_has_key: function (key) {
    },
    storage_read: function (key) {
    },
    register_len: function (index) {
    },
    read_register: function (index) {
    },
    epoch_height: function () {
        return data.epoch_height;
    },
    account_locked_balance: function (num) {
    },
    account_balance: function (num) {
    },
    attached_deposit: function (num) {
    },
    storage_write: function (arg) { } //env/imports/_storage_write (type $t28)))
    ,
    storage_remove: function (arg) { } //env/imports/_storage_remove (type $t21)))
    ,
    log_utf8: function (arg) { } //env/imports/_log_utf8 (type $t9)))
    ,
    predecessor_account_id: function (arg) { } //env/imports/_predecessor_account_id (type $t8)))
    ,
    current_account_id: function (arg) { } //env/imports/_current_account_id (type $t8)))
    ,
    promise_results_count: function (arg) { } //env/imports/_promise_results_count (type $t11)))
    ,
    promise_result: function (arg) { } //env/imports/_promise_result (type $t20)))
    ,
    input: function (arg) { } //env/imports/_input (type $t8)))
    ,
    panic: function (arg) { } //env/imports/_panic (type $t3)))
    ,
    value_return: function (arg) { } //env/imports/_value_return (type $t9)))
};
