// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;
import {IMarketplace} from "./interfaces/IMarketplace.sol";
import {AccessControlEnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC20Variant} from "./interfaces/IERC20Variant.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC2771ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./extensions/CurrencyTransferLib.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";
contract Marketplace is
    IMarketplace,
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    AccessControlEnumerableUpgradeable,
    ReentrancyGuardUpgradeable
{
    // mappings from uid of listing =>listing Info
    mapping(uint256 => Listing) public listings;
    uint64 public constant MAX_BPS = 10_000;
    /// @dev The address that receives all platform fees from all sales.
    address private platformFeeRecipient;
    /// @dev The % of primary sales collected as platform fees.
    uint64 private platformFeeBps;
    /// @dev Returns the platform fee recipient and bps.

    /// @dev Total number of listings ever created in the marketplace.
    uint256 public totalListings;

    // to allow kyc verified users to create listings
    bool public isUsersCreateListingAllowed;

    /// @dev The address of the native token wrapper contract.
    address private nativeTokenWrapper;

    address private kycSoulBoundNftAddress;
    address private kybSoulBoundNftAddress;

    /// @dev whitelister who can whitelist the currency that can be used in the marketplace
    bytes32 private constant CURRENCY_WHITELISTER_ROLE =
        keccak256("CURRENCY_WHITELISTER_ROLE");
    // tokens whitelisted to be listed
    mapping(address => bool) public whitelistedListingTokens;
    // currency that are accepted to purchase the NFTs
    mapping(address => bool) public whitelistedCurrencyTokens;
    // store active token listing status
    mapping(bytes32 => bool) public activeTokenListing;
    /*///////////////////////////////////////////////////////////////
                                Modifiers
    //////////////////////////////////////////////////////////////*/

    /// @dev Checks whether caller is a listing creator.
    modifier onlyListingCreator(uint256 _listingId) {
        if (listings[_listingId].tokenOwner != msg.sender) {
            revert NotListOwner(listings[_listingId].tokenOwner, msg.sender);
        }
        _;
    }

    /// @dev Checks whether a listing exists.
    modifier onlyExistingListing(uint256 _listingId) {
        if (listings[_listingId].assetContract == address(0)) {
            revert ListDoesntExists();
        }
        _;
    }

    modifier isWhitelistedListingToken(address tokenAddress) {
        if (
            tokenAddress == address(0) ||
            !whitelistedListingTokens[tokenAddress]
        ) {
            revert InvalidToken(tokenAddress);
        }
        _;
    }
    modifier isVerifiedUserOrAssetOrginator() {
        if (
            IERC721(kycSoulBoundNftAddress).balanceOf(msg.sender) == 0 ||
            (!isUsersCreateListingAllowed &&
                IERC721(kybSoulBoundNftAddress).balanceOf(msg.sender) == 0)
        ) {
            revert NotASoulBoundOwner(
                msg.sender,
                kycSoulBoundNftAddress,
                kybSoulBoundNftAddress
            );
        }

        _;
    }

    /*///////////////////////////////////////////////////////////////
                    Constructor + initializer logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Initializes the contract, like a constructor.
    function initialize(
        address _defaultAdmin,
        address _platformFeeRecipient,
        uint256 _platformFeeBps,
        address _nativeTokenWrapper,
        address _kybSoulBoundNftAddress,
        address _kycSoulBoundNftAddress
    ) external initializer {
        __Ownable_init(_defaultAdmin);
        __ReentrancyGuard_init();
        __AccessControl_init();

        nativeTokenWrapper = _nativeTokenWrapper;
        platformFeeBps = uint64(_platformFeeBps);
        platformFeeRecipient = _platformFeeRecipient;
        kycSoulBoundNftAddress = _kycSoulBoundNftAddress;
        kybSoulBoundNftAddress = _kybSoulBoundNftAddress;
        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        isUsersCreateListingAllowed = false;
        _setRoleAdmin(CURRENCY_WHITELISTER_ROLE, DEFAULT_ADMIN_ROLE);
    }

    function createListing(
        ListingParameters memory _params
    ) external override isVerifiedUserOrAssetOrginator {
        _createSingleListing(_params);
    }

    function createMultipleListing(
        BulkListingParameters memory _params
    ) external override isVerifiedUserOrAssetOrginator {
        uint tokensLength = _params.tokenIds.length;
        uint assetsLength = _params.assetContract.length;
        uint quantityToBuyLength = _params.quantityToList.length;
        uint totalPriceLength = _params.buyoutPricePerToken.length;
        uint isERC20Length = _params.isERC20.length;
        if (
            tokensLength != quantityToBuyLength &&
            quantityToBuyLength != totalPriceLength &&
            totalPriceLength != isERC20Length &&
            isERC20Length != assetsLength
        ) revert InvalidBulkBuyData();

        // Update the whitelist status of each token
        for (uint index; index < tokensLength; ) {
            ListingParameters memory params = ListingParameters({
                assetContract: _params.assetContract[index],
                tokenId: _params.tokenIds[index],
                quantityToList: _params.quantityToList[index],
                currencyToAccept: _params.currencyToAccept,
                buyoutPricePerToken: _params.buyoutPricePerToken[index],
                isERC20: _params.isERC20[index]
            });
            _createSingleListing(params);
            unchecked {
                ++index;
            }
        }
    }

    /// @dev Lets a token owner list tokens for sale: Direct Listing
    function _createSingleListing(
        ListingParameters memory _params
    ) internal isWhitelistedListingToken(_params.assetContract) {
        // Get values to populate `Listing`.
        uint256 listingId = totalListings;
        totalListings += 1;
        TokenType tokenTypeOfListing;
        address tokenOwner = msg.sender;

        if (_params.isERC20) {
            tokenTypeOfListing = TokenType.ERC20Variant;
        } else {
            tokenTypeOfListing = getTokenType(_params.assetContract);
        }

        bytes32 assetAddressAndTokenId = _calculateAssetAddressAndTokenId(
            _params.assetContract,
            _params.tokenId
        );

        if (tokenTypeOfListing == TokenType.ERC721) {
            if (activeTokenListing[assetAddressAndTokenId])
                revert ListingAlreadyExists();

            activeTokenListing[assetAddressAndTokenId] = true;
        }

        uint256 tokenAmountToList = getSafeQuantity(
            tokenTypeOfListing,
            _params.quantityToList
        );

        if (tokenAmountToList < 0) {
            revert InvalidQuantity();
        }

        validateOwnershipAndApproval(
            tokenOwner,
            _params.assetContract,
            _params.tokenId,
            tokenAmountToList,
            tokenTypeOfListing
        );

        Listing memory newListing = Listing({
            listingId: listingId,
            tokenOwner: tokenOwner,
            assetContract: _params.assetContract,
            tokenId: _params.tokenId,
            quantity: tokenAmountToList,
            currency: _params.currencyToAccept,
            buyoutPricePerToken: _params.buyoutPricePerToken,
            tokenType: tokenTypeOfListing
        });

        listings[listingId] = newListing;

        emit ListingAdded(
            listingId,
            _params.assetContract,
            tokenOwner,
            newListing
        );
    }

    /// @dev Lets a listing's creator edit the listing's parameters.
    function updateListings(
        uint256[] memory _listingIds,
        uint256[] memory _quantityToList,
        uint256[] memory _buyoutPricePerToken,
        address[] memory _currencyToAccept
    ) external override {
        uint listingIdsLength = _listingIds.length;
        uint quantityToListLength = _quantityToList.length;
        uint buyoutPricePerTokenLength = _buyoutPricePerToken.length;
        uint currencyToAcceptLength = _currencyToAccept.length;

        if (
            listingIdsLength != quantityToListLength &&
            quantityToListLength != buyoutPricePerTokenLength &&
            buyoutPricePerTokenLength != currencyToAcceptLength
        ) {
            revert InvalidBulkUpdateData();
        }

        for (uint index; index < listingIdsLength; ) {
            _updateListing(
                _listingIds[index],
                _quantityToList[index],
                _buyoutPricePerToken[index],
                _currencyToAccept[index]
            );
            unchecked {
                ++index;
            }
        }
    }

    function updateListing(
        uint256 _listingIds,
        uint256 _quantityToList,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept
    ) external override {
        _updateListing(
            _listingIds,
            _quantityToList,
            _buyoutPricePerToken,
            _currencyToAccept
        );
    }

    /// @dev Calculate Assets Address and Token Id
    function _calculateAssetAddressAndTokenId(
        address _assetContract,
        uint256 _tokenId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(_assetContract, _tokenId));
    }

    /// @dev Lets a listing's creator edit the listing's parameters.
    function _updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept
    ) internal onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];
        uint256 safeNewQuantity = getSafeQuantity(
            targetListing.tokenType,
            _quantityToList
        );

        if (safeNewQuantity == 0) {
            revert InvalidQuantity();
        }

        listings[_listingId] = Listing({
            listingId: _listingId,
            tokenOwner: _msgSender(),
            assetContract: targetListing.assetContract,
            tokenId: targetListing.tokenId,
            quantity: safeNewQuantity,
            currency: _currencyToAccept,
            buyoutPricePerToken: _buyoutPricePerToken,
            tokenType: targetListing.tokenType
        });

        // Must validate ownership and approval of the new quantity of tokens for direct listing.
        if (targetListing.quantity != safeNewQuantity) {
            // Transfer all escrowed tokens back to the lister, to be reflected in the lister's
            // balance for the upcoming ownership and approval check.

            validateOwnershipAndApproval(
                targetListing.tokenOwner,
                targetListing.assetContract,
                targetListing.tokenId,
                safeNewQuantity,
                targetListing.tokenType
            );
        }

        emit ListingUpdated(
            _listingId,
            _quantityToList,
            _buyoutPricePerToken,
            _currencyToAccept
        );
    }

    /// @dev Lets a direct listing creator cancel their listing.
    function cancelDirectListing(uint256 _listingId) external override {
        _cancelDirectListing(_listingId);
    }

    /// @dev Lets a direct listing creator cancel their listing.
    function _cancelDirectListing(
        uint256 _listingId
    ) internal onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];
        bytes32 assetAddressAndTokenId = _calculateAssetAddressAndTokenId(
            targetListing.assetContract,
            targetListing.tokenId
        );

        delete listings[_listingId];
        delete activeTokenListing[assetAddressAndTokenId];

        emit ListingRemoved(_listingId, msg.sender);
    }

    /// @dev Lets a direct listing creator cancel their listing.
    function cancelDirectListings(
        uint256[] memory _listingIds
    ) external override {
        uint listingsLength = _listingIds.length;
        for (uint index; index < listingsLength; ) {
            _cancelDirectListing(_listingIds[index]);
            unchecked {
                ++index;
            }
        }
    }

    /*///////////////////////////////////////////////////////////////
                            Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Validates that `_tokenOwner` owns and has approved Market to transfer NFTs.
    function validateOwnershipAndApproval(
        address _tokenOwner,
        address _assetContract,
        uint256 _tokenId,
        uint256 _quantity,
        TokenType _tokenType
    ) internal view {
        address market = address(this);
        bool isValid;

        if (_tokenType == TokenType.ERC1155) {
            isValid =
                IERC1155(_assetContract).balanceOf(_tokenOwner, _tokenId) >=
                _quantity &&
                IERC1155(_assetContract).isApprovedForAll(_tokenOwner, market);
        } else if (_tokenType == TokenType.ERC721) {
            isValid =
                IERC721(_assetContract).ownerOf(_tokenId) == _tokenOwner &&
                (IERC721(_assetContract).getApproved(_tokenId) == market ||
                    IERC721(_assetContract).isApprovedForAll(
                        _tokenOwner,
                        market
                    ));
        } else if (_tokenType == TokenType.ERC20Variant) {
            isValid =
                IERC20Variant(_assetContract).balanceOf(_tokenOwner) >=
                _quantity &&
                (IERC20Variant(_assetContract).allowance(_tokenOwner, market) >=
                    _quantity);
        }
        if (!isValid) {
            revert InvalidTokenAllowance();
        }
    }

    function bulkBuy(
        uint256[] memory _listingIds,
        address _buyFor,
        uint256[] memory _quantityToBuy,
        address[] memory _currency,
        uint256[] memory _totalPrice
    ) external payable override nonReentrant {
        uint256 listingsLength = _listingIds.length;

        // Ensure all arrays have the same length
        if (
            listingsLength != _quantityToBuy.length ||
            listingsLength != _totalPrice.length ||
            listingsLength != _currency.length
        ) revert InvalidBulkBuyData();

        uint256 sentValue = msg.value;

        for (uint256 index = 0; index < listingsLength; ) {
            Listing memory targetListing = listings[_listingIds[index]];
            uint256 decimals = 0;
            uint256 priceInWei = _totalPrice[index];

            if (targetListing.tokenType == TokenType.ERC20Variant) {
                // Cache decimals to avoid repetitive external calls
                decimals = IERC20Variant(targetListing.assetContract)
                    .decimals();
            }

            // Handle payments
            if (_currency[index] == address(0)) {
                if (sentValue < priceInWei) {
                    revert InsufficentBalance(sentValue, _totalPrice[index]);
                }

                // Execute the buy operation with or without decimal adjustment
                _buy(
                    _listingIds[index],
                    _buyFor,
                    _quantityToBuy[index],
                    _currency[index],
                    priceInWei
                );
                sentValue -= priceInWei;
            } else {
                _buy(
                    _listingIds[index],
                    _buyFor,
                    _quantityToBuy[index],
                    _currency[index],
                    _totalPrice[index]
                );
            }

            unchecked {
                ++index;
            } // Use unchecked to skip overflow checks
        }
    }

    function buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantityToBuy,
        address _currency,
        uint256 _totalSentAmount
    ) external payable override nonReentrant {
        _buy(_listingId, _buyFor, _quantityToBuy, _currency, _totalSentAmount);
    }

    /// @dev Lets an account buy a given quantity of tokens from a listing.
    function _buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantityToBuy,
        address _currency,
        uint256 _totalSentAmount
    ) internal onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];
        uint256 decimals = 0;
        uint256 calculatedPayOutAmount = 0;
        address payer = msg.sender;

        if (!whitelistedCurrencyTokens[_currency]) {
            revert CurrencyNotWhitelisted(
                _currency,
                whitelistedCurrencyTokens[_currency]
            );
        }

        if (targetListing.tokenType == TokenType.ERC20Variant) {
            decimals = IERC20Variant(targetListing.assetContract).decimals();
            calculatedPayOutAmount =
                (targetListing.buyoutPricePerToken * _quantityToBuy) /
                (10 ** decimals);

            if (
                _currency != targetListing.currency ||
                _totalSentAmount < calculatedPayOutAmount
            ) {
                revert InsufficentBalance(
                    _totalSentAmount,
                    calculatedPayOutAmount
                );
            }
        } else {
            uint256 totalAmount = targetListing.buyoutPricePerToken *
                _quantityToBuy;
            if (
                _currency != targetListing.currency ||
                _totalSentAmount < totalAmount
            ) {
                revert InsufficentBalance(_totalSentAmount, totalAmount);
            }
        }

        executeSale(
            targetListing,
            payer,
            _buyFor,
            targetListing.currency,
            _totalSentAmount,
            targetListing.tokenType == TokenType.ERC20Variant
                ? (targetListing.buyoutPricePerToken * _quantityToBuy) /
                    (10 ** decimals)
                : targetListing.buyoutPricePerToken * _quantityToBuy,
            _quantityToBuy
        );

        listings[_listingId].quantity -= _quantityToBuy;

        if (targetListing.tokenType == TokenType.ERC721) {
            bytes32 assetAddressAndTokenId = _calculateAssetAddressAndTokenId(
                targetListing.assetContract,
                targetListing.tokenId
            );
            delete activeTokenListing[assetAddressAndTokenId];
        }
    }

    function executeSale(
        Listing memory _targetListing,
        address _payer,
        address _receiver,
        address _currency,
        uint256 _totalSentAmount,
        uint256 _currencyAmountToTransfer,
        uint256 _listingTokenAmountToTransfer
    ) internal {
        validateDirectListingSale(
            _targetListing,
            _payer,
            _listingTokenAmountToTransfer,
            _currency,
            _currencyAmountToTransfer
        );

        if (_listingTokenAmountToTransfer > _targetListing.quantity) {
            revert InvalidQuantity();
        }

        payout(
            _payer,
            _targetListing.tokenOwner,
            _currency,
            _totalSentAmount,
            _currencyAmountToTransfer,
            _targetListing
        );
        transferListingTokens(
            _targetListing.tokenOwner,
            _receiver,
            _listingTokenAmountToTransfer,
            _targetListing
        );

        emit NewSale(
            _targetListing.listingId,
            _targetListing.assetContract,
            _targetListing.tokenOwner,
            _receiver,
            _listingTokenAmountToTransfer,
            _currencyAmountToTransfer
        );
    }

    function transferListingTokens(
        address _from,
        address _to,
        uint256 _quantity,
        Listing memory _listing
    ) internal {
        if (_listing.tokenType == TokenType.ERC1155) {
            IERC1155(_listing.assetContract).safeTransferFrom(
                _from,
                _to,
                _listing.tokenId,
                _quantity,
                ""
            );
        } else if (_listing.tokenType == TokenType.ERC721) {
            IERC721(_listing.assetContract).safeTransferFrom(
                _from,
                _to,
                _listing.tokenId,
                ""
            );
        } else {
            IERC20Variant(_listing.assetContract).transferFrom(
                _from,
                _to,
                _quantity
            );
        }
    }

    /// @dev Pays out stakeholders in a sale.
    function payout(
        address _payer,
        address _payee,
        address _currencyToUse,
        uint _totalSentAmount,
        uint256 _totalPayoutAmount,
        Listing memory _listing
    ) internal {
        uint256 platformFeeCut = (_totalPayoutAmount * platformFeeBps) /
            MAX_BPS;

        uint256 royaltyCut;
        address royaltyRecipient;

        // Distribute royalties. See Sushiswap's https://github.com/sushiswap/shoyu/blob/master/contracts/base/BaseExchange.sol#L296
        if (
            _listing.tokenType == TokenType.ERC721 ||
            _listing.tokenType == TokenType.ERC1155
        ) {
            try
                IERC2981(_listing.assetContract).royaltyInfo(
                    _listing.tokenId,
                    _totalPayoutAmount
                )
            returns (address royaltyFeeRecipient, uint256 royaltyFeeAmount) {
                if (royaltyFeeRecipient != address(0) && royaltyFeeAmount > 0) {
                    royaltyRecipient = royaltyFeeRecipient;
                    royaltyCut = royaltyFeeAmount;
                }
            } catch {}
        }

        // Distribute price to token owner
        address _nativeTokenWrapper = nativeTokenWrapper;

        CurrencyTransferLib.transferCurrencyWithWrapper(
            _currencyToUse,
            _payer,
            platformFeeRecipient,
            platformFeeCut,
            _nativeTokenWrapper
        );
        CurrencyTransferLib.transferCurrencyWithWrapper(
            _currencyToUse,
            _payer,
            royaltyRecipient,
            royaltyCut,
            _nativeTokenWrapper
        );
        CurrencyTransferLib.transferCurrencyWithWrapper(
            _currencyToUse,
            _payer,
            _payee,
            _totalPayoutAmount - (platformFeeCut + royaltyCut),
            _nativeTokenWrapper
        );


        uint256 dustFund = _totalSentAmount - _totalPayoutAmount;
        console.log(" ~ _totalPayoutAmount:", _totalPayoutAmount);
        console.log(" ~ _totalSentAmount:", _totalSentAmount);
        console.log(" ~ dustFund:", dustFund);

        if (
            dustFund > 0 && _currencyToUse == CurrencyTransferLib.NATIVE_TOKEN
        ) {
            CurrencyTransferLib.transferCurrencyWithWrapper(
                _currencyToUse,
                address(this),
                _payer,
                dustFund,
                _nativeTokenWrapper
            );
        }
    }

    /// @dev Validates conditions of a direct listing sale.
    function validateDirectListingSale(
        Listing memory _listing,
        address _payer,
        uint256 _quantityToBuy,
        address _currency,
        uint256 settledTotalPrice
    ) internal {
        // Check whether a valid quantity of listed tokens is being bought.
        if (
            _listing.quantity < 0 &&
            _quantityToBuy < 0 &&
            _quantityToBuy >= _listing.quantity
        ) {
            revert InvalidTokenAmount(_quantityToBuy, _listing.quantity);
        }

        // Check: buyer owns and has approved sufficient currency for sale.
        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            if (msg.value < settledTotalPrice) {
                revert InsufficentBalance(msg.value, settledTotalPrice);
            }
        } else {
            validateERC20BalAndAllowance(_payer, _currency, settledTotalPrice);
        }

        // Check whether token owner owns and has approved `quantityToBuy` amount of listing tokens from the listing.
        validateOwnershipAndApproval(
            _listing.tokenOwner,
            _listing.assetContract,
            _listing.tokenId,
            _quantityToBuy,
            _listing.tokenType
        );
    }

    /// @dev Validates that `_addrToCheck` owns and has approved markeplace to transfer the appropriate amount of currency
    function validateERC20BalAndAllowance(
        address _addrToCheck,
        address _currency,
        uint256 _currencyAmountToCheckAgainst
    ) internal view {
        if (
            IERC20(_currency).balanceOf(_addrToCheck) <
            _currencyAmountToCheckAgainst &&
            IERC20(_currency).allowance(_addrToCheck, address(this)) <
            _currencyAmountToCheckAgainst
        ) {
            revert InsufficientERC20Balance(
                _addrToCheck,
                _currency,
                _currencyAmountToCheckAgainst
            );
        }
    }

    /*///////////////////////////////////////////////////////////////
                            Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Enforces quantity == 1 if tokenType is TokenType.ERC721.
    function getSafeQuantity(
        TokenType _tokenType,
        uint256 _quantityToCheck
    ) internal pure returns (uint256 safeQuantity) {
        if (_quantityToCheck == 0) {
            safeQuantity = 0;
        } else {
            safeQuantity = _tokenType == TokenType.ERC721
                ? 1
                : _quantityToCheck;
        }
    }

    /// @dev Returns the interface supported by a contract.
    function getTokenType(
        address _assetContract
    ) internal view returns (TokenType tokenType) {
        if (
            IERC165(_assetContract).supportsInterface(
                type(IERC1155).interfaceId
            )
        ) {
            tokenType = TokenType.ERC1155;
        } else if (
            IERC165(_assetContract).supportsInterface(type(IERC721).interfaceId)
        ) {
            tokenType = TokenType.ERC721;
        }
    }

    /// @dev Returns the platform fee recipient and bps.
    function getPlatformFeeInfo() external view returns (address, uint16) {
        return (platformFeeRecipient, uint16(platformFeeBps));
    }

    /*///////////////////////////////////////////////////////////////
                            Setter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets a contract admin update platform fee recipient and bps.
    function setPlatformFeeInfo(
        address _platformFeeRecipient,
        uint256 _platformFeeBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_platformFeeBps > MAX_BPS) {
            revert ExccededMaximumBPS(_platformFeeBps);
        }

        platformFeeBps = uint64(_platformFeeBps);
        platformFeeRecipient = _platformFeeRecipient;

        emit PlatformFeeInfoUpdated(_platformFeeRecipient, _platformFeeBps);
    }

    function setCurrencyWhitelister(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(CURRENCY_WHITELISTER_ROLE, account);

        emit CurrencyWhitelisterUpdated(account);
    }

    function toggleListingState() external onlyRole(DEFAULT_ADMIN_ROLE) {
        isUsersCreateListingAllowed = !isUsersCreateListingAllowed;

        emit UsersAllowed();
    }

    // Updates the whitelist status of multiple tokens.
    function updateWhitelistedTokens(
        address[] memory tokens,
        bool[] memory isWhitelisted
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        uint tokensLength = tokens.length;
        uint isWhitelistedLength = isWhitelisted.length;

        // Check if the length of the token and isWhitelisted arrays match
        if (tokensLength != isWhitelistedLength) revert InvalidTokenData();

        // Update the whitelist status of each token
        for (uint index; index < tokensLength; ) {
            whitelistedListingTokens[tokens[index]] = isWhitelisted[index];

            // Emit an event for the token whitelist update
            emit TokenWhitelisted(
                tokens[index],
                msg.sender,
                isWhitelisted[index]
            );
            unchecked {
                ++index;
            }
        }
    }

    // Updates the whitelist status of currency tokens.
    function updateWhitelistedCurrency(
        address[] memory currencyTokens,
        bool[] memory isWhitelisted
    ) external override onlyRole(CURRENCY_WHITELISTER_ROLE) {
        uint tokensLength = currencyTokens.length;
        uint isWhitelistedLength = isWhitelisted.length;

        // Check if the length of the token and isWhitelisted arrays match
        if (tokensLength != isWhitelistedLength) revert InvalidTokenData();

        // Update the whitelist status of each token
        for (uint index; index < tokensLength; ) {
            whitelistedCurrencyTokens[currencyTokens[index]] = isWhitelisted[
                index
            ];

            // Emit an event for the token whitelist update
            emit CurrencyWhitelisted(
                currencyTokens[index],
                msg.sender,
                isWhitelisted[index]
            );
            unchecked {
                ++index;
            }
        }
    }

    /*///////////////////////////////////////////////////////////////
                            Miscellaneous
    //////////////////////////////////////////////////////////////*/
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}
    // Fallback function to receive native token
    fallback() external payable {}

    receive() external payable {}
}
