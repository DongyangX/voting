import * as anchor from "@coral-xyz/anchor";
import { BN, Program, utils } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { PublicKey } from "@solana/web3.js";

describe("voting", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Voting as Program<Voting>;

  it("Is initialized!", async () => {
    const poll1 = {
      title: "title1",
      image: "image",
      description: "description",
      startsAt: new BN(1756734278),
      endsAt: new BN(1756735278),
    };

    const [PDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(poll1.title), provider.wallet.publicKey.toBuffer()],
      new PublicKey(program.programId)
    );
    let tx = await program.methods
      .createPoll(
        poll1.title,
        poll1.image,
        poll1.description,
        new BN(1756734278),
        new BN(1756735278)
      )
      .rpc();
    console.log("Your transaction signature1", tx);

    const poll2 = {
      title: "title2",
      image: "image",
      description: "description",
      startsAt: new BN(1756734278),
      endsAt: new BN(1756735278),
    };

    const [PDA2] = PublicKey.findProgramAddressSync(
      [
        utils.bytes.utf8.encode(poll2.title),
        provider.wallet.publicKey.toBuffer(),
      ],
      new PublicKey(program.programId)
    );
    tx = await program.methods
      .createPoll(
        poll2.title,
        poll2.image,
        poll2.description,
        new BN(1756734278),
        new BN(1756735278)
      )
      .rpc();
    console.log("Your transaction signature2", tx);

    let polls = await provider.connection.getProgramAccounts(program.programId);

    polls.map(async (poll) => {
      let realPoll = await program.account.poll.fetch(poll.pubkey);
      console.log(realPoll);
    });
  });
});
