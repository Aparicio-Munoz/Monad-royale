// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {MonadRoyale} from "../contracts/MonadRoyale.sol";

contract MonadRoyaleTest is Test {
    MonadRoyale public game;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob   = makeAddr("bob");
    address carol = makeAddr("carol");

    event PlayerJoined(address indexed player);
    event PlayerEliminated(address indexed player);
    event WinnerDeclared(address indexed winner);

    function setUp() public {
        game = new MonadRoyale(owner);
    }

    // ─── joinGame ────────────────────────────────────────────────────────────────

    function test_joinGame_emitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit PlayerJoined(alice);
        vm.prank(alice);
        game.joinGame();
    }

    function test_joinGame_updatesState() public {
        vm.prank(alice);
        game.joinGame();

        assertTrue(game.hasJoined(alice));
        assertTrue(game.isAlive(alice));
        assertEq(game.getAlivePlayers().length, 1);
        assertEq(game.getAlivePlayers()[0], alice);
    }

    function test_joinGame_multiplePlayers() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(carol); game.joinGame();

        assertEq(game.getAlivePlayers().length, 3);
    }

    function test_joinGame_revert_alreadyJoined() public {
        vm.prank(alice); game.joinGame();

        vm.expectRevert(MonadRoyale.AlreadyJoined.selector);
        vm.prank(alice); game.joinGame();
    }

    function test_joinGame_revert_afterGameOver() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(owner); game.eliminatePlayer(alice); // bob wins

        vm.expectRevert(MonadRoyale.GameOver.selector);
        vm.prank(carol); game.joinGame();
    }

    // ─── eliminatePlayer ─────────────────────────────────────────────────────────

    function test_eliminate_updatesState() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();

        vm.prank(owner); game.eliminatePlayer(alice);

        assertFalse(game.isAlive(alice));
        assertTrue(game.isEliminated(alice));
        assertEq(game.getAlivePlayers().length, 1);
        assertEq(game.getEliminatedPlayers().length, 1);
    }

    function test_eliminate_emitsEvent() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(carol); game.joinGame(); // 3 players so no winner is declared yet

        vm.expectEmit(true, false, false, false);
        emit PlayerEliminated(alice);
        vm.prank(owner); game.eliminatePlayer(alice);
    }

    function test_eliminate_revert_notOwner() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();

        vm.expectRevert(MonadRoyale.NotOwner.selector);
        vm.prank(alice); game.eliminatePlayer(bob);
    }

    function test_eliminate_revert_playerNotAlive() public {
        vm.expectRevert(MonadRoyale.PlayerNotAlive.selector);
        vm.prank(owner); game.eliminatePlayer(carol);
    }

    function test_eliminate_revert_alreadyEliminated() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(carol); game.joinGame();

        vm.prank(owner); game.eliminatePlayer(alice);

        vm.expectRevert(MonadRoyale.AlreadyEliminated.selector);
        vm.prank(owner); game.eliminatePlayer(alice);
    }

    function test_eliminate_revert_afterGameOver() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(owner); game.eliminatePlayer(alice); // game over

        vm.expectRevert(MonadRoyale.GameOver.selector);
        vm.prank(owner); game.eliminatePlayer(bob);
    }

    // ─── Winner logic ─────────────────────────────────────────────────────────────

    function test_winner_declaredWhenOneLeft() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();

        vm.expectEmit(true, false, false, false);
        emit WinnerDeclared(bob);
        vm.prank(owner); game.eliminatePlayer(alice);

        assertEq(game.getWinner(), bob);
    }

    function test_winner_noWinnerWithMultiplePlayers() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(carol); game.joinGame();

        vm.prank(owner); game.eliminatePlayer(alice);

        assertEq(game.getWinner(), address(0));
    }

    function test_winner_fullGameThreePlayers() public {
        vm.prank(alice); game.joinGame();
        vm.prank(bob);   game.joinGame();
        vm.prank(carol); game.joinGame();

        vm.prank(owner); game.eliminatePlayer(bob);
        vm.prank(owner); game.eliminatePlayer(alice);

        assertEq(game.getWinner(), carol);
        assertEq(game.getAlivePlayers().length, 1);
        assertEq(game.getEliminatedPlayers().length, 2);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────────

    function test_view_initialState() public view {
        assertEq(game.getAlivePlayers().length, 0);
        assertEq(game.getEliminatedPlayers().length, 0);
        assertEq(game.getWinner(), address(0));
    }

    function test_ownerSetInConstructor() public view {
        assertEq(game.owner(), owner);
    }
}
