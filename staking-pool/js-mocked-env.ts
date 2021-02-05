var data = {
    epoch_height: 1
}

import {Storage} from "near-sdk-as"

//mocked "env" fns for the Wasm contract
module.exports = {
    abort(_msg, _file, line, column) {
        console.error("abort called at index.ts:" + line + ":" + column);
    },
    get: Storage.get,
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

    storage_has_key(key) {
    },
    storage_read(key) {
    },
    register_len(index) {
    },
    read_register(index) {
    },
    epoch_height() {
        return data.epoch_height
    },
    account_locked_balance(num) {
    },
    account_balance(num) {

    },
    attached_deposit(num) {
    }
    , storage_write(arg) { } //env/imports/_storage_write (type $t28)))
    , storage_remove(arg) { } //env/imports/_storage_remove (type $t21)))
    , log_utf8(arg) { } //env/imports/_log_utf8 (type $t9)))
    , predecessor_account_id(arg) { } //env/imports/_predecessor_account_id (type $t8)))
    , current_account_id(arg) { } //env/imports/_current_account_id (type $t8)))
    , promise_results_count(arg) { } //env/imports/_promise_results_count (type $t11)))
    , promise_result(arg) { } //env/imports/_promise_result (type $t20)))
    , input(arg) { } //env/imports/_input (type $t8)))
    , panic(arg) { } //env/imports/_panic (type $t3)))
    , value_return(arg) { } //env/imports/_value_return (type $t9)))
}
