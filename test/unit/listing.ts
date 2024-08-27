import { ethers, Signer } from "ethers";
import hre from "hardhat";
import {
  deployErc1155Token,
  deployErc20Token,
  deployErc721Token,
  deployMarketplace,
  whitelistTokens,
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
    erc20Token: MyToken,
    erc20TokenAddress: string,
    alternativeCurrency: MyToken,
    alternativeCurrencyAddress: string,
    otherAccountAddress: string,
    erc721Token: MyTokenNFT,
    erc721TokenAddress: string,
    platformFeeRecipient: Signer,
    erc115Token: SemiFungible,
    listingContract: Marketplace,
    erc1155TokenAddress: string,
    listingContractAddress: string;
  before(async function () {
    [owner, platformFeeRecipient, otherAccount] = await hre.ethers.getSigners();
    ownerAddress = await owner.getAddress();
    otherAccountAddress = await otherAccount.getAddress();
    //   Deploy erc20 Token
    erc20Token = await deployErc20Token(owner, ownerAddress);
    erc20Token.waitForDeployment();
    erc20TokenAddress = await erc20Token.getAddress();

    //Deploy Alternative Currency
    alternativeCurrency = await deployErc20Token(owner, ownerAddress);
    alternativeCurrency.waitForDeployment();
    alternativeCurrencyAddress = await alternativeCurrency.getAddress();

    // deploy erc721 token
    erc721Token = await deployErc721Token(owner, ownerAddress);
    erc721Token.waitForDeployment();

    erc721TokenAddress = await erc721Token.getAddress();

    // deploy erc1155 token
    erc115Token = await deployErc1155Token(owner, ownerAddress);
    erc115Token.waitForDeployment();
    erc1155TokenAddress = await erc115Token.getAddress();

    listingContract = await deployMarketplace(owner, ownerAddress);
    listingContractAddress = await listingContract.getAddress();
    listingContract.initialize(ownerAddress, platformFeeRecipient, 500);
  });

  describe("Erc721 ", function () {
    it("Create listing for erc721 Token", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: "0x0000000000000000000000000000000000000000", //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      console.log("🚀 ~ approveTx:", approveTx);

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
      const currencyToAccept = "0x0000000000000000000000000000000000000000";

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
      console.log("🚀 ~ listing:", listing);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.startTime).to.equal(0);
      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      console.log("🚀 ~ approveTx:", approveTx);

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
        currencyToAccept: "0x0000000000000000000000000000000000000000", //address currencyToAccept;
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
      console.log("🚀 ~ totalListings:", totalListings);

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
      const currencyToAccept = "0x0000000000000000000000000000000000000000";

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
      console.log("🚀 ~ listing:", listing);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.startTime).to.equal(0);
      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const startTime = (await time.latest()) + 10;
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        startTime: startTime, //  startTime;
        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      console.log("🚀 ~ approveTx:", approveTx);

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
  // describe("Buy with Tokens ", function () {
  //   it("Whitelist Tokens", async function () {
  //     const tokens = [alternativeCurrencyAddress];
  //     const status = [true];
  //     const contractStatusBefore = await listingContract.whitelistedTokens(
  //       alternativeCurrencyAddress
  //     );
  //     expect(contractStatusBefore).to.equal(false);
  //     const whitelistTx = await whitelistTokens(
  //       listingContract,
  //       owner,
  //       tokens,
  //       status
  //     );
  //     const contractStatusAfter = await listingContract.whitelistedTokens(
  //       alternativeCurrencyAddress
  //     );
  //     expect(status).to.equal(true);
  //   });
  //   it("buy erc721 Token with alternative currency  ", async function () {
  //     const startTime = (await time.latest()) + 10;
  //     const listingParams = {
  //       assetContract: erc721TokenAddress, //address assetContract;
  //       tokenId: 1, //uint256 ;
  //       startTime: startTime, //  startTime;
  //       quantityToList: 100, //uint256 quantityToList;
  //       currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
  //       buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
  //     };
  //     const approveTx = await erc721Token
  //       .connect(owner)
  //       .setApprovalForAll(listingContractAddress, true);
  //     await approveTx.wait();
  //     console.log("🚀 ~ approveTx:", approveTx);

  //     const createErc721ListingTx = await listingContract.createListing(
  //       listingParams
  //     );
  //     const totalListings = await listingContract.totalListings();

  //     expect(totalListings).to.equal(4);
  //     const listing = await listingContract.listings(3);
  //     expect(listing.listingId).to.equal(3);
  //     expect(listing.tokenOwner).to.equal(ownerAddress);
  //     expect(listing.assetContract).to.equal(erc1155TokenAddress);
  //     expect(listing.tokenId).to.equal(listingParams.tokenId);
  //     expect(listing.startTime).to.equal(startTime);
  //     expect(listing.quantity).to.equal(listingParams.quantityToList);
  //     expect(listing.currency).to.equal(listingParams.currencyToAccept);
  //     expect(listing.buyoutPricePerToken).to.equal(
  //       listingParams.buyoutPricePerToken
  //     );
  //     const listingId = 3;
  //     const buyFor = await otherAccount.getAddress();
  //     const quantityToBuy = 100;
  //     const currency = listingParams.currencyToAccept;
  //     const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
  //     await time.increaseTo(startTime + 20);
  //     const balanceOfOwnerBefore = await erc115Token.balanceOf(ownerAddress, 1);
  //     expect(balanceOfOwnerBefore).to.equal(10000000000);
  //     const balanceOfBuyerBefore = await erc115Token.balanceOf(
  //       otherAccountAddress,
  //       1
  //     );
  //     expect(balanceOfBuyerBefore).to.equal(0);
  //     const buyTx = await listingContract
  //       .connect(otherAccount)
  //       .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
  //         value: totalPrice,
  //       });

  //     const balanceOfBuyerAfter = await erc115Token.balanceOf(
  //       otherAccountAddress,
  //       1
  //     );
  //     expect(balanceOfBuyerAfter).to.equal(100);
  //   });
  //   it("buy erc1155 Token with alternative currency  ", async function () {
  //     const startTime = (await time.latest()) + 10;
  //     const listingParams = {
  //       assetContract: alternativeCurrencyAddress, //address assetContract;
  //       tokenId: 1, //uint256 ;
  //       startTime: startTime, //  startTime;
  //       quantityToList: 100, //uint256 quantityToList;
  //       currencyToAccept: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", //address currencyToAccept;
  //       buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
  //     };
  //     const approveTx = await erc721Token
  //       .connect(owner)
  //       .setApprovalForAll(listingContractAddress, true);
  //     await approveTx.wait();
  //     console.log("🚀 ~ approveTx:", approveTx);

  //     const createErc1155ListingTx = await listingContract.createListing(
  //       listingParams
  //     );
  //     const totalListings = await listingContract.totalListings();

  //     expect(totalListings).to.equal(4);
  //     const listing = await listingContract.listings(3);
  //     expect(listing.listingId).to.equal(3);
  //     expect(listing.tokenOwner).to.equal(ownerAddress);
  //     expect(listing.assetContract).to.equal(alternativeCurrencyAddress);
  //     expect(listing.tokenId).to.equal(listingParams.tokenId);
  //     expect(listing.startTime).to.equal(startTime);
  //     expect(listing.quantity).to.equal(listingParams.quantityToList);
  //     expect(listing.currency).to.equal(listingParams.currencyToAccept);
  //     expect(listing.buyoutPricePerToken).to.equal(
  //       listingParams.buyoutPricePerToken
  //     );
  //     const listingId = 3;
  //     const buyFor = await otherAccount.getAddress();
  //     const quantityToBuy = 100;
  //     const currency = listingParams.currencyToAccept;
  //     const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
  //     await time.increaseTo(startTime + 20);
  //     const balanceOfOwnerBefore = await erc115Token.balanceOf(ownerAddress, 1);
  //     expect(balanceOfOwnerBefore).to.equal(10000000000);
  //     const balanceOfBuyerBefore = await erc115Token.balanceOf(
  //       otherAccountAddress,
  //       1
  //     );
  //     const approveCurrencyTx = await alternativeCurrency;
  //     expect(balanceOfBuyerBefore).to.equal(0);
  //     const buyTx = await listingContract
  //       .connect(otherAccount)
  //       .buy(listingId, buyFor, quantityToBuy, currency, totalPrice);

  //     const balanceOfBuyerAfter = await erc115Token.balanceOf(
  //       otherAccountAddress,
  //       1
  //     );
  //     expect(balanceOfBuyerAfter).to.equal(100);
  //   });
  // });
});
