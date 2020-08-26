---
name: Bounty Template
about: contract bounty
title: "[Bounty]"
labels: Bounty
assignees: willemneal

---

# NEAR Bounty Terms

Before beginning work on the bounty, you must submit a proposal. Only if your proposal is accepted will you be able to claim the reward of the bounty. *In particular for this bounty you need to detail the testing you will use other than unit testing.*

## Description

For this bounty you will need to rewrite the [voting contract](https://github.com/near/core-contracts/tree/master/voting) into AssemblyScript making sure that they have the same API.

## Context

With the new addition of `includeBytes` function in AssemblyScript, near-sdk-as should have enough parity with near-sdk-rs that the core smart contracts should be able to be written in AS. The trickiest part of the contracts are the cross contract calls. Rust provides a high level abstraction for working with promises. For an example for batch promise calls in AS see the [sdk's repo here](https://github.com/near/near-sdk-as/blob/master/assembly/__tests__/sentences.ts).

## Relevant repos or issues

[Core Contracts](https://github.com/near/core-contracts)

## API
Same as rust contracts.

# Acceptance Criteria
* [  ] Including the unit tests
* [  ] Test contracts another way

# Bounty
200 DAI
