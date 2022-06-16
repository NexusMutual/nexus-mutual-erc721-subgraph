import { log, BigInt } from '@graphprotocol/graph-ts';
import { StakingPool } from "../generated/schema";
import { ERC721 as ERC721Template } from "../generated/templates";
import {
  ERC721,
  Transfer as TransferEvent
} from "../generated/templates/ERC721/ERC721";
import {
  StakingPoolCreated as StakingPoolCreatedEvent
} from '../generated/Cover/Cover';
import { Contract, Owner, Token, Transfer } from '../generated/schema';

export function handleTransfer(event: TransferEvent): void {
  log.debug('Transfer detected. From: {} | To: {} | TokenID: {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.params.tokenId.toHexString(),
  ]);

  let tokenKeyID = event.params.tokenId
    .toHexString()
    .concat(':'.concat(event.address.toHexString()));
  let transferKeyID = event.transaction.hash
    .toHexString()
    .concat(':'.concat(event.transactionLogIndex.toHexString()));

  let previousOwner = Owner.load(event.params.from.toHexString());
  let newOwner = Owner.load(event.params.to.toHexString());
  let token = Token.load(tokenKeyID);
  let transfer = Transfer.load(transferKeyID);
  let contract = Contract.load(event.address.toHexString());
  let instance = ERC721.bind(event.address);

  if (previousOwner == null) {
    previousOwner = new Owner(event.params.from.toHexString());

    previousOwner.balance = BigInt.fromI32(0);
  } else {
    let prevBalance = previousOwner.balance;
    if (prevBalance > BigInt.fromI32(0)) {
      previousOwner.balance = prevBalance.minus(BigInt.fromI32(1));
    }
  }

  if (newOwner == null) {
    newOwner = new Owner(event.params.to.toHexString());
    newOwner.balance = BigInt.fromI32(1);
  } else {
    let prevBalance = newOwner.balance;
    newOwner.balance = prevBalance.plus(BigInt.fromI32(1));
  }

  if (token == null) {
    token = new Token(tokenKeyID);
    token.tokenId = event.params.tokenId;
    token.contract = event.address.toHexString();

    let uri = instance.try_tokenURI(event.params.tokenId);
    if (!uri.reverted) {
      token.uri = uri.value;
    }
  }

  token.owner = event.params.to.toHexString();

  if (transfer == null) {
    transfer = new Transfer(transferKeyID);
    transfer.token = tokenKeyID;
    transfer.from = event.params.from.toHexString();
    transfer.to = event.params.to.toHexString();
    transfer.timestamp = event.block.timestamp;
    transfer.block = event.block.number;
    transfer.transactionHash = event.transaction.hash.toHexString();
  }

  if (contract == null) {
    contract = new Contract(event.address.toHexString());
  }

  let name = instance.try_name();
  if (!name.reverted) {
    contract.name = name.value;
  }

  let symbol = instance.try_symbol();
  if (!symbol.reverted) {
    contract.symbol = symbol.value;
  }

  let totalSupply = instance.try_totalSupply();
  if (!totalSupply.reverted) {
    contract.totalSupply = totalSupply.value;
  }

  previousOwner.save();
  newOwner.save();
  token.save();
  transfer.save();
  contract.save();
}

export function handleStakingPoolCreation(
  event: StakingPoolCreatedEvent
): void {
  let stakingPool = new StakingPool(event.params.poolId.toString());
  let contract = new Contract(event.params.stakingPoolAddress.toHexString());
  stakingPool.contract = contract.id;
  stakingPool.timestamp = event.block.timestamp;
  stakingPool.block = event.block.number;
  stakingPool.transactionHash = event.transaction.hash.toHexString();

  stakingPool.save();
  contract.save();

  log.debug(
    "creating ERC721 dynamic data source at address {}",
    [event.params.stakingPoolAddress.toHexString()]
  );
  ERC721Template.create(event.params.stakingPoolAddress);
}
