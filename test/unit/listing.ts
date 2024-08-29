import { ethers, Signer, toBigInt, ZeroAddress } from "ethers";
import hre from "hardhat";
import {
  deployErc1155Token,
  deployErc20Token,
  deployErc721Token,
  deployMarketplace,
  grantWhitelisterRole,
  whitelistCurrencyTokens,
} from "../utils";
import {
  Marketplace,
  MyToken,
  MyTokenNFT,
  SemiFungible,
} from "../../typechain-types";
const { expect } = require("chai");
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Deployments ", function () {
  let owner: Signer,
    otherAccount: Signer,
    ownerAddress: string,
    platformFeeRecipientAddress: string,
    erc20Token: MyToken,
    erc20TokenAddress: string,
    alternativeCurrency: MyToken,
    alternativeCurrencyAddress: string,
    otherAccountAddress: string,
    erc721Token: MyTokenNFT,
    SoulBoundNft: MyTokenNFT,
    erc721TokenAddress: string,
    SoulBoundNftTokenAddress: string,
    platformFeeRecipient: Signer,
    erc115Token: SemiFungible,
    listingContract: any,
    erc1155TokenAddress: string,
    listingContractAddress: string;
  before(async function () {
    [owner, platformFeeRecipient, otherAccount] = await hre.ethers.getSigners();
    ownerAddress = await owner.getAddress();
    otherAccountAddress = await otherAccount.getAddress();
    platformFeeRecipientAddress = await platformFeeRecipient.getAddress();
    //   Deploy erc20 Token
    erc20Token = await deployErc20Token(owner, ownerAddress);
    erc20Token.waitForDeployment();
    erc20TokenAddress = await erc20Token.getAddress();

    //Deploy Alternative Currency
    alternativeCurrency = await deployErc20Token(owner, ownerAddress);
    alternativeCurrency.waitForDeployment();
    alternativeCurrencyAddress = await alternativeCurrency.getAddress();
    await alternativeCurrency
      .connect(owner)
      .transfer(
        otherAccountAddress,
        toBigInt("100000000000000000000000000000000")
      );

    // deploy erc721 token
    erc721Token = await deployErc721Token(owner, ownerAddress);
    erc721Token.waitForDeployment();

    erc721TokenAddress = await erc721Token.getAddress();

    // deploy soulBound Nft token
    SoulBoundNft = await deployErc721Token(owner, ownerAddress);
    SoulBoundNft.waitForDeployment();

    SoulBoundNftTokenAddress = await erc721Token.getAddress();

    // deploy erc1155 token
    erc115Token = await deployErc1155Token(owner, ownerAddress);
    erc115Token.waitForDeployment();
    erc1155TokenAddress = await erc115Token.getAddress();

    listingContract = await deployMarketplace(
      owner,
      ownerAddress,
      platformFeeRecipientAddress,
      SoulBoundNftTokenAddress
    );
    listingContractAddress = await listingContract.getAddress();

    const tokens = [ZeroAddress];
    const status = [true];
    await grantWhitelisterRole(listingContract, owner, ownerAddress);

    const whitelistTx = await whitelistCurrencyTokens(
      listingContract,
      owner,
      tokens,
      status
    );
  });

  describe("Erc721 ", function () {
    it("Create listing for erc721 Token", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(1);
      const listing = await listingContract.listings(0);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
      const startTime = (await time.latest()) + 10;
      const listingId = 0;
      const quantityToList = 1;
      const buyoutPricePerToken = BigInt(10000000000000);
      const currencyToAccept = ZeroAddress;

      const updateListingTx = await listingContract
        .connect(owner)
        .updateListing(
          listingId,
          quantityToList,
          buyoutPricePerToken,
          currencyToAccept,
          startTime
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(1);
      const listing = await listingContract.listings(0);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(quantityToList);
      expect(listing.currency).to.equal(currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
    });

    it("cancel listing", async function () {
      const listingId = 0;

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListing(listingId);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(1);
      const listing = await listingContract.listings(0);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.startTime).to.equal(0);
      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };

      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc721ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(2);
      const listing = await listingContract.listings(1);
      expect(listing.listingId).to.equal(1);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 1;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = 1;
      const currency = listingParams.currencyToAccept;
      const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
      await time.increaseTo(startTime + 20);
      const ownershipBeforeApproval = await erc721Token.ownerOf(
        listingParams.tokenId
      );
      expect(ownershipBeforeApproval).to.equal(ownerAddress);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const ownershipAfterApproval = await erc721Token.ownerOf(
        listingParams.tokenId
      );
      expect(ownershipAfterApproval).to.equal(otherAccountAddress);
    });
  });
  describe("Erc1155 ", function () {
    it("Create listing for erc1155 Token", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 10, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();

      const createErc1155ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();
      expect(totalListings).to.equal(3);
      const listing = await listingContract.listings(2);
      expect(listing.listingId).to.equal(2);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
      const startTime = (await time.latest()) + 10;
      const listingId = 2;
      const quantityToList = 100;
      const buyoutPricePerToken = BigInt(10000000);
      const currencyToAccept = ZeroAddress;

      const updateListingTx = await listingContract
        .connect(owner)
        .updateListing(
          listingId,
          quantityToList,
          buyoutPricePerToken,
          currencyToAccept,
          startTime
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(3);
      const listing = await listingContract.listings(2);
      expect(listing.listingId).to.equal(2);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(quantityToList);
      expect(listing.currency).to.equal(currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
    });

    it("cancel listing", async function () {
      const listingId = 2;

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListing(listingId);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(3);
      const listing = await listingContract.listings(2);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.startTime).to.equal(0);
      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc1155ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(4);
      const listing = await listingContract.listings(3);
      expect(listing.listingId).to.equal(3);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 3;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = 100;
      const currency = listingParams.currencyToAccept;
      const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
      await time.increaseTo(startTime + 20);
      const balanceOfOwnerBefore = await erc115Token.balanceOf(ownerAddress, 1);
      expect(balanceOfOwnerBefore).to.equal(10000000000);
      const balanceOfBuyerBefore = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );
      expect(balanceOfBuyerBefore).to.equal(0);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const balanceOfBuyerAfter = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );
      expect(balanceOfBuyerAfter).to.equal(100);
    });
  });
  describe("Buy with Tokens ", function () {
    it("Whitelist Tokens", async function () {
      const tokens = [alternativeCurrencyAddress];
      const status = [true];

      const contractStatusBefore =
        await listingContract.whitelistedCurrencyTokens(
          alternativeCurrencyAddress
        );
      await grantWhitelisterRole(listingContract, owner, ownerAddress);

      expect(contractStatusBefore).to.equal(false);
      const whitelistTx = await whitelistCurrencyTokens(
        listingContract,
        owner,
        tokens,
        status
      );
      const contractStatusAfter =
        await listingContract.whitelistedCurrencyTokens(
          alternativeCurrencyAddress
        );
      expect(contractStatusAfter).to.equal(true);
    });
    it("buy erc721 Token with alternative currency  ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 2, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc721ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(5);
      const listing = await listingContract.listings(4);
      expect(listing.listingId).to.equal(4);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 4;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = 1;
      const currency = listingParams.currencyToAccept;
      const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
      await time.increaseTo(startTime + 20);
      const nftOwnerBefore = await erc721Token.ownerOf(2);
      expect(nftOwnerBefore).to.equal(ownerAddress);
      // approve currency token
      const approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      await approveCurrencyTx.wait();
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice);

      const nftOwnerAfter = await erc721Token.ownerOf(2);
      expect(nftOwnerAfter).to.equal(otherAccountAddress);
    });
    it("buy erc1155 Token with alternative currency  ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc1155ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(6);
      const listing = await listingContract.listings(5);
      expect(listing.listingId).to.equal(5);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 5;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = 100;
      const currency = listingParams.currencyToAccept;
      const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
      await time.increaseTo(startTime + 20);
      const balanceOfOwnerBefore = await erc115Token.balanceOf(ownerAddress, 1);
      expect(balanceOfOwnerBefore).to.equal(9999999900);
      const balanceOfBuyerBefore = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );
      expect(balanceOfBuyerBefore).to.equal(100);
      // approve currency token
      const approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      await approveCurrencyTx.wait();
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice);

      const balanceOfBuyerAfter = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );
      expect(balanceOfBuyerAfter).to.equal(200);
    });
  });
  describe("Bulk Erc721 listing ", function () {
    it("Create Bulk listing for erc721 Token", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenIds: [3, 4, 5, 6, 7, 8, 9], //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: [1, 1, 1, 1, 1, 1, 1], //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: [10000, 20000, 30000, 40000, 10000, 10000, 10000], //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract.createMultipleListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(13);
      const listing1 = await listingContract.listings(6);
      expect(listing1.listingId).to.equal(6);
      expect(listing1.tokenOwner).to.equal(ownerAddress);
      expect(listing1.assetContract).to.equal(erc721TokenAddress);
      expect(listing1.tokenId).to.equal(listingParams.tokenIds[0]);
      expect(listing1.startTime).to.equal(startTime);
      expect(listing1.quantity).to.equal(listingParams.quantityToList[0]);
      expect(listing1.currency).to.equal(listingParams.currencyToAccept);
      expect(listing1.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[0]
      );

      const listing2 = await listingContract.listings(7);
      expect(listing2.listingId).to.equal(7);
      expect(listing2.tokenOwner).to.equal(ownerAddress);
      expect(listing2.assetContract).to.equal(erc721TokenAddress);
      expect(listing2.tokenId).to.equal(listingParams.tokenIds[1]);
      expect(listing2.startTime).to.equal(startTime);
      expect(listing2.quantity).to.equal(listingParams.quantityToList[1]);
      expect(listing2.currency).to.equal(listingParams.currencyToAccept);
      expect(listing2.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[1]
      );
      const listing3 = await listingContract.listings(8);
      expect(listing3.listingId).to.equal(8);
      expect(listing3.tokenOwner).to.equal(ownerAddress);
      expect(listing3.assetContract).to.equal(erc721TokenAddress);
      expect(listing3.tokenId).to.equal(listingParams.tokenIds[2]);
      expect(listing3.startTime).to.equal(startTime);
      expect(listing3.quantity).to.equal(listingParams.quantityToList[2]);
      expect(listing3.currency).to.equal(listingParams.currencyToAccept);
      expect(listing3.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[2]
      );

      const listing4 = await listingContract.listings(9);
      expect(listing4.listingId).to.equal(9);
      expect(listing4.tokenOwner).to.equal(ownerAddress);
      expect(listing4.assetContract).to.equal(erc721TokenAddress);
      expect(listing4.tokenId).to.equal(listingParams.tokenIds[3]);
      expect(listing4.startTime).to.equal(startTime);
      expect(listing4.quantity).to.equal(listingParams.quantityToList[3]);
      expect(listing4.currency).to.equal(listingParams.currencyToAccept);
      expect(listing4.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[3]
      );

      const listing5 = await listingContract.listings(10);
      expect(listing5.listingId).to.equal(10);
      expect(listing5.tokenOwner).to.equal(ownerAddress);
      expect(listing5.assetContract).to.equal(erc721TokenAddress);
      expect(listing5.tokenId).to.equal(listingParams.tokenIds[4]);
      expect(listing5.startTime).to.equal(startTime);
      expect(listing5.quantity).to.equal(listingParams.quantityToList[4]);
      expect(listing5.currency).to.equal(listingParams.currencyToAccept);
      expect(listing5.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[4]
      );
    });
    it("update listing parameters", async function () {
      const startTime = (await time.latest()) + 10;
      const listingId = 6;
      const quantityToList = 1;
      const buyoutPricePerToken = BigInt(1000000000);
      const currencyToAccept = ZeroAddress;

      const updateListingTx = await listingContract
        .connect(owner)
        .updateListing(
          listingId,
          quantityToList,
          buyoutPricePerToken,
          currencyToAccept,
          startTime
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(13);
      const listing = await listingContract.listings(6);
      expect(listing.listingId).to.equal(6);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.startTime).to.equal(startTime);
      expect(listing.quantity).to.equal(quantityToList);
      expect(listing.currency).to.equal(currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
    });

    it("cancel listing", async function () {
      const listingId = 6;

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListing(listingId);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(13);
      const listing = await listingContract.listings(6);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.startTime).to.equal(0);
      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const startTime = (await time.latest()) + 10;

      const listingIds = [7, 12];
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = [1, 1];
      const currency = ZeroAddress;
      const totalPrice = [20000 * quantityToBuy[0], 10000 * quantityToBuy[1]];
      const totalValue = totalPrice[0]+totalPrice[1]
      await time.increaseTo(startTime + 20);
      const ownershipBeforeApproval = await erc721Token.ownerOf(4);
      expect(ownershipBeforeApproval).to.equal(ownerAddress);
      const buyTx = await listingContract
        .connect(otherAccount)
        .bulkBuy(listingIds, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalValue,
        });

      const ownershipAfterApproval = await erc721Token.ownerOf(
        4
      );
      expect(ownershipAfterApproval).to.equal(otherAccountAddress);
    });
  });
});
