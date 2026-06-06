// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @dev Deploy script for MonadRoyale.
 *
 *  Local:
 *    forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 *
 *  Monad Testnet:
 *    forge script script/Deploy.s.sol \
 *      --rpc-url $RPC_URL \
 *      --private-key $PRIVATE_KEY \
 *      --broadcast \
 *      --verify
 */
import {Script, console} from "forge-std/Script.sol";
import {MonadRoyale} from "../contracts/MonadRoyale.sol";

contract DeployMonadRoyale is Script {
    function run() external returns (MonadRoyale game) {
        // If DEPLOYER env var is set, use it; otherwise fall back to msg.sender (anvil default).
        address deployer = vm.envOr("DEPLOYER", msg.sender);

        vm.startBroadcast();
        game = new MonadRoyale(deployer);
        vm.stopBroadcast();

        console.log("MonadRoyale deployed at :", address(game));
        console.log("Owner                   :", game.owner());
    }
}
