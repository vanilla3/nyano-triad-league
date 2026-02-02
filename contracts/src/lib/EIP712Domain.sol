// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal EIP-712 domain helper.
abstract contract EIP712Domain {
    bytes32 private immutable _DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;

    bytes32 private constant _EIP712_DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    constructor(string memory name, string memory version) {
        _CACHED_CHAIN_ID = block.chainid;
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(_EIP712_DOMAIN_TYPEHASH, keccak256(bytes(name)), keccak256(bytes(version)), block.chainid, address(this))
        );
    }

    function domainSeparator() public view returns (bytes32) {
        if (block.chainid == _CACHED_CHAIN_ID) return _DOMAIN_SEPARATOR;
        // if chainId changed due to fork, recompute
        return keccak256(
            abi.encode(
                _EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(_name())),
                keccak256(bytes(_version())),
                block.chainid,
                address(this)
            )
        );
    }

    function _name() internal view virtual returns (string memory);
    function _version() internal view virtual returns (string memory);

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }
}
