import { ethers, parseUnits, Signer, toBigInt, ZeroAddress } from "ethers";
import hre from "hardhat";
import {
  deployErc1155Token,
  deployErc1400Token,
  deployErc20Token,
  deployErc721Token,
  deployMarketplace,
  deployRoyaltyErc721Token,
  grantWhitelisterRole,
  whitelistCurrencyTokens,
  whitelistListingTokens,
} from "../utils";
import {
  Marketplace,
  MyToken,
  MyTokenNFT,
  RoyaltyNFT,
  SemiFungible,
} from "../../typechain-types";
const { expect } = require("chai");
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Deployments ", function () {
  let owner: Signer,
    otherAccount: Signer,
    userOneAccount: Signer,
    userOneAccountAddress: string,
    ownerAddress: string,
    platformFeeRecipientAddress: string,
    erc20Token: MyToken,
    erc1400Token: any,
    erc1400TokenAddress: string,
    erc20TokenAddress: string,
    alternativeCurrency: MyToken,
    alternativeCurrencyAddress: string,
    otherAccountAddress: string,
    erc721Token: MyTokenNFT,
    kycSoulBoundNft: MyTokenNFT,
    kybSoulBoundNft: MyTokenNFT,
    royaltyNFT: RoyaltyNFT,
    royaltyNFTAddress: string,
    erc721TokenAddress: string,
    kycSoulBoundNftTokenAddress: string,
    kybSoulBoundNftTokenAddress: string,
    platformFeeRecipient: Signer,
    royaltyFeeRecipient: Signer,
    royaltyFeeRecipientAddress: string,
    erc115Token: SemiFungible,
    listingContract: any,
    erc1155TokenAddress: string,
    listingContractAddress: string;

  let erc20Two: MyToken;
  let erc20TwoAddress: string;
  let erc20Three: MyToken;
  let erc20ThreeAddress: string;

  let erc20Four: MyToken;
  let erc20FourAddress: string;

  let erc20Five: MyToken;
  let erc20FiveAddress: string;

  let erc20Six: MyToken;
  let erc20SixAddress: string;

  before(async function () {
    [
      owner,
      platformFeeRecipient,
      otherAccount,
      userOneAccount,
      royaltyFeeRecipient,
    ] = await hre.ethers.getSigners();
    ownerAddress = await owner.getAddress();
    otherAccountAddress = await otherAccount.getAddress();
    userOneAccountAddress = await userOneAccount.getAddress();
    platformFeeRecipientAddress = await platformFeeRecipient.getAddress();
    royaltyFeeRecipientAddress = await royaltyFeeRecipient.getAddress();
    //   Deploy erc20 Token
    erc20Token = await deployErc20Token(owner, ownerAddress);
    erc20Token.waitForDeployment();

    erc20TokenAddress = await erc20Token.getAddress();
    erc20Two = await deployErc20Token(owner, ownerAddress);
    erc20TwoAddress = await erc20Two.getAddress();
    erc20Three = await deployErc20Token(owner, ownerAddress);
    erc20ThreeAddress = await erc20Three.getAddress();

    erc20Four = await deployErc20Token(owner, ownerAddress);
    erc20FourAddress = await erc20Four.getAddress();

    erc20Five = await deployErc20Token(owner, ownerAddress);
    erc20FiveAddress = await erc20Five.getAddress();

    erc20Six = await deployErc20Token(owner, ownerAddress);
    erc20SixAddress = await erc20Six.getAddress();

    //deploy erc1400 Token
    erc1400Token = await deployErc1400Token(owner, ownerAddress);
    erc1400TokenAddress = await erc1400Token.getAddress();

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

    await erc20Token
      .connect(owner)
      .transfer(userOneAccountAddress, toBigInt("100000000000000"));

    // deploy erc721 token
    erc721Token = await deployErc721Token(owner, ownerAddress);
    erc721Token.waitForDeployment();

    erc721TokenAddress = await erc721Token.getAddress();

    royaltyNFT = await deployRoyaltyErc721Token(
      owner,
      ownerAddress,
      royaltyFeeRecipientAddress
    );
    royaltyNFT.waitForDeployment();

    royaltyNFTAddress = await royaltyNFT.getAddress();

    // deploy kycSoulBound Nft token
    kycSoulBoundNft = await deployErc721Token(owner, ownerAddress);
    kycSoulBoundNft.waitForDeployment();

    kycSoulBoundNftTokenAddress = await kycSoulBoundNft.getAddress();
    console.log(
      "🚀 ~ kycSoulBoundNftTokenAddress:",
      kycSoulBoundNftTokenAddress
    );

    kybSoulBoundNft = await deployErc721Token(owner, ownerAddress);
    kybSoulBoundNft.waitForDeployment();

    kybSoulBoundNftTokenAddress = await kybSoulBoundNft.getAddress();

    // deploy erc1155 token
    erc115Token = await deployErc1155Token(owner, ownerAddress);
    erc115Token.waitForDeployment();
    erc1155TokenAddress = await erc115Token.getAddress();

    listingContract = await deployMarketplace(
      owner,
      ownerAddress,
      platformFeeRecipientAddress,
      kycSoulBoundNftTokenAddress,
      kybSoulBoundNftTokenAddress
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

    const whitelistAssets = await whitelistListingTokens(
      listingContract,
      owner,
      [
        erc721TokenAddress,
        erc1155TokenAddress,
        erc1400TokenAddress,
        erc20TokenAddress,
        royaltyNFTAddress,
      ],
      [true, true, true, true, true]
    );
  });

  describe("Erc721 ", function () {
    it("Create listing for erc721 Token", async function () {
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(1);
      const listing = await listingContract.listings(0);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
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
          currencyToAccept
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(1);
      const listing = await listingContract.listings(0);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
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

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 2, //uint256 ;

        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };

      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc721ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(2);
      const listing = await listingContract.listings(1);
      expect(listing.listingId).to.equal(1);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
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
      const ownershipBeforeApproval = await erc721Token.ownerOf(
        listingParams.tokenId
      );
      const provider = hre.ethers.provider;
      const balanceBefore = await provider.getBalance(
        platformFeeRecipientAddress
      );
      const balanceBeforeOwner = await provider.getBalance(ownerAddress);
      const balanceBeforeOther = await provider.getBalance(otherAccountAddress);

      expect(ownershipBeforeApproval).to.equal(ownerAddress);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const ownershipAfterApproval = await erc721Token.ownerOf(
        listingParams.tokenId
      );

      const balanceAfter = await provider.getBalance(
        platformFeeRecipientAddress
      );
      const balanceAfterOwner = await provider.getBalance(ownerAddress);

      const balanceAfterOther = await provider.getBalance(otherAccountAddress);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(balanceAfterOwner).to.be.greaterThan(balanceBeforeOwner);
      expect(balanceAfterOther).to.be.lessThan(balanceBeforeOther);
      expect(ownershipAfterApproval).to.equal(otherAccountAddress);
    });
  });
  describe("Erc1155 ", function () {
    it("Create listing for erc1155 Token", async function () {
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;

        quantityToList: 10, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();

      whitelistListingTokens(
        listingContract,
        owner,
        [erc1155TokenAddress],
        [true]
      );

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
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
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
          currencyToAccept
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(3);
      const listing = await listingContract.listings(2);
      expect(listing.listingId).to.equal(2);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
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

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc1155 Token with Eth ", async function () {
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 1, //uint256 ;

        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc1155ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(4);
      const listing = await listingContract.listings(3);
      expect(listing.listingId).to.equal(3);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
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

      const listingAfter = await listingContract.listings(3);
      console.log("🚀 ~ listingAfter:", listingAfter);
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
      const listingParams = {
        assetContract: erc721TokenAddress, //address assetContract;
        tokenId: 3, //uint256 ;

        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc721ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(5);
      const listing = await listingContract.listings(4);
      expect(listing.listingId).to.equal(4);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
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
      const nftOwnerBefore = await erc721Token.ownerOf(3);
      expect(nftOwnerBefore).to.equal(ownerAddress);
      // approve currency token
      const approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      await approveCurrencyTx.wait();
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice);

      const nftOwnerAfter = await erc721Token.ownerOf(3);
      expect(nftOwnerAfter).to.equal(otherAccountAddress);
    });
    it("buy erc1155 Token with alternative currency  ", async function () {
      const listingParams = {
        assetContract: erc1155TokenAddress, //address assetContract;
        tokenId: 4, //uint256 ;

        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };
      const approveTx = await erc115Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc1155ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(6);
      const listing = await listingContract.listings(5);
      expect(listing.listingId).to.equal(5);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1155TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
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
      const balanceOfOwnerBefore = await erc115Token.balanceOf(ownerAddress, 4);
      expect(balanceOfOwnerBefore).to.equal(10000000000);
      const balanceOfBuyerBefore = await erc115Token.balanceOf(
        otherAccountAddress,
        4
      );
      expect(balanceOfBuyerBefore).to.equal(0);
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
        4
      );
      expect(balanceOfBuyerAfter).to.equal(100);
    });
  });
  describe("Bulk Erc721 listing ", function () {
    it("Create Bulk listing for erc721 Token", async function () {
      const listingParams = {
        assetContract: [
          erc721TokenAddress,
          erc721TokenAddress,
          erc721TokenAddress,
          erc721TokenAddress,
          erc721TokenAddress,
          erc721TokenAddress,
          erc721TokenAddress,
        ], //address assetContract;
        tokenIds: [10, 4, 5, 6, 7, 8, 9], //uint256 ;

        quantityToList: [1, 1, 1, 1, 1, 1, 1], //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: [10000, 20000, 30000, 40000, 10000, 10000, 10000], //uint256 buyoutPricePerToken;
        isERC20: [false, false, false, false, false, false, false, false],
      };
      const approveTx = await erc721Token
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createMultipleListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(13);
      const listing1 = await listingContract.listings(6);
      expect(listing1.listingId).to.equal(6);
      expect(listing1.tokenOwner).to.equal(ownerAddress);
      expect(listing1.assetContract).to.equal(erc721TokenAddress);
      expect(listing1.tokenId).to.equal(listingParams.tokenIds[0]);

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

      expect(listing5.quantity).to.equal(listingParams.quantityToList[4]);
      expect(listing5.currency).to.equal(listingParams.currencyToAccept);
      expect(listing5.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[4]
      );
    });
    it("update listing parameters", async function () {
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
          currencyToAccept
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(13);
      const listing = await listingContract.listings(6);
      expect(listing.listingId).to.equal(6);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc721TokenAddress);
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

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc721 Token with Eth ", async function () {
      const listingIds = [7, 12];
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = [1, 1];
      const currency = [ZeroAddress, ZeroAddress];
      const totalPrice = [20000 * quantityToBuy[0], 10000 * quantityToBuy[1]];
      const totalValue = totalPrice[0] + totalPrice[1];
      const ownershipBeforeApproval = await erc721Token.ownerOf(4);
      expect(ownershipBeforeApproval).to.equal(ownerAddress);
      const buyTx = await listingContract
        .connect(otherAccount)
        .bulkBuy(listingIds, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalValue,
        });

      const ownershipAfterApproval = await erc721Token.ownerOf(4);
      expect(ownershipAfterApproval).to.equal(otherAccountAddress);
    });
  });
  describe("ERC20 Listing", function () {
    it("Create listing for erc20 Token", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: 1000, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();

      const createERC20ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();
      expect(totalListings).to.equal(14);
      const listing = await listingContract.listings(13);
      expect(listing.listingId).to.equal(13);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc20TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
      const listingId = 13;
      const quantityToList = 100;
      const buyoutPricePerToken = BigInt(10000000);
      const currencyToAccept = ZeroAddress;

      const updateListingTx = await listingContract
        .connect(owner)
        .updateListing(
          listingId,
          quantityToList,
          buyoutPricePerToken,
          currencyToAccept
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(14);
      const listing = await listingContract.listings(13);
      expect(listing.listingId).to.equal(13);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc20TokenAddress);
      expect(listing.quantity).to.equal(quantityToList);
      expect(listing.currency).to.equal(currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
    });

    it("cancel listing", async function () {
      const listingId = 13;

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListing(listingId);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(14);
      const listing = await listingContract.listings(13);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc20 Token with Eth ", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: parseUnits("100"), //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 10, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(15);
      const listing = await listingContract.listings(14);
      expect(listing.listingId).to.equal(14);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc20Token);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 14;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = parseUnits("10");
      const currency = listingParams.currencyToAccept;
      const totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);
      const balanceOfOwnerBefore = await erc20Token.balanceOf(ownerAddress);
      expect(balanceOfOwnerBefore.toString()).to.equal(
        "999999999999999999999999999999999999999999999999999999999900000000000000"
      );
      const balanceOfBuyerBefore = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );

      expect(balanceOfBuyerBefore).to.equal(100);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const balanceOfBuyerAfter = await erc20Token.balanceOf(
        otherAccountAddress
      );
      const listingAfter = await listingContract.listings(14);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("10000000000000000000");
    });
  });

  describe("ERC1400 Listing", function () {
    it("Create listing for erc1400 Token", async function () {
      const listingParams = {
        assetContract: erc1400TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: 1000, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc1400Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();

      const createERC1400ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();
      expect(totalListings).to.equal(16);
      const listing = await listingContract.listings(15);
      expect(listing.listingId).to.equal(15);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1400TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
    });
    it("update listing parameters", async function () {
      const listingId = 15;
      const quantityToList = 100;
      const buyoutPricePerToken = BigInt(10000000);
      const currencyToAccept = ZeroAddress;

      const updateListingTx = await listingContract
        .connect(owner)
        .updateListing(
          listingId,
          quantityToList,
          buyoutPricePerToken,
          currencyToAccept
        );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(16);
      const listing = await listingContract.listings(15);
      expect(listing.listingId).to.equal(15);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1400TokenAddress);
      expect(listing.quantity).to.equal(quantityToList);
      expect(listing.currency).to.equal(currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(buyoutPricePerToken);
    });

    it("cancel listing", async function () {
      const listingId = 15;

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListing(listingId);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(16);
      const listing = await listingContract.listings(15);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);
    });

    it("buy erc1400 Token with Eth ", async function () {
      const listingParams = {
        assetContract: erc1400TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: parseUnits("100"), //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 10, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc1400Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract.createListing(
        listingParams
      );
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(17);
      const listing = await listingContract.listings(16);
      expect(listing.listingId).to.equal(16);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc1400TokenAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 16;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = parseUnits("1");
      const currency = listingParams.currencyToAccept;
      const totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);
      const balanceOfOwnerBefore = await erc1400Token.balanceOf(ownerAddress);
      expect(balanceOfOwnerBefore.toString()).to.equal(
        "100000000000000000000000000000000000000000000000000000"
      );
      const balanceOfBuyerBefore = await erc1400Token.balanceOf(
        otherAccountAddress
      );
      expect(balanceOfBuyerBefore).to.equal(0);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const balanceOfBuyerAfter = await erc1400Token.balanceOf(
        otherAccountAddress
      );
      console.log("🚀 ~ balanceOfBuyerAfter:", balanceOfBuyerAfter);
      expect(balanceOfBuyerAfter).to.equal("1000000000000000000");
    });
  });

  describe("kyb kyc  Listing test", function () {
    it("Create  listing without having kyc or kyb", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = listingContract
        .connect(userOneAccount)
        .createListing(listingParams);

      await expect(createErc20ListingTx).to.revertedWithCustomError(
        listingContract,
        "NotASoulBoundOwner"
      );
    });

    it("Create  listing with kyb but user create listing not enabled ", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: true,
      };

      const transferKyb = await kybSoulBoundNft
        .connect(owner)
        .transferFrom(ownerAddress, userOneAccountAddress, 1);

      await transferKyb.wait();
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = listingContract
        .connect(userOneAccount)
        .createListing(listingParams);

      await expect(createErc20ListingTx).to.revertedWithCustomError(
        listingContract,
        "NotASoulBoundOwner"
      );
    });

    it("Create  listing with kyb but user create listing enabled ", async function () {
      const enableTx = await listingContract
        .connect(owner)
        .toggleListingState();
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: 100, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: true,
      };

      const transferKyb = await kybSoulBoundNft
        .connect(owner)
        .transferFrom(ownerAddress, userOneAccountAddress, 3);

      await transferKyb.wait();
      const approveTx = await erc20Token
        .connect(userOneAccount)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(userOneAccount)
        .createListing(listingParams);
    });
  });

  describe("Bulk cancel listing ", function () {
    it("Create Bulk listing for erc20 Token", async function () {
      const listingParams = {
        assetContract: [
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
        ], //address assetContract;
        tokenIds: [0, 0, 0, 0, 0, 0, 0], //uint256 ;

        quantityToList: [
          parseUnits("1"),
          parseUnits("1"),
          parseUnits("1"),
          parseUnits("1"),
          parseUnits("1"),
          parseUnits("1"),
          parseUnits("1"),
        ], //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: [
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
          parseUnits("0.000000001"),
        ], //uint256 buyoutPricePerToken;
        isERC20: [true, true, true, true, true, true, true, true],
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, parseUnits("7"));
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createMultipleListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(25);
      const listing1 = await listingContract.listings(18);
      expect(listing1.listingId).to.equal(18);
      expect(listing1.tokenOwner).to.equal(ownerAddress);
      expect(listing1.assetContract).to.equal(erc20TokenAddress);
      expect(listing1.tokenId).to.equal(listingParams.tokenIds[0]);

      expect(listing1.quantity).to.equal(listingParams.quantityToList[0]);
      expect(listing1.currency).to.equal(listingParams.currencyToAccept);
      expect(listing1.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[0]
      );

      const listing2 = await listingContract.listings(19);
      expect(listing2.listingId).to.equal(19);
      expect(listing2.tokenOwner).to.equal(ownerAddress);
      expect(listing2.assetContract).to.equal(erc20TokenAddress);
      expect(listing2.tokenId).to.equal(listingParams.tokenIds[1]);

      expect(listing2.quantity).to.equal(listingParams.quantityToList[1]);
      expect(listing2.currency).to.equal(listingParams.currencyToAccept);
      expect(listing2.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[1]
      );
      const listing3 = await listingContract.listings(20);
      expect(listing3.listingId).to.equal(20);
      expect(listing3.tokenOwner).to.equal(ownerAddress);
      expect(listing3.assetContract).to.equal(erc20TokenAddress);
      expect(listing3.tokenId).to.equal(listingParams.tokenIds[2]);

      expect(listing3.quantity).to.equal(listingParams.quantityToList[2]);
      expect(listing3.currency).to.equal(listingParams.currencyToAccept);
      expect(listing3.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[2]
      );

      const listing4 = await listingContract.listings(21);
      expect(listing4.listingId).to.equal(21);
      expect(listing4.tokenOwner).to.equal(ownerAddress);
      expect(listing4.assetContract).to.equal(erc20TokenAddress);
      expect(listing4.tokenId).to.equal(listingParams.tokenIds[3]);

      expect(listing4.quantity).to.equal(listingParams.quantityToList[3]);
      expect(listing4.currency).to.equal(listingParams.currencyToAccept);
      expect(listing4.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[3]
      );

      const listing5 = await listingContract.listings(22);
      expect(listing5.listingId).to.equal(22);
      expect(listing5.tokenOwner).to.equal(ownerAddress);
      expect(listing5.assetContract).to.equal(erc20TokenAddress);
      expect(listing5.tokenId).to.equal(listingParams.tokenIds[4]);

      expect(listing5.quantity).to.equal(listingParams.quantityToList[4]);
      expect(listing5.currency).to.equal(listingParams.currencyToAccept);
      expect(listing5.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[4]
      );

      const listing6 = await listingContract.listings(23);
      expect(listing6.listingId).to.equal(23);
      expect(listing6.tokenOwner).to.equal(ownerAddress);
      expect(listing6.assetContract).to.equal(erc20TokenAddress);
      expect(listing6.tokenId).to.equal(listingParams.tokenIds[5]);

      expect(listing6.quantity).to.equal(listingParams.quantityToList[5]);
      expect(listing6.currency).to.equal(listingParams.currencyToAccept);
      expect(listing6.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[5]
      );

      const listing7 = await listingContract.listings(24);
      expect(listing7.listingId).to.equal(24);
      expect(listing7.tokenOwner).to.equal(ownerAddress);
      expect(listing7.assetContract).to.equal(erc20TokenAddress);
      expect(listing7.tokenId).to.equal(listingParams.tokenIds[6]);

      expect(listing7.quantity).to.equal(listingParams.quantityToList[6]);
      expect(listing7.currency).to.equal(listingParams.currencyToAccept);
      expect(listing7.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[6]
      );

      let listingIds = [18, 19, 20, 21];

      const cancelListingTx = await listingContract
        .connect(owner)
        .cancelDirectListings(listingIds);

      const listing = await listingContract.listings(18);
      expect(listing.listingId).to.equal(0);
      expect(listing.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing.quantity).to.equal(0);
      expect(listing.currency).to.equal(ZeroAddress);
      expect(listing.buyoutPricePerToken).to.equal(0);

      const listing_2 = await listingContract.listings(19);
      expect(listing_2.listingId).to.equal(0);
      expect(listing_2.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing_2.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing_2.quantity).to.equal(0);
      expect(listing_2.currency).to.equal(ZeroAddress);
      expect(listing_2.buyoutPricePerToken).to.equal(0);

      const listing_3 = await listingContract.listings(20);
      expect(listing_3.listingId).to.equal(0);
      expect(listing_3.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing_3.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing_3.quantity).to.equal(0);
      expect(listing_3.currency).to.equal(ZeroAddress);
      expect(listing_3.buyoutPricePerToken).to.equal(0);
      const listing_4 = await listingContract.listings(21);
      expect(listing_4.listingId).to.equal(0);
      expect(listing_4.tokenOwner).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      expect(listing_4.assetContract).to.equal(
        "0x0000000000000000000000000000000000000000"
      );

      expect(listing_4.quantity).to.equal(0);
      expect(listing_4.currency).to.equal(ZeroAddress);
      expect(listing_4.buyoutPricePerToken).to.equal(0);

      listingIds = [22, 23];
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = [parseUnits("1"), parseUnits("1")];
      const currency = [ZeroAddress, ZeroAddress];
      const totalPrice = [
        (listingParams.buyoutPricePerToken[4] * quantityToBuy[0]) /
          BigInt(10 ** 18),
        (listingParams.buyoutPricePerToken[5] * quantityToBuy[1]) /
          BigInt(10 ** 18),
      ];
      console.log("🚀 ~ totalPrice:", totalPrice)
      const totalValue = totalPrice[0] + totalPrice[1];
      console.log("🚀 ~ totalValue:", totalValue)
      const ownershipBeforeApproval = await erc20Token.balanceOf(owner);
      const buyTx = await listingContract
        .connect(otherAccount)
        .bulkBuy(listingIds, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalValue,
        });

      let balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);

      expect(balanceOfBuyerAfter).to.equal("12000000000000000000");
    });
  });

  describe("Royalties Erc721 ", function () {
    it("buy royalty erc721 Token with Eth ", async function () {
      const listingParams = {
        assetContract: royaltyNFTAddress, //address assetContract;
        tokenId: 1, //uint256 ;
        quantityToList: 1, //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 100000, //uint256 buyoutPricePerToken;
        isERC20: false,
      };

      const approveTx = await royaltyNFT
        .connect(owner)
        .setApprovalForAll(listingContractAddress, true);
      await approveTx.wait();
      const createErc721ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(26);
      const listing = await listingContract.listings(25);
      expect(listing.listingId).to.equal(25);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(royaltyNFTAddress);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 25;
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = 1;
      const currency = listingParams.currencyToAccept;
      const totalPrice = listingParams.buyoutPricePerToken * quantityToBuy;
      const ownershipBeforeApproval = await royaltyNFT.ownerOf(
        listingParams.tokenId
      );
      console.log(
        "🚀 ~ ownershipBeforeApproval:",
        ownerAddress,
        ownershipBeforeApproval
      );
      const provider = hre.ethers.provider;
      const balanceBefore = await provider.getBalance(
        platformFeeRecipientAddress
      );
      const balanceBeforeOwner = await provider.getBalance(ownerAddress);
      const balanceBeforeRoyalty = await provider.getBalance(
        royaltyFeeRecipientAddress
      );
      const balanceBeforeOther = await provider.getBalance(otherAccountAddress);

      expect(ownershipBeforeApproval).to.equal(ownerAddress);
      const buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      const ownershipAfterApproval = await royaltyNFT.ownerOf(
        listingParams.tokenId
      );

      const balanceAfter = await provider.getBalance(
        platformFeeRecipientAddress
      );
      const balanceAfterOwner = await provider.getBalance(ownerAddress);
      const balanceAfterRoyalty = await provider.getBalance(
        royaltyFeeRecipientAddress
      );

      const balanceAfterOther = await provider.getBalance(otherAccountAddress);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(balanceAfterRoyalty).to.be.greaterThan(balanceBeforeRoyalty);
      expect(balanceAfterOwner).to.be.greaterThan(balanceBeforeOwner);
      expect(balanceAfterOther).to.be.lessThan(balanceBeforeOther);
      expect(ownershipAfterApproval).to.equal(otherAccountAddress);
    });
  });

  describe("Multiple Buys ERC20 Listing", function () {
    it("buy erc20 Token with Eth ", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: parseUnits("100"), //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: 10, //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(27);
      const listing = await listingContract.listings(26);
      expect(listing.listingId).to.equal(26);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc20Token);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 26;
      const buyFor = await otherAccount.getAddress();
      let quantityToBuy = parseUnits("10");
      const currency = listingParams.currencyToAccept;
      let totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);
      const balanceOfOwnerBefore = await erc20Token.balanceOf(ownerAddress);

      const balanceOfBuyerBefore = await erc115Token.balanceOf(
        otherAccountAddress,
        1
      );

      expect(balanceOfBuyerBefore).to.equal(100);
      let buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      let balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      let listingAfter = await listingContract.listings(26);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("22000000000000000000");

      buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      listingAfter = await listingContract.listings(26);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("32000000000000000000");

      quantityToBuy = parseUnits("80");
      totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);

      buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      listingAfter = await listingContract.listings(26);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("112000000000000000000");
    });

    it("buy erc20 Token with erc-20 tokens ", async function () {
      const listingParams = {
        assetContract: erc20TokenAddress, //address assetContract;
        tokenId: 0, //uint256 ;

        quantityToList: parseUnits("100"), //uint256 quantityToList;
        currencyToAccept: alternativeCurrency, //address currencyToAccept;
        buyoutPricePerToken: parseUnits("0.00001"), //uint256 buyoutPricePerToken;
        isERC20: true,
      };
      const approveTx = await erc20Token
        .connect(owner)
        .approve(listingContractAddress, listingParams.quantityToList);
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(28);
      const listing = await listingContract.listings(27);
      expect(listing.listingId).to.equal(27);
      expect(listing.tokenOwner).to.equal(ownerAddress);
      expect(listing.assetContract).to.equal(erc20Token);
      expect(listing.tokenId).to.equal(listingParams.tokenId);
      expect(listing.quantity).to.equal(listingParams.quantityToList);
      expect(listing.currency).to.equal(listingParams.currencyToAccept);
      expect(listing.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken
      );
      const listingId = 27;
      const buyFor = await otherAccount.getAddress();
      let quantityToBuy = parseUnits("10");
      const currency = listingParams.currencyToAccept;
      let totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);
      const balanceOfOwnerBefore = await erc20Token.balanceOf(ownerAddress);

      const balanceOfBuyerBefore = await erc20Token.balanceOf(
        otherAccountAddress
      );

      expect(balanceOfBuyerBefore).to.equal("112000000000000000000");

      let approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      let buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      let balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      let listingAfter = await listingContract.listings(27);

      expect(balanceOfBuyerAfter).to.equal("122000000000000000000");
      approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      listingAfter = await listingContract.listings(17);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("132000000000000000000");

      quantityToBuy = parseUnits("80");
      totalPrice =
        (BigInt(listingParams.buyoutPricePerToken) * quantityToBuy) /
        BigInt(10 ** 18);
      approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalPrice);
      buyTx = await listingContract
        .connect(otherAccount)
        .buy(listingId, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalPrice,
        });

      balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
      listingAfter = await listingContract.listings(27);

      console.log("🚀 ~ listingAfter:", listingAfter);

      expect(balanceOfBuyerAfter).to.equal("212000000000000000000");
      expect(listingAfter.quantity).to.equal(0);
    });
  });

  describe("Bulk listing Erc-20 ", function () {
    it("Create Bulk listing for erc20 Token and buying with erc20 currency", async function () {
      const listingParams = {
        assetContract: [
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
        ], //address assetContract;
        tokenIds: [0, 0, 0, 0, 0, 0, 0], //uint256 ;

        quantityToList: [
          parseUnits("100"),
          parseUnits("100"),
          parseUnits("100"),
          parseUnits("10"),
          parseUnits("100"),
          parseUnits("1000"),
          parseUnits("100"),
        ], //uint256 quantityToList;
        currencyToAccept: alternativeCurrencyAddress, //address currencyToAccept;
        buyoutPricePerToken: [
          parseUnits("0.0001"),
          parseUnits("0.0002"),
          parseUnits("0.000003"),
          parseUnits("0.000004"),
          parseUnits("0.000001"),
          parseUnits("0.000001"),
          parseUnits("0.000001"),
        ], //uint256 buyoutPricePerToken;
        isERC20: [true, true, true, true, true, true, true, true],
      };

      const approveTx = await erc20Token
        .connect(owner)
        .approve(
          listingContractAddress,
          parseUnits("100") +
            parseUnits("100") +
            parseUnits("100") +
            parseUnits("10") +
            parseUnits("100") +
            parseUnits("1000") +
            parseUnits("100")
        );
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createMultipleListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(35);
      const listing1 = await listingContract.listings(28);
      expect(listing1.listingId).to.equal(28);
      expect(listing1.tokenOwner).to.equal(ownerAddress);
      expect(listing1.assetContract).to.equal(erc20TokenAddress);
      expect(listing1.tokenId).to.equal(listingParams.tokenIds[0]);

      expect(listing1.quantity).to.equal(listingParams.quantityToList[0]);
      expect(listing1.currency).to.equal(listingParams.currencyToAccept);
      expect(listing1.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[0]
      );

      const listing2 = await listingContract.listings(29);
      expect(listing2.listingId).to.equal(29);
      expect(listing2.tokenOwner).to.equal(ownerAddress);
      expect(listing2.assetContract).to.equal(erc20TokenAddress);
      expect(listing2.tokenId).to.equal(listingParams.tokenIds[1]);

      expect(listing2.quantity).to.equal(listingParams.quantityToList[1]);
      expect(listing2.currency).to.equal(listingParams.currencyToAccept);
      expect(listing2.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[1]
      );
      const listing3 = await listingContract.listings(30);
      expect(listing3.listingId).to.equal(30);
      expect(listing3.tokenOwner).to.equal(ownerAddress);
      expect(listing3.assetContract).to.equal(erc20TokenAddress);
      expect(listing3.tokenId).to.equal(listingParams.tokenIds[2]);

      expect(listing3.quantity).to.equal(listingParams.quantityToList[2]);
      expect(listing3.currency).to.equal(listingParams.currencyToAccept);
      expect(listing3.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[2]
      );

      const listing4 = await listingContract.listings(31);
      expect(listing4.listingId).to.equal(31);
      expect(listing4.tokenOwner).to.equal(ownerAddress);
      expect(listing4.assetContract).to.equal(erc20TokenAddress);
      expect(listing4.tokenId).to.equal(listingParams.tokenIds[3]);

      expect(listing4.quantity).to.equal(listingParams.quantityToList[3]);
      expect(listing4.currency).to.equal(listingParams.currencyToAccept);
      expect(listing4.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[3]
      );

      const listing5 = await listingContract.listings(32);
      expect(listing5.listingId).to.equal(32);
      expect(listing5.tokenOwner).to.equal(ownerAddress);
      expect(listing5.assetContract).to.equal(erc20TokenAddress);
      expect(listing5.tokenId).to.equal(listingParams.tokenIds[4]);

      expect(listing5.quantity).to.equal(listingParams.quantityToList[4]);
      expect(listing5.currency).to.equal(listingParams.currencyToAccept);
      expect(listing5.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[4]
      );

      const listing6 = await listingContract.listings(33);
      expect(listing6.listingId).to.equal(33);
      expect(listing6.tokenOwner).to.equal(ownerAddress);
      expect(listing6.assetContract).to.equal(erc20TokenAddress);
      expect(listing6.tokenId).to.equal(listingParams.tokenIds[5]);

      expect(listing6.quantity).to.equal(listingParams.quantityToList[5]);
      expect(listing6.currency).to.equal(listingParams.currencyToAccept);
      expect(listing6.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[5]
      );

      const listing7 = await listingContract.listings(34);
      expect(listing7.listingId).to.equal(34);
      expect(listing7.tokenOwner).to.equal(ownerAddress);
      expect(listing7.assetContract).to.equal(erc20TokenAddress);
      expect(listing7.tokenId).to.equal(listingParams.tokenIds[6]);

      expect(listing7.quantity).to.equal(listingParams.quantityToList[6]);
      expect(listing7.currency).to.equal(listingParams.currencyToAccept);
      expect(listing7.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[6]
      );

      const listingIds = [28, 29];
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = [parseUnits("100"), parseUnits("100")];
      const currency = [alternativeCurrency, alternativeCurrency];
      const totalPrice = [
        listingParams.buyoutPricePerToken[0] * quantityToBuy[0],
        listingParams.buyoutPricePerToken[1] * quantityToBuy[1],
      ];
      const totalValue = totalPrice[0] + totalPrice[1];
      const approveCurrencyTx = await alternativeCurrency
        .connect(otherAccount)
        .approve(listingContract, totalValue);
      await approveCurrencyTx.wait();
      const ownershipBeforeApproval = await erc20Token.balanceOf(owner);
      const buyTx = await listingContract
        .connect(otherAccount)
        .bulkBuy(listingIds, buyFor, quantityToBuy, currency, totalPrice);

      let balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);

      expect(balanceOfBuyerAfter).to.equal("412000000000000000000");
    });
  });

  describe("Bulk listing Erc-20 ", function () {
    it("Create Bulk listing for erc20 Token and buying with erc20 currency", async function () {
      const listingParams = {
        assetContract: [
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
          erc20TokenAddress,
        ], //address assetContract;
        tokenIds: [0, 0, 0, 0, 0, 0, 0], //uint256 ;

        quantityToList: [
          parseUnits("100"),
          parseUnits("100"),
          parseUnits("100"),
          parseUnits("10"),
          parseUnits("100"),
          parseUnits("1000"),
          parseUnits("100"),
        ], //uint256 quantityToList;
        currencyToAccept: ZeroAddress, //address currencyToAccept;
        buyoutPricePerToken: [
          parseUnits("0.00000000001"),
          parseUnits("0.00000000002"),
          parseUnits("0.000003"),
          parseUnits("0.000004"),
          parseUnits("0.000001"),
          parseUnits("0.000001"),
          parseUnits("0.000001"),
        ], //uint256 buyoutPricePerToken;
        isERC20: [true, true, true, true, true, true, true, true],
      };

      const approveTx = await erc20Token
        .connect(owner)
        .approve(
          listingContractAddress,
          parseUnits("1") +
            parseUnits("1") +
            parseUnits("100") +
            parseUnits("10") +
            parseUnits("100") +
            parseUnits("1000") +
            parseUnits("100")
        );
      await approveTx.wait();
      const createErc20ListingTx = await listingContract
        .connect(owner)
        .createMultipleListing(listingParams);
      const totalListings = await listingContract.totalListings();

      expect(totalListings).to.equal(42);
      const listing1 = await listingContract.listings(35);
      expect(listing1.listingId).to.equal(35);
      expect(listing1.tokenOwner).to.equal(ownerAddress);
      expect(listing1.assetContract).to.equal(erc20TokenAddress);
      expect(listing1.tokenId).to.equal(listingParams.tokenIds[0]);

      expect(listing1.quantity).to.equal(listingParams.quantityToList[0]);
      expect(listing1.currency).to.equal(listingParams.currencyToAccept);
      expect(listing1.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[0]
      );

      const listing2 = await listingContract.listings(36);
      expect(listing2.listingId).to.equal(36);
      expect(listing2.tokenOwner).to.equal(ownerAddress);
      expect(listing2.assetContract).to.equal(erc20TokenAddress);
      expect(listing2.tokenId).to.equal(listingParams.tokenIds[1]);

      expect(listing2.quantity).to.equal(listingParams.quantityToList[1]);
      expect(listing2.currency).to.equal(listingParams.currencyToAccept);
      expect(listing2.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[1]
      );
      const listing3 = await listingContract.listings(37);
      expect(listing3.listingId).to.equal(37);
      expect(listing3.tokenOwner).to.equal(ownerAddress);
      expect(listing3.assetContract).to.equal(erc20TokenAddress);
      expect(listing3.tokenId).to.equal(listingParams.tokenIds[2]);

      expect(listing3.quantity).to.equal(listingParams.quantityToList[2]);
      expect(listing3.currency).to.equal(listingParams.currencyToAccept);
      expect(listing3.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[2]
      );

      const listing4 = await listingContract.listings(38);
      expect(listing4.listingId).to.equal(38);
      expect(listing4.tokenOwner).to.equal(ownerAddress);
      expect(listing4.assetContract).to.equal(erc20TokenAddress);
      expect(listing4.tokenId).to.equal(listingParams.tokenIds[3]);

      expect(listing4.quantity).to.equal(listingParams.quantityToList[3]);
      expect(listing4.currency).to.equal(listingParams.currencyToAccept);
      expect(listing4.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[3]
      );

      const listing5 = await listingContract.listings(39);
      expect(listing5.listingId).to.equal(39);
      expect(listing5.tokenOwner).to.equal(ownerAddress);
      expect(listing5.assetContract).to.equal(erc20TokenAddress);
      expect(listing5.tokenId).to.equal(listingParams.tokenIds[4]);

      expect(listing5.quantity).to.equal(listingParams.quantityToList[4]);
      expect(listing5.currency).to.equal(listingParams.currencyToAccept);
      expect(listing5.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[4]
      );

      const listing6 = await listingContract.listings(40);
      expect(listing6.listingId).to.equal(40);
      expect(listing6.tokenOwner).to.equal(ownerAddress);
      expect(listing6.assetContract).to.equal(erc20TokenAddress);
      expect(listing6.tokenId).to.equal(listingParams.tokenIds[5]);

      expect(listing6.quantity).to.equal(listingParams.quantityToList[5]);
      expect(listing6.currency).to.equal(listingParams.currencyToAccept);
      expect(listing6.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[5]
      );

      const listing7 = await listingContract.listings(41);
      expect(listing7.listingId).to.equal(41);
      expect(listing7.tokenOwner).to.equal(ownerAddress);
      expect(listing7.assetContract).to.equal(erc20TokenAddress);
      expect(listing7.tokenId).to.equal(listingParams.tokenIds[6]);

      expect(listing7.quantity).to.equal(listingParams.quantityToList[6]);
      expect(listing7.currency).to.equal(listingParams.currencyToAccept);
      expect(listing7.buyoutPricePerToken).to.equal(
        listingParams.buyoutPricePerToken[6]
      );

      const listingIds = [35, 36];
      const buyFor = await otherAccount.getAddress();
      const quantityToBuy = [parseUnits("1"), parseUnits("1")];
      const currency = [ZeroAddress, ZeroAddress];
      const totalPrice = [
        (listingParams.buyoutPricePerToken[0] * quantityToBuy[0]) /
          parseUnits("1"),
        (listingParams.buyoutPricePerToken[1] * quantityToBuy[1]) /
          parseUnits("1"),
      ];
      console.log("🚀 ~ totalPrice:", totalPrice);
      const totalValue = totalPrice[0] + totalPrice[1];
      console.log("🚀 ~ totalValue:", totalValue);
      const ownershipBeforeApproval = await erc20Token.balanceOf(owner);
      const buyTx = await listingContract
        .connect(otherAccount)
        .bulkBuy(listingIds, buyFor, quantityToBuy, currency, totalPrice, {
          value: totalValue,
        });

      let balanceOfBuyerAfter = await erc20Token.balanceOf(otherAccountAddress);
    });
  });
});
