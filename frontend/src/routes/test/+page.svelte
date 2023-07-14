<script lang="ts">
	import { Chess } from "chess.js"

	const chess = new Chess("rnbq2nr/pppp2pp/8/2b5/2PppPP1/1P1BBN2/P5QP/k3K2R w K - 0 1")

	console.log(chess.move({ from: "e1", to: "g1" }))

	$: if (chess.board()) {
		console.log(chess.ascii())
	}
</script>
