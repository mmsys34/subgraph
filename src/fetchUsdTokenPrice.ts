import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

import { ChainlinkPriceFeed } from "../generated/MorphoBlue/ChainlinkPriceFeed";

const wflow = Address.fromString(
  "0xe0fd0a2a4c2e59a479aab0cf44244e355c508766"
).toHexString();

const usdcf = Address.fromString(
  "0x5e65b6b04fba51d95409712978cb91e99d93ae73"
).toHexString();

const usdf = Address.fromString(
  "0xd7d43ab7b365f0d0789ae83f4385fa710ffdc98f"
).toHexString();

const btcf = Address.fromString(
  "0x208d09d2a6dd176e3e95b3f0de172a7471c5b2d6"
).toHexString();

const ethf = Address.fromString(
  "0x059a77239dafa770977dd9f1e98632c3e4559848"
).toHexString();

const ankrflow = Address.fromString(
  "0xe132751ab5a14ac0bd3cb40571a9248ee7a2a9ea"
).toHexString();

const usdPriceFeeds = new Map<string, string>()
  .set(
    wflow,
    Address.fromString(
      "0x0a4224D61A53932C920F673fE6c4B70Fb0D54345"
    ).toHexString()
  )
  .set(
    usdcf,
    Address.fromString(
      "0xBEfB2b2B48fdEece45253b2eD008540a23d25AFE"
    ).toHexString()
  )
  .set(
    usdf,
    Address.fromString(
      "0x2e9EcBf2D63094A08c9ff5eb20A4EbBFfBFc12eD"
    ).toHexString()
  )
  .set(
    btcf,
    Address.fromString(
      "0xe65b5154aE462fD08faD32B2A85841803135894b"
    ).toHexString()
  )
  .set(
    ethf,
    Address.fromString(
      "0x2b40Fc7326E3bF1DB3571e414d006Ee42d49C427"
    ).toHexString()
  )
  .set(
    ankrflow,
    Address.fromString(
      "0x017efB6272Dc61DCcfc9a757c29Fd99187c9d208"
    ).toHexString()
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
  }

  return BigDecimal.zero();
}
