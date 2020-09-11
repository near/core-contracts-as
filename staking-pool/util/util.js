"use strict";
exports.__esModule = true;
exports.util = void 0;
var env_1 = require("./env");
var util;
(function (util) {
    /**
     * Convert a given string into a Uint8Array encoded as UTF-8.
     * @param s data to encode
     */
    function stringToBytes(s) {
        var len = String.UTF8.byteLength(s, true) - 1;
        var bytes = new Uint8Array(len);
        memory.copy(bytes.dataStart, toUTF8(s), len);
        return bytes;
    }
    util.stringToBytes = stringToBytes;
    /**
     * Decode an UTF-8 encoded Uint8Array into a string.
     * @param bytes array to decode
     */
    function bytesToString(bytes) {
        if (bytes == null) {
            return null;
        }
        return String.UTF8.decode(uint8ArrayToBuffer(bytes), true);
    }
    util.bytesToString = bytesToString;
    /**
     * Calculates the byte length of the specified UTF-8 string, which can optionally be null terminated.
     * @param str data
     * @param nullTerminated
     */
    function UTF8Length(str, nullTerminated) {
        if (nullTerminated === void 0) { nullTerminated = false; }
        return String.UTF8.byteLength(str, nullTerminated);
    }
    util.UTF8Length = UTF8Length;
    /**
     * Parses the given bytes array to return a value of the given generic type.
     * Supported types: bool, integer, string and data objects defined in model.ts.
     *
     * @param bytes Bytes to parse. Bytes must be not null.
     * @returns A parsed value of type T.
     */
    function parseFromBytes(bytes) {
        return decode(bytes);
    }
    util.parseFromBytes = parseFromBytes;
    /**
     * Parses the given string to return a value of the given generic type.
     * Supported types: bool, integer, string and data objects defined in model.ts.
     *
     * @param s String to parse. Must be not null.
     * @returns A parsed value of type T.
     */
    function parseFromString(s) {
        if (isString()) {
            //@ts-ignore
            return s;
        }
        else if (isInteger()) {
            if (isBoolean()) {
                //@ts-ignore
                return (s == "true");
            }
            else if (isSigned()) {
                //@ts-ignore
                return I64.parseInt(s);
            }
            else {
                //@ts-ignore
                return U64.parseInt(s);
            }
        }
        else {
            //@ts-ignore v will have decode method
            return decode(stringToBytes(s));
        }
    }
    util.parseFromString = parseFromString;
    /**
     * @package
     * Reads contents of a register into a Uint8Array.
     * Note: this is a low level function and should be used directly only rarely from client code.
     *
     * @param register_id Id of register to read from
     */
    function read_register(register_id) {
        var value_len = env_1.env.register_len(register_id);
        var value = new Uint8Array(value_len);
        env_1.env.read_register(0, value.dataStart);
        return value;
    }
    util.read_register = read_register;
    function read_register_string(register_id) {
        var res = util.bytesToString(util.read_register(register_id));
        return res != null ? res : "";
    }
    util.read_register_string = read_register_string;
    // Private helpers
    function toUTF8(str, nullTerminated) {
        if (nullTerminated === void 0) { nullTerminated = false; }
        return changetype(String.UTF8.encode(str, nullTerminated));
    }
    function uint8ArrayToBuffer(array) {
        return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);
    }
    /**
     * Unsafe function that alocates a new type T with no initialization.
     */
    function allocate() {
        return changetype(__alloc(offsetof(), idof()));
    }
    util.allocate = allocate;
})(util = exports.util || (exports.util = {}));
