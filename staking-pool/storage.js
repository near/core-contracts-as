"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.storage = exports.Storage = void 0;
//import { env } from "./env";
var util_1 = require("./util/util");
/**
 * This class represents contract storage.
 *
 * It is a key-value store that is persisted on the NEAR blockchain.
 */
var Storage = /** @class */ (function () {
    function Storage() {
    }
    /**
     * Store string value under given key. Both key and value are encoded as UTF-8 strings.
     *
     * ```ts
     * storage.setString("myKey", "myValue")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @param value The value stored at a particular key in a key-value store
     */
    Storage.setString = function (key, value) {
        var key_encoded = util_1.util.stringToBytes(key);
        var value_encoded = util_1.util.stringToBytes(value);
        var storage_write_result = env.storage_write(key_encoded.byteLength, key_encoded.dataStart, value_encoded.byteLength, value_encoded.dataStart, 0);
        // TODO: handle return value?
    };
    /**
     * Get string value stored under given key. Both key and value are encoded as UTF-8 strings.
     *
     * ```ts
     * let value = storage.getString("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @returns String value stored under given key
     */
    Storage.getString = function (key) {
        return util_1.util.bytesToString(this._internalReadBytes(key));
    };
    /**
     * Store byte array under given key. Key is encoded as UTF-8 strings.
     * Byte array stored as is.
     *
     * It's convenient to use this together with `domainObject.encode()`.
     *
     * ```ts
     * let data = new Uint8Array([1,2,3])
     * storage.setBytes("myKey", data)
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @param value The value stored at a particular key in a key-value store
     */
    Storage.setBytes = function (key, value) {
        var key_encoded = util_1.util.stringToBytes(key);
        var storage_write_result = env.storage_write(key_encoded.byteLength, key_encoded.dataStart, value.byteLength, value.dataStart, 0);
        // TODO: handle return value?
    };
    /**
     * Get byte array stored under given key. Key is encoded as UTF-8 strings.
     * Byte array stored as is.
     *
     * It's convenient to use this together with `DomainObject.decode()`.
     *
     * ```ts
     * storage.getBytes("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @returns Byte array stored under given key
     */
    Storage.getBytes = function (key) {
        return this._internalReadBytes(key);
    };
    /**
     * Returns true if the given key is present in the storage.
     *
     * ```ts
     * storage.contains("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @returns True if the given key is present in the storage.
     */
    Storage.contains = function (key) {
        var key_encoded = util_1.util.stringToBytes(key);
        return bool(env.storage_has_key(key_encoded.byteLength, key_encoded.dataStart));
    };
    /**
     * Returns true if the given key is present in the storage.
     *
     * ```ts
     * // alias for method contains()
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @returns True if the given key is present in the storage.
     */
    Storage.hasKey = function (key) {
        return this.contains(key);
    };
    /**
     * Deletes a given key from the storage.
     *
     * ```ts
     * storage.delete("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     */
    Storage["delete"] = function (key) {
        var key_encoded = util_1.util.stringToBytes(key);
        env.storage_remove(key_encoded.byteLength, key_encoded.dataStart, 0);
    };
    /**
     * Stores given generic value under the key. Key is encoded as UTF-8 strings.
     * Supported types: bool, integer, string and data objects defined in model.ts.
     *
     * ```ts
     * storage.set<string>("myKey", "myValue")
     * storage.set<u16>("myKey", 123)
     * storage.set<MyCustomObject>("myKey", new MyCustomObject())
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @param value The value stored at a particular key in a key-value store
     */
    Storage.set = function (key, value) {
        if (isString()) {
            //@ts-ignore
            this.setString(key, value);
        }
        else if (isInteger()) {
            //@ts-ignore
            this.setString(key, value.toString());
        }
        else {
            //@ts-ignore
            this.setBytes(key, encode(value));
        }
    };
    /**
     * Gets given generic value stored under the key. Key is encoded as UTF-8 strings.
     * Supported types: string and data objects defined in model.ts.
     * Please use getPrimitive<T> for getting primitives with a default value, and
     * getSome<T> for primitives and non-primitives in case it's known that a particular key exists.
     *
     * ```ts
     * storage.get<string>("myKey")
     * storage.get<u16>("myKey")
     * storage.get<MyCustomObject>("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @param defaultValue The default value if the key is not available
     * @returns A value of type T stored under the given key.
     */
    Storage.get = function (key, defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        if (isString()) {
            var strValue = this.getString(key);
            return strValue == null
                ? defaultValue
                : util_1.util.parseFromString(strValue);
        }
        else {
            var byteValue = this.getBytes(key);
            return byteValue == null
                ? defaultValue
                : util_1.util.parseFromBytes(byteValue);
        }
    };
    /**
     * Gets given generic value stored under the key. Key is encoded as UTF-8 strings.
     * Supported types: bool, integer.
     *
     * This function will throw if type T can not be cast as integer
     *
     * ```ts
     * storage.getPrimitive<string>("myKey", "default value")
     * storage.getPrimitive<u16>("myKey", 123)
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @param defaultValue The default value if the key is not available
     * @returns A value of type T stored under the given key.
     */
    Storage.getPrimitive = function (key, defaultValue) {
        if (!isInteger() && !isString()) {
            ERROR("Operation not supported. Please use storage.get<T> for non-primitives");
        }
        var strValue = this.getString(key);
        return strValue == null
            ? defaultValue
            : util_1.util.parseFromString(strValue);
    };
    /**
     * Gets given generic value stored under the key. Key is encoded as UTF-8 strings.
     * Supported types: bool, integer, string and data objects defined in model.ts.
     *
     * This function will throw if the key does not exist in the storage.
     *
     * ```ts
     * storage.getSome<string>("myKey")
     * storage.getSome<u16>("myKey")
     * ```
     *
     * @param key The unique identifier associated with a value in a key-value store
     * @returns A value of type T stored under the given key.
     */
    Storage.getSome = function (key) {
        if (!this.hasKey(key)) {
            assert(false, "Key '" + key + "' is not present in the storage");
        }
        if (isString() || isInteger()) {
            return util_1.util.parseFromString(this.getString(key));
        }
        else {
            return util_1.util.parseFromBytes(this.getBytes(key));
        }
    };
    Storage._internalReadBytes = function (key) {
        var key_encoded = util_1.util.stringToBytes(key);
        var res = env.storage_read(key_encoded.byteLength, key_encoded.dataStart, 0);
        if (res == 1) {
            return util_1.util.read_register(0);
        }
        else {
            return null;
        }
    };
    __decorate([
        inline
    ], Storage, "hasKey");
    return Storage;
}());
exports.Storage = Storage;
exports.storage = Storage;
