# Nexus Mutual ERC721 Subgraph

This is an ERC721 Subgraph that indexes Nexus Mutual NFTs representing covers and staking deposits. The implementation is based on OpenZeppelin's
[ERC721](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol),
[ERC721Enumerable](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/extensions/ERC721Enumerable.sol)
and
[ERC721Metadata](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/extensions/IERC721Metadata.sol)
contracts and Nexus Mutual's [CoverNFT](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/cover/CoverNFT.sol) and [Cover](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/cover/Cover.sol) contracts.

## Entities

### Contract

The Contract entity keeps track of minted tokens, name and symbol for individual ERC721 instances which can currently be either [CoverNFT](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/cover/CoverNFT.sol) or [StakingPool](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/staking/StakingPool.sol) instances created by the [Cover](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/cover/Cover.sol) contract.

```graphql
type Contract @entity {
  # The ID is simply the contract address.
  id: ID!

  # The name of the ERC721 contract
  name: String

  # The symbol of the ERC721 contract
  symbol: String

  # The list tokens
  mintedTokens: [Token!]! @derivedFrom(field: "contract")
}
```

### Token

The Token entity can represent any ERC721 token in Nexus Mutual. It keeps track of its transfers, contract, uri owner and tokenId.

```graphql
type Token @entity {
  # To ensure the uniqueness of the ID (not to be confused with the tokenId
  # property of ERC721), it is composed of the tokenId and its contract
  # address, since multiple contracts can have the same tokenId.
  id: ID!

  # The tokenId as you'd expect it from the ERC721 contract
  tokenId: BigInt!

  # The owner of this token
  owner: Owner

  # An optional URI
  uri: String

  # The list of transfers this token was subject to
  transfers: [Transfer!]! @derivedFrom(field: "token")

  # The contract this token belongs to
  contract: Contract
}
```

### Owner

The Owner entity represents an address that can own Nexus Mutual ERC721 tokens. It keeps track of balances and owned tokens.

```graphql
type Owner @entity {
  # The address of the token owner
  id: ID!

  # The list of owned tokens
  ownedTokens: [Token!]! @derivedFrom(field: "owner")

  # The number of tokens the address owns
  balance: BigInt
}

```

### Transfer

The Transfer entity represents transfers of ERC721 tokens used by the Nexus Mutual contracts, currently covers and staking deposits.

```graphql
type Transfer @entity {
  # To ensure the uniqueness of the ID, it is composed of the transaction hash
  # and the transaction log index, since multiple transfers can be part of the
  # same transaction.
  id: ID!

  # The token that has been transfered
  token: Token!

  # The address the token was transfered from
  from: Owner

  # The address the token was transfered to
  to: Owner

  # The timestamp of the block in which the transfer took place
  timestamp: BigInt!

  # The block number when the transfer took place
  block: BigInt!

  # The hash of the transfer transaction
  transactionHash: String!
}

```


### StakingPool

The StakingPool entity links the pool id, which is a number auotmatically assigned by the [Cover](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/cover/Cover.sol) contract when a new pool is created, and the address of the deployed [StakingPool](https://github.com/NexusMutual/smart-contracts/blob/nexus-v2/contracts/modules/staking/StakingPool.sol) contract. The ERC721 tokens used by the pool represent staking deposits with the exception of tokenId 0 which is owned by the pool manager. Transfering the token with tokenId 0 means transfering the rights to manage the pool to the receiving address.

```graphql
type StakingPool @entity {
  # The id chronologically increases with each new staking pool that is created.
  # The first staking pool id is 0.
  id: ID!

  # The ERC721 contract of the staking pool
  contract: Contract

  # The timestamp of the block in which the pool was created
  timestamp: BigInt!

  # The block number when the pool was created
  block: BigInt!

  # The hash of the pool creation transaction
  transactionHash: String!
}
```
