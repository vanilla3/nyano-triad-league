// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal ECDSA helpers (no external deps).
library ECDSA {
    error InvalidSignatureLength();
    error InvalidSignatureS();
    error InvalidSignatureV();

    function recover(bytes32 digest, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) revert InvalidSignatureLength();

        bytes32 r;
        bytes32 s;
        uint8 v;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 malleability check: s in lower half order
        // secp256k1n/2 = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0
        if (uint256(s) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0) {
            revert InvalidSignatureS();
        }
        if (v != 27 && v != 28) revert InvalidSignatureV();

        address signer = ecrecover(digest, v, r, s);
        return signer;
    }
}
