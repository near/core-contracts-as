import { u128, VMContext, Context, env, util } from "near-sdk-as";


const INPUT = "USER123";
const DEPOSIT = u128.from(10);

beforeEach(() => {
  VMContext.setAttached_deposit(DEPOSIT);
  VMContext.setInput(INPUT);
});

describe("Function call", () => {
  it("should contain input", () => {

    let a = Context.accountLockedBalance
    expect(a).toBe(u128.from(12))

    env.input(0);
    let len = env.register_len(0);
    let expected = new Uint8Array(len as u32);
    // @ts-ignore;
    env.read_register(0, expected.dataStart);
    expect(expected).toStrictEqual(util.stringToBytes(INPUT))
  });

  it("should have correct deposit", () => {
    expect(Context.attachedDeposit).toStrictEqual(DEPOSIT);
  });
});