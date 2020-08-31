# core-contracts-as

The [core contracts](https://github.com/near/core-contracts) implemented in AssemblyScript.

## build

```bash
yarn build
# or
npm run build
```

Add `--target debug` for a debug build.

## test

### setup

To setup the repo for testing using the Rust contracts and for reference use `yarn setup` or `node setup.sh`

To run all the tests:

```bash
yarn test
# or
npm run test
```

To run just one test, `yarn asp -f <file_pattern>` or `yarn jest -f <file_pattern>`