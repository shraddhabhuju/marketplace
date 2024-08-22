// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;
import "./IPlatformFee.sol";
interface IMarketplace is IPlatformFee {
    enum TokenType {
        ERC20,
        ERC721,
        ERC1155
    }

    /**
     *  @dev For use in `createListing` as a parameter type.
     *
     *  @param assetContract         The contract address of the NFT to list for sale.

     *  @param tokenId               The tokenId on `assetContract` of the NFT to list for sale.

     *  @param startTime             The unix timestamp after which the listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param secondsUntilEndTime   No. of seconds after `startTime`, after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     *
     *  @param quantityToList        The quantity of NFT of ID `tokenId` on the given `assetContract` to list. For
     *                               ERC 721 tokens to list for sale, the contract strictly defaults this to `1`,
     *                               Regardless of the value of `quantityToList` passed.
     *
     *  @param currencyToAccept      For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param reservePricePerToken  For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param buyoutPricePerToken   For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param listingType           The type of listing to create - a direct listing or an auction.
    **/
    struct ListingParameters {
        address assetContract;
        uint256 tokenId;
        uint256 startTime;
        uint256 quantityToList;
        address currencyToAccept;
        uint256 buyoutPricePerToken;
    }


        /**
     *  @notice The information related to a listing; either (1) a direct listing, or (2) an auction listing.
     *
     *  @dev For direct listings:
     *          (1) `reservePricePerToken` is ignored.
     *          (2) `buyoutPricePerToken` is simply interpreted as 'price per token'.
     *
     *  @param listingId             The uid for the listing.
     *
     *  @param tokenOwner            The owner of the tokens listed for sale.  
     *
     *  @param assetContract         The contract address of the NFT to list for sale.

     *  @param tokenId               The tokenId on `assetContract` of the NFT to list for sale.

     *  @param startTime             The unix timestamp after which the listing is active. For direct listings:
     *                               'active' means NFTs can be bought from the listing. For auctions,
     *                               'active' means bids can be made in the auction.
     *
     *  @param endTime               The timestamp after which the listing is inactive.
     *                               For direct listings: 'inactive' means NFTs cannot be bought from the listing.
     *                               For auctions: 'inactive' means bids can no longer be made in the auction.
     *
     *  @param quantity              The quantity of NFT of ID `tokenId` on the given `assetContract` listed. For
     *                               ERC 721 tokens to list for sale, the contract strictly defaults this to `1`,
     *                               Regardless of the value of `quantityToList` passed.
     *
     *  @param currency              For direct listings: the currency in which a buyer must pay the listing's fixed price
     *                               to buy the NFT(s). For auctions: the currency in which the bidders must make bids.
     *
     *  @param reservePricePerToken  For direct listings: this value is ignored. For auctions: the minimum bid amount of
     *                               the auction is `reservePricePerToken * quantityToList`
     *
     *  @param buyoutPricePerToken   For direct listings: interpreted as 'price per token' listed. For auctions: if
     *                               `buyoutPricePerToken` is greater than 0, and a bidder's bid is at least as great as
     *                               `buyoutPricePerToken * quantityToList`, the bidder wins the auction, and the auction
     *                               is closed.
     *
     *  @param tokenType             The type of the token(s) listed for for sale -- ERC721 or ERC1155 
     *
     * @param listingType            The type of listing to create - a direct listing or an auction.
    **/

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

    /// @dev Emitted when a new listing is created.
    event ListingAdded(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        Listing listing
    );

    /// @dev Emitted when the parameters of a listing are updated.
    event ListingUpdated(
        uint256 indexed listingId,
        address indexed listingCreator
    );

    /// @dev Emitted when a listing is cancelled.
    event ListingRemoved(
        uint256 indexed listingId,
        address indexed listingCreator
    );

      /**
     * @dev Emitted when a buyer buys from a direct listing, or a lister accepts some
     *      buyer's offer to their direct listing.
     */
    event NewSale(
        uint256 indexed listingId,
        address indexed assetContract,
        address indexed lister,
        address buyer,
        uint256 quantityBought,
        uint256 totalPricePaid
    );


    function createListing(ListingParameters memory _params) external;
 function updateListing(
        uint256 _listingId,
        uint256 _quantityToList,
        uint256 _buyoutPricePerToken,
        address _currencyToAccept,
        uint256 _startTime
    ) external;

    /**
     *  @notice Lets a direct listing creator cancel their listing.
     *
     *  @param _listingId The unique Id of the listing to cancel.
     */
    function cancelDirectListing(uint256 _listingId) external;
   /**
     *  @notice Lets someone buy a given quantity of tokens from a direct listing by paying the fixed price.
     *
     *  @param _listingId The uid of the direct listing to buy from.
     *  @param _buyFor The receiver of the NFT being bought.
     *  @param _quantity The amount of NFTs to buy from the direct listing.
     *  @param _currency The currency to pay the price in.
     *  @param _totalPrice The total price to pay for the tokens being bought.
     *
     *  @dev A sale will fail to execute if either:
     *          (1) buyer does not own or has not approved Marketplace to transfer the appropriate
     *              amount of currency (or hasn't sent the appropriate amount of native tokens)
     *
     *          (2) the lister does not own or has removed Marketplace's
     *              approval to transfer the tokens listed for sale.
     */
    function buy(
        uint256 _listingId,
        address _buyFor,
        uint256 _quantity,
        address _currency,
        uint256 _totalPrice
    ) external payable;
}
