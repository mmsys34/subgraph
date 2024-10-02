import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { ChainlinkPriceFeed } from "../generated/MorphoBlue/ChainlinkPriceFeed";

const ankrFlow = Address.fromString(
  "0x1b97100ea1d7126c4d60027e231ea4cb25314bdb"
).toHexString();

const wflow = Address.fromString(
  "0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e"
).toHexString();

const usdPriceFeeds = new Map<string, string>().set(
  wflow,
  Address.fromString("0x0a4224D61A53932C920F673fE6c4B70Fb0D54345").toHexString()
);

const relatePriceFeeds = new Map<string, string>().set(
  ankrFlow,
  Address.fromString("0xA363e8627b5b4A5DC1cf6b5f228665C5CafF770f").toHexString()
);

function fetchPriceFromFeed(feedAddress: Address): BigDecimal {
  const chainlinkPriceFeed = ChainlinkPriceFeed.bind(feedAddress);
  return chainlinkPriceFeed
    .latestRoundData()
    .getAnswer()
    .toBigDecimal()
    .div(
      BigInt.fromString("10")
        .pow(chainlinkPriceFeed.decimals() as u8)
        .toBigDecimal()
    );
}

function fetchPairPriceFromFeed(feedAddress: Address): BigDecimal {
  const chainlinkPriceFeed = ChainlinkPriceFeed.bind(feedAddress);
  return chainlinkPriceFeed.price().toBigDecimal();
}

export function fetchUsdTokenPrice(tokenAddress: Address): BigDecimal {
  if (usdPriceFeeds.has(tokenAddress.toHexString())) {
    const chainlinkPriceFeed = Address.fromString(
      usdPriceFeeds.get(tokenAddress.toHexString())
    );

    return fetchPriceFromFeed(chainlinkPriceFeed);
  } else if (relatePriceFeeds.has(tokenAddress.toHexString())) {
    const flowPriceFeed = Address.fromString(usdPriceFeeds.get(wflow));
    const flowPrice = fetchPriceFromFeed(flowPriceFeed);

    const pairPriceFeed = Address.fromString(
      relatePriceFeeds.get(tokenAddress.toHexString())
    );
    const pairPrice = fetchPairPriceFromFeed(pairPriceFeed);

    return flowPrice
      .times(pairPrice)
      .div(BigInt.fromString("10").pow(36).toBigDecimal());
  }

  return BigDecimal.zero();
}
