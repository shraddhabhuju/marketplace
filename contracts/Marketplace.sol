// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;
import {IMarketplace} from "./interfaces/IMarketplace.sol";
import {AccessControlEnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ERC2771ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./extensions/CurrencyTransferLib.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Marketplace is
    IMarketplace,
    Initializable,
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

    /// @dev Only lister role holders can create listings, when listings are restricted by lister address.
    bytes32 private constant LISTER_ROLE = keccak256("LISTER_ROLE");
    /// @dev The address of the native token wrapper contract.
    address private nativeTokenWrapper;

    /// @dev whitelister who can whitelist the currency that can be used in the marketplace
    bytes32 private constant CURRENCY_WHITELISTER_ROLE =
        keccak256("CURRENCY_WHITELISTER_ROLE");

    mapping(address => bool) public whitelistedTokens;
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

    modifier isWhitelistedToken(address tokenAddress) {
        if (tokenAddress == address(0) && !whitelistedTokens[tokenAddress]) {
            revert InvalidToken(tokenAddress);
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
        address _nativeTokenWrapper
    ) external initializer {
        __ReentrancyGuard_init();
        __AccessControl_init();
        nativeTokenWrapper = _nativeTokenWrapper;
        platformFeeBps = uint64(_platformFeeBps);
        platformFeeRecipient = _platformFeeRecipient;

        _grantRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        console.log("_defaultAdmin",_defaultAdmin);
        
        _setRoleAdmin(CURRENCY_WHITELISTER_ROLE, DEFAULT_ADMIN_ROLE);
       
       
    }

    /// @dev Lets a token owner list tokens for sale: Direct Listing
    function createListing(ListingParameters memory _params) external override {
        // Get values to populate `Listing`.
        uint256 listingId = totalListings;
        totalListings += 1;

        address tokenOwner = msg.sender;

        TokenType tokenTypeOfListing = getTokenType(_params.assetContract);

        uint256 tokenAmountToList = getSafeQuantity(
            tokenTypeOfListing,
            _params.quantityToList
        );

        if (tokenAmountToList < 0) {
            revert InvalidQuantity();
        }
        if (
            hasRole(LISTER_ROLE, address(0)) || hasRole(LISTER_ROLE, msg.sender)
        ) {
            revert NotLister();
        }

        uint256 startTime = _params.startTime;
        if (startTime < block.timestamp) {
            // do not allow listing to start in the past (1 hour buffer)
            if (block.timestamp - startTime < 1 hours) {
                revert InvalidStartTime(block.timestamp, startTime);
            }
            startTime = block.timestamp;
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
            startTime: startTime,
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
    function updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept,
        uint256 _startTime
    ) external override onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];
        uint256 safeNewQuantity = getSafeQuantity(
            targetListing.tokenType,
            _quantityToList
        );

        if (safeNewQuantity == 0) {
            revert InvalidQuantity();
        }

        if (_startTime < block.timestamp) {
            // do not allow listing to start in the past (1 hour buffer)
            if (block.timestamp - _startTime < 1 hours) {
                revert InvalidStartTime(block.timestamp, _startTime);
            }
            _startTime = block.timestamp;
        }

        uint256 newStartTime = _startTime == 0
            ? targetListing.startTime
            : _startTime;
        listings[_listingId] = Listing({
            listingId: _listingId,
            tokenOwner: _msgSender(),
            assetContract: targetListing.assetContract,
            tokenId: targetListing.tokenId,
            startTime: newStartTime,
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

        emit ListingUpdated(_listingId, targetListing.tokenOwner);
    }

    /// @dev Lets a direct listing creator cancel their listing.
    function cancelDirectListing(
        uint256 _listingId
    ) external onlyListingCreator(_listingId) {
        Listing memory targetListing = listings[_listingId];

        delete listings[_listingId];

        emit ListingRemoved(_listingId, targetListing.tokenOwner);
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
        console.log(" ~ isValid:", isValid);
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
        }
        if (!isValid) {
            revert InvalidTokenType();
        }
    }

    /// @dev Lets an account buy a given quantity of tokens from a listing.
    function buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantityToBuy,
        address _currency,
        uint256 _totalPrice
    ) external payable override nonReentrant onlyExistingListing(_listingId) {
        Listing memory targetListing = listings[_listingId];
        address payer = msg.sender;

        // Check whether the settled total price and currency to use are correct.
        require(
            _currency == targetListing.currency &&
                _totalPrice ==
                (targetListing.buyoutPricePerToken * _quantityToBuy),
            "!PRICE"
        );

        executeSale(
            targetListing,
            payer,
            _buyFor,
            targetListing.currency,
            targetListing.buyoutPricePerToken * _quantityToBuy,
            _quantityToBuy
        );
    }

    function executeSale(
        Listing memory _targetListing,
        address _payer,
        address _receiver,
        address _currency,
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

        _targetListing.quantity -= _listingTokenAmountToTransfer;
        listings[_targetListing.listingId] = _targetListing;

        payout(
            _payer,
            _targetListing.tokenOwner,
            _currency,
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
        }
    }

    /// @dev Pays out stakeholders in a sale.
    function payout(
        address _payer,
        address _payee,
        address _currencyToUse,
        uint256 _totalPayoutAmount,
        Listing memory _listing
    ) internal {
        uint256 platformFeeCut = (_totalPayoutAmount * platformFeeBps) /
            MAX_BPS;

        uint256 royaltyCut;
        address royaltyRecipient;

        // Distribute royalties. See Sushiswap's https://github.com/sushiswap/shoyu/blob/master/contracts/base/BaseExchange.sol#L296
        try
            IERC2981(_listing.assetContract).royaltyInfo(
                _listing.tokenId,
                _totalPayoutAmount
            )
        returns (address royaltyFeeRecipient, uint256 royaltyFeeAmount) {
            if (royaltyFeeRecipient != address(0) && royaltyFeeAmount > 0) {
                if (royaltyFeeAmount + platformFeeCut <= _totalPayoutAmount) {
                    revert FeesExceedPrice(
                        royaltyFeeAmount + platformFeeCut,
                        _totalPayoutAmount
                    );
                }
                royaltyRecipient = royaltyFeeRecipient;
                royaltyCut = royaltyFeeAmount;
            }
        } catch {}

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

        // Check if sale is made within the listing window.
        if (block.timestamp < _listing.startTime) {
            revert ListingNotStarted();
        }

        // Check: buyer owns and has approved sufficient currency for sale.
        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            if (msg.value != settledTotalPrice) {
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
        if (_platformFeeBps <= MAX_BPS) {
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

    // Updates the whitelist status of multiple tokens.
    function updateWhitelistedTokens(
        address[] memory tokens,
        bool[] memory isWhitelisted
    ) external override onlyRole(CURRENCY_WHITELISTER_ROLE) {
        uint tokensLength = tokens.length;
        uint isWhitelistedLength = isWhitelisted.length;

        // Check if the length of the token and isWhitelisted arrays match
        if (tokensLength != isWhitelistedLength) revert InvalidTokenData();

        // Update the whitelist status of each token
        for (uint index; index < tokensLength; ) {
            whitelistedTokens[tokens[index]] = isWhitelisted[index];

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

    /*///////////////////////////////////////////////////////////////
                            Miscellaneous
    //////////////////////////////////////////////////////////////*/
}
