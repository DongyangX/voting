import { store } from '@/store'
import * as anchor from "@coral-xyz/anchor";
import { globalActions } from '@/store/globalSlices'
import { Voting } from "../anchor/voting";
import Idl from '../anchor/voting.json';
import { ContestantStruct, PollParams, PollStruct, TruncateParams } from '@/utils/types'
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { BN } from '@coral-xyz/anchor';

const { setWallet, setPolls, setPoll, setContestants, setCurrentUser } = globalActions

const getProgram = (connection, wallet) : anchor.Program<Voting> => {
  let program : anchor.Program<Voting>;
  let provider: anchor.AnchorProvider;
  if (wallet) {
    // Create a provider with the wallet for transaction signing
    provider = new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    })
    program = new anchor.Program<Voting>(Idl, provider)
  } else {
    // Create program with just connection for read-only operations
    program = new anchor.Program<Voting>(Idl, { connection })
  }
  return program
}

const connectWallet = async () => {

}

const checkWallet = async () => {

}

const createPoll = async (program: anchor.Program<Voting>, data: PollParams) => {
  try { 
    const { title, image, description, startsAt, endsAt } = data
    
    // Find PDA
    let publicKey = program.provider.wallet?.publicKey
    const [PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(title),
        publicKey ? publicKey.toBuffer() : Buffer.from("")
      ],
      new PublicKey(program.programId)
    )
    const tx = await program.methods
      .createPoll(title, image, description, new BN(startsAt), new BN(endsAt))
      .rpc()

    const polls = await getPolls(program)
    store.dispatch(setPolls(polls))
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const updatePoll = async (program: anchor.Program<Voting>, id: string, data: PollParams) => {
  try {
    const { title, image, description, startsAt, endsAt } = data
    
    // Find PDA
    let publicKey = program.provider.wallet?.publicKey
    const [PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(title),
        publicKey ? publicKey.toBuffer() : Buffer.from("")
      ],
      new PublicKey(program.programId)
    )
    const tx = await program.methods
      .updatePoll(title, image, description, new BN(startsAt), new BN(endsAt))
      .rpc()

    const poll = await getPoll(program, id)
    store.dispatch(setPoll(poll))
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const deletePoll = async (program: anchor.Program<Voting>, title: string) => {
  try {
    // Find PDA
    let publicKey = program.provider.wallet?.publicKey
    const [PDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(title),
        publicKey ? publicKey.toBuffer() : Buffer.from("")
      ],
      new PublicKey(program.programId)
    )
    const tx = await program.methods
      .deletePoll(title)
      .rpc()

    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const contestPoll = async (program: anchor.Program<Voting>, id: string, name: string, image: string) => {
  try {

    console.log(id)
    
    const tx = await program.methods.contest(name, image)
      .accounts({
        poll: id
      })
      .rpc()

    const poll = await getPoll(program, id)
    store.dispatch(setPoll(poll))

    const contestants = poll.contestants
    store.dispatch(setContestants(contestants))
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const voteCandidate = async (program: anchor.Program<Voting>, id: string, cid: number) => {
  try {
    const tx = await program.methods.vote(new BN(cid))
      .accounts({
        poll: id
      })
      .rpc()

    const poll = await getPoll(program, id)
    store.dispatch(setPoll(poll))

    const contestants = poll.contestants
    store.dispatch(setContestants(contestants))
    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}

const getPolls = async (program: anchor.Program<Voting>): Promise<PollStruct[]> => {
  return Promise.all(
    (await program.provider.connection.getProgramAccounts(program.programId)).map(
      async (poll: any) => ({
        ...(await program.account.poll.fetch(poll.pubkey)),
        id: poll.pubkey.toString()
      })
    )
  ).then((polls) => {
    return structurePolls(polls);
  }).catch((error) => {
    return structurePolls([]);
  });
}

const getPoll = async (program: anchor.Program<Voting>, id: string): Promise<PollStruct> => {
  let detail = await program.account.poll.fetch(id)
  let poll = {...detail, id: id}
  return structurePolls([poll])[0]
}

const getContestants = async (program: anchor.Program<Voting>, id: string): Promise<ContestantStruct[]> => {
  // const program = await getProgram()
  // const contestants = await program.getContestants(id)
  // return structureContestants(contestants)
  return structureContestants([])
}

const truncate = ({ text, startChars, endChars, maxLength }: TruncateParams): string => {
  if (text.length > maxLength) {
    let start = text.substring(0, startChars)
    let end = text.substring(text.length - endChars, text.length)
    while (start.length + end.length < maxLength) {
      start = start + '.'
    }
    return start + end
  }
  return text
}

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const dayOfWeek = daysOfWeek[date.getUTCDay()]
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  return `${dayOfWeek}, ${month} ${day}, ${year}`
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const structurePolls = (polls: any[]): PollStruct[] =>
  polls
    .map((poll) => ({
      id: poll.id.toString(),
      image: poll.image,
      title: poll.title,
      description: poll.description,
      votes: Number(poll.votes),
      contestants: structureContestants(poll.contestants),
      deleted: poll.deleted,
      director: poll.director.toString(),
      startsAt: Number(poll.startsAt),
      endsAt: Number(poll.endsAt),
      timestamp: Number(poll.timestamp),
      voters: poll.voters.map((voter: PublicKey) => voter.toString()),
      avatars: poll.avatars ? poll.avatars : [],
    }))
    .sort((a, b) => b.timestamp - a.timestamp)

const structureContestants = (contestants: any[]): ContestantStruct[] =>
  contestants
    .map((contestant) => ({
      id: new BN(contestant.id),
      image: contestant.image,
      name: contestant.name,
      voter: contestant.voter.toString(),
      votes: Number(contestant.votes),
      voters: contestant.voters.map((voter: PublicKey) => voter.toString()),
    }))
    .sort((a, b) => b.votes - a.votes)

export {
  connectWallet,
  checkWallet,
  truncate,
  formatDate,
  formatTimestamp,
  createPoll,
  updatePoll,
  deletePoll,
  getPolls,
  getPoll,
  contestPoll,
  getContestants,
  voteCandidate,
  getProgram
}
