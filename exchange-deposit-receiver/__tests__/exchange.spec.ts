import { Runtime, Account, stateSize } from "near-sdk-as/runtime";
import { DEFAULT_GAS } from "near-sdk-as/runtime/dist/types";


let runtime: Runtime;
let exchange: Account;
const INPUT = "USER123";
const DEPOSIT = "42";

describe("cross contract calls", () => {
  beforeEach(() => {
    runtime = new Runtime();
    exchange = runtime.newAccount("exchange",
    __dirname + "/../../build/debug/exchange-deposit-receiver.wasm");
  });

  test("single promise", () => {
    let res = exchange.call_other("exchange", "exchange_deposit", INPUT, DEFAULT_GAS, DEPOSIT);
    let call = res.calls["0"];
    expect(call.input).toBe(`"${INPUT}"`);
    expect(call.attached_deposit).toBe(DEPOSIT);
  });


});
