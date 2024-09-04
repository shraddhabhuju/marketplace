// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.11;

import "./IPlatformFee.sol";

interface IMarketplace is IPlatformFee {
    enum TokenType {
        ERC20Variant,
        ERC721,
        ERC1155
    }

    /**
     * @dev Parameters used for creating a new listing.
     *
     * @param assetContract         The address of the NFT contract.
     * @param tokenId               The ID of the NFT to list for sale. //0 for erc20 token
     * @param startTime             The timestamp after which the listing becomes active.
     * @param quantityToList        The number of NFTs to list. Defaults to `1` for ERC721 tokens.
     * @param currencyToAccept      The currency accepted for the listing. For direct listings, this is the payment currency. For auctions, it's the bidding currency.
     * @param buyoutPricePerToken   The price per token for direct listings. For auctions, if a bid meets or exceeds this value multiplied by `quantityToList`, the auction ends immediately.
     * @param isERC20    to createErc20
     */
    struct ListingParameters {
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 quantityToList;
        address currencyToAccept;
        uint256 buyoutPricePerToken;
        bool isERC20;
    }

    /**
     * @dev Parameters used for creating a new listing.
     *
     * @param assetContract         The address of the NFT contract.
     * @param tokenIds              The ID of the NFT to list for sale. //0 for erc20 token
     * @param startTime             The timestamp after which the listing becomes active.
     * @param quantityToList        The number of NFTs to list. Defaults to `1` for ERC721 tokens.
     * @param currencyToAccept      The currency accepted for the listing. For direct listings, this is the payment currency. For auctions, it's the bidding currency.
     * @param buyoutPricePerToken   The price per token for direct listings. For auctions, if a bid meets or exceeds this value multiplied by `quantityToList`, the auction ends immediately.
     */
    struct BulkListingParameters {
        address[] assetContract;
        uint256[] tokenIds;
        uint256 startTime;
        uint256[] quantityToList;
        address currencyToAccept;
        uint256[] buyoutPricePerToken;
        bool[] isERC20;
    }

    /**
     * @dev Information related to a listing, whether a direct listing or an auction.
     *
     * @param listingId             The unique ID for the listing.
     * @param tokenOwner            The owner of the tokens listed for sale.
     * @param assetContract         The address of the NFT contract.
     * @param tokenId               The ID of the NFT to list for sale.
     * @param startTime             The timestamp after which the listing is active.
     * @param quantity              The number of NFTs listed. Defaults to `1` for ERC721 tokens.
     * @param currency              The currency accepted for the listing.
     * @param buyoutPricePerToken   The price per token for direct listings. For auctions, it's the buyout price per token.
     * @param tokenType             The type of token listed (ERC721 or ERC1155).
     * @param listingType           The type of listing - either direct or auction.
     */
    struct Listing {
        uint256 listingId;
        address tokenOwner;
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 quantity;
        address currency;
        uint256 buyoutPricePerToken;
        TokenType tokenType;
    }

    // Errors
    error InvalidToken(address tokenAddress);
    error InvalidTokenData();
    error InvalidBulkBuyData();
    error InvalidBulkUpdateData();
    error InvalidQuantity();
    error ListDoesntExists();
    error CurrencyNotWhitelisted(address _currency, bool isWhitelisted);
    error InsufficientERC20Balance(
        address addressToCheck,
        address currency,
        uint256 currencyAmountToCheckAgainst
    );
    error NotListOwner(address actualOwner, address owner);
    error InvalidStartTime(uint256 currentTimeStamp, uint256 startTime);
    error InvalidTokenType();
    error InvalidTokenAmount(uint256 quantityToBuy, uint256 listingQuantity);
    error ListingNotStarted();
    error ExccededMaximumBPS(uint256 _platformFeeBps);
    error InsufficentBalance(uint256 sentBalance, uint256 settledTotalPrice);
    error FeesExceedPrice(uint256 calculatedAmount, uint256 totalPayoutAmount);
    error NotASoulBoundOwner(address account, address soulBoundNftAdress);
    /**
     * @dev Allows adding or removing tokens from the whitelist.
     *
     * @param tokens          Array of token addresses to be updated.
     * @param isWhitelisted   Boolean array indicating the whitelisted status of each token.
     */
    function updateWhitelistedTokens(
        address[] memory tokens,
        bool[] memory isWhitelisted
    ) external;

    function updateWhitelistedCurrency(
        address[] memory currencyTokens,
        bool[] memory isWhitelisted
    ) external;

    // Events
    event ListingAdded(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        Listing listing
    );

    event TokenWhitelisted(
        address tokenAddress,
        address whitelister,
        bool isWhitelisted
    );

    event CurrencyWhitelisted(
        address tokenAddress,
        address whitelister,
        bool isWhitelisted
    );

    event ListingUpdated(
        uint256 indexed listingId,
        address indexed listingCreator
    );

    event ListingRemoved(
        uint256 indexed listingId,
        address indexed listingCreator
    );

    event CurrencyWhitelisterUpdated(address account);

    event NewSale(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        address buyer,
        uint256 quantityBought,
        uint256 totalPricePaid
    );

    /**
     * @dev Creates a new listing with the provided parameters.
     *
     * @param _params The parameters of the listing to create.
     */
    function createListing(ListingParameters memory _params) external;

    /**
     * @dev Creates a new listings with the provided parameters.
     *
     * @param _params The parameters of the listings to create.
     */
    function createMultipleListing(
        BulkListingParameters memory _params
    ) external;
    /**
     * @dev Updates the parameters of multiple  existing listing.
     *
     * @param _listingId           The unique ID of the listing to update.
     * @param _quantityToList      The new quantity of NFTs to list.
     * @param _buyoutPricePerToken The new buyout price per token.
     * @param _currencyToAccept    The new currency to accept.
     * @param _startTime           The new start time for the listing.
     */
    function updateListings(
        uint256[] memory _listingId,
        uint256[] memory _quantityToList,
        uint256[] memory _buyoutPricePerToken,
        address[] memory _currencyToAccept,
        uint256[] memory _startTime
    ) external;

    /**
     * @dev Updates the parameters of an existing listing.
     *
     * @param _listingId           The unique ID of the listing to update.
     * @param _quantityToList      The new quantity of NFTs to list.
     * @param _buyoutPricePerToken The new buyout price per token.
     * @param _currencyToAccept    The new currency to accept.
     * @param _startTime           The new start time for the listing.
     */
    function updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept,
        uint256 _startTime
    ) external;

    /**
     * @dev Cancels an existing direct listing.
     *
     * @param _listingId The unique ID of the listing to cancel.
     */
    function cancelDirectListing(uint256 _listingId) external;

    /**
     * @dev Allows a buyer to purchase a specified quantity of tokens from a direct listing by paying the fixed price.
     *
     * @param _listingId The unique ID of the direct listing to buy from.
     * @param _buyFor    The address that will receive the purchased NFTs.
     * @param _quantity  The quantity of NFTs to buy.
     * @param _currency  The currency to use for the purchase.
     * @param _totalPrice The total price to pay for the tokens being bought.
     */
    function buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantity,
        address _currency,
        uint256 _totalPrice
    ) external payable;

    function bulkBuy(
        uint256[] memory _listingIds,
        address _buyFor,
        uint256[] memory _quantity,
        address[] memory _currency,
        uint256[] memory _totalPrice
    ) external payable;
}
