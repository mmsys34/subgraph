import {
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";

import { ERC20 } from "../../generated/MorphoBlue/ERC20";
import { ERC20NameBytes } from "../../generated/MorphoBlue/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/MorphoBlue/ERC20SymbolBytes";
import { Token } from "../../generated/schema";
import { fetchUsdTokenPrice } from "../fetchUsdTokenPrice";

import { exponentToBigDecimal } from "./constants";

const USDCf = Address.fromString(
  "0x5e65b6B04fbA51D95409712978Cb91E99d93aE73"
).toHexString();
const USDf = Address.fromString(
  "0xd7d43ab7b365f0d0789aE83F4385fA710FfdC98F"
).toHexString();
const BTCf = Address.fromString(
  "0x208d09d2a6Dd176e3e95b3F0DE172A7471C5B2d6"
).toHexString();
const ETHf = Address.fromString(
  "0x059A77239daFa770977DD9f1E98632C3E4559848"
).toHexString();
const ankrF = Address.fromString(
  "0xe132751AB5A14ac0bD3Cb40571a9248Ee7a2a9EA"
).toHexString();
const wFLOW = Address.fromString(
  "0xe0fd0a2A4C2E59a479AaB0cF44244E355C508766"
).toHexString();

/**
 * This file contains the TokenClass, which acts as
 * a wrapper for the Token entity making it easier to
 * use in mappings and get info about the token.
 *
 * Schema Version:  3.1.0
 * SDK Version:     1.0.6
 * Author(s):
 *  - @dmelotik
 *  - @dhruv-chauhan
 */

export class TokenManager {
  private _INVALID_TOKEN_DECIMALS: i32 = 0;
  private _UNKNOWN_TOKEN_VALUE: string = "unknown";

  private _token!: Token;
  private event!: ethereum.Event;

  constructor(
    tokenAddress: Bytes,
    event: ethereum.Event,
    tokenType: string | null = null
  ) {
    let _token = Token.load(tokenAddress);
    if (!_token) {
      _token = new Token(tokenAddress);
      // _token.name = this.fetchTokenName(Address.fromBytes(tokenAddress));
      // _token.symbol = this.fetchTokenSymbol(Address.fromBytes(tokenAddress));
      // _token.decimals = this.fetchTokenDecimals(
      //   Address.fromBytes(tokenAddress)
      // );
      _token.name = this.fetchTokenInfo1(Address.fromBytes(tokenAddress));
      _token.symbol = this.fetchTokenInfo2(Address.fromBytes(tokenAddress));
      _token.decimals = this.fetchTokenInfo3(Address.fromBytes(tokenAddress));
      if (tokenType) {
        _token.type = tokenType;
      }
      _token.save();
    }

    this._token = _token;
    this.event = event;
  }

  getToken(): Token {
    return this._token;
  }

  getDecimals(): i32 {
    return this._token.decimals;
  }

  updatePrice(): BigDecimal {
    this._token.lastPriceUSD = fetchUsdTokenPrice(
      Address.fromBytes(this._token.id)
    );

    this._token.lastPriceBlockNumber = this.event.block.number;
    this._token.save();
    return this._token.lastPriceUSD!;
  }

  getPriceUSD(): BigDecimal {
    if (this._token.lastPriceUSD) {
      return this._token.lastPriceUSD!;
    }
    return BigDecimal.zero();
  }

  // convert token amount to USD value
  getAmountUSD(amount: BigInt): BigDecimal {
    return amount
      .toBigDecimal()
      .div(exponentToBigDecimal(this.getDecimals()))
      .times(this.getPriceUSD());
  }
  ////////////////////
  ///// Creators /////
  ////////////////////

  private fetchTokenInfo1(tokenAddress: Address): string {
    let name = "";

    if (tokenAddress.equals(Address.fromString(USDCf))) {
      name = "USDCf(USDC) mock coin";
    } else if (tokenAddress.equals(Address.fromString(USDf))) {
      name = "USDf(PYUSD) mock coin";
    } else if (tokenAddress.equals(Address.fromString(BTCf))) {
      name = "BTCf(wBTC) mock coin";
    } else if (tokenAddress.equals(Address.fromString(ETHf))) {
      name = "ETHf(wETH) mock coin";
    } else if (tokenAddress.equals(Address.fromString(wFLOW))) {
      name = "wrapped FLOW mock coin";
    } else if (tokenAddress.equals(Address.fromString(ankrF))) {
      name = "ankr.FLOW mock coin";
    } else {
      name = "MockToken";
    }

    return name;
  }

  private fetchTokenInfo2(tokenAddress: Address): string {
    let symbol = "";

    if (tokenAddress.equals(Address.fromString(USDCf))) {
      symbol = "USDCf";
    } else if (tokenAddress.equals(Address.fromString(USDf))) {
      symbol = "USDf";
    } else if (tokenAddress.equals(Address.fromString(BTCf))) {
      symbol = "BTCf";
    } else if (tokenAddress.equals(Address.fromString(ETHf))) {
      symbol = "ETHf";
    } else if (tokenAddress.equals(Address.fromString(ankrF))) {
      symbol = "ankr.FLOW";
    } else if (tokenAddress.equals(Address.fromString(wFLOW))) {
      symbol = "wFLOW";
    } else {
      symbol = "MOCK";
    }

    return symbol;
  }

  private fetchTokenInfo3(tokenAddress: Address): i32 {
    let decimals = 0;

    if (tokenAddress.equals(Address.fromString(USDCf))) {
      decimals = 6;
    } else if (tokenAddress.equals(Address.fromString(USDf))) {
      decimals = 6;
    } else if (tokenAddress.equals(Address.fromString(BTCf))) {
      decimals = 8;
    } else if (tokenAddress.equals(Address.fromString(ETHf))) {
      decimals = 18;
    } else if (tokenAddress.equals(Address.fromString(ankrF))) {
      decimals = 18;
    } else if (tokenAddress.equals(Address.fromString(wFLOW))) {
      decimals = 18;
    } else {
      decimals = 18;
    }

    return decimals;
  }

  private fetchTokenSymbol(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

    // try types string and bytes32 for symbol
    let symbolValue = this._UNKNOWN_TOKEN_VALUE;
    const symbolResult = contract.try_symbol();
    if (!symbolResult.reverted) {
      return symbolResult.value;
    }

    // non-standard ERC20 implementation
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!this.isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }

    return symbolValue;
  }

  private fetchTokenName(tokenAddress: Address): string {
    const contract = ERC20.bind(tokenAddress);
    const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

    // try types string and bytes32 for name
    let nameValue = this._UNKNOWN_TOKEN_VALUE;
    const nameResult = contract.try_name();
    if (!nameResult.reverted) {
      return nameResult.value;
    }

    // non-standard ERC20 implementation
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!this.isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }

    return nameValue;
  }

  private fetchTokenDecimals(tokenAddress: Address): i32 {
    const contract = ERC20.bind(tokenAddress);

    // try types uint8 for decimals
    const decimalResult = contract.try_decimals();
    if (!decimalResult.reverted) {
      const decimalValue = decimalResult.value;
      return decimalValue;
    }
    return this._INVALID_TOKEN_DECIMALS as i32;
  }

  private isNullEthValue(value: string): boolean {
    return (
      value ==
      "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
  }
}
