use anchor_lang::prelude::*;

declare_id!("7QoZZmaVZe34vaydFsUhTQeUJivQfSPHrbBwzrmR4BHw");

#[program]
pub mod voting {

    use super::*;

    pub fn create_poll(
        ctx: Context<InitializePoll>,
        title: String,
        image: String,
        description: String,
        starts_at: i64,
        ends_at: i64
    ) -> Result<()> {

        msg!("Poll Account Create...{}", title);

        let poll = &mut ctx.accounts.poll;
        poll.title = title;
        poll.image = image;
        poll.description = description;
        poll.starts_at = starts_at;
        poll.ends_at = ends_at;

        poll.director = *ctx.accounts.payer.key;
        poll.timestamp = Clock::get().unwrap().unix_timestamp;
        poll.contestants = Vec::new();

        Ok(())
    }

    pub fn update_poll(
        ctx: Context<UpdatePoll>,
        title: String,
        image: String,
        description: String,
        starts_at: i64,
        ends_at: i64) -> Result<()> {

        msg!("Poll Account Update...{}", title);
        
        let poll = &mut ctx.accounts.poll;
        poll.title = title;
        poll.image = image;
        poll.description = description;
        poll.starts_at = starts_at;
        poll.ends_at = ends_at;

        Ok(())
    }

    pub fn delete_poll(_ctx: Context<DeletePoll>, title: String) -> Result<()> {
        msg!("Poll Account Delete...{}", title);
        Ok(())
    }

    pub fn contest(ctx: Context<Contest>, name: String, image: String) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        let index = poll.contestants.len();

        let contestant = Contestant {
            id: index as i64,
            name: name,
            image: image,
            voter: *ctx.accounts.payer.key,
            votes: 0,
            voters: Vec::new(),
        };

        poll.contestants.push(contestant);

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, cid: u64) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.votes += 1;
        poll.voters.push(*ctx.accounts.payer.key);

        let ucid = cid as usize;
        if let Some(contestant) = poll.contestants.get_mut(ucid) {
            let mut cc = contestant.clone();
            cc.votes += 1;
            cc.voters.push(*ctx.accounts.payer.key);
            *contestant = cc;
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        space = 9000,
        payer = payer,
        seeds = [title.as_bytes(), payer.key().as_ref()],
        bump,
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdatePoll<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), payer.key().as_ref()],
        bump,
        realloc = 9000,
        realloc::payer = payer,
        realloc::zero = true,
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeletePoll<'info> {
    #[account(
        mut,
        seeds = [title.as_bytes(), payer.key().as_ref()],
        bump,
        close = payer
    )]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct Contest<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub poll: Account<'info, Poll>,
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[account]
pub struct Poll {
    pub id: u64,
    pub image: String,
    pub title: String,
    pub description: String,
    pub votes: u64,
    pub voters: Vec<Pubkey>,
    pub deleted: bool,
    pub director: Pubkey,
    pub starts_at: i64,
    pub ends_at: i64,
    pub timestamp: i64,
    pub contestants: Vec<Contestant>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Contestant {
    pub id: i64,
    pub image: String,
    pub name: String,
    pub voter: Pubkey,
    pub votes: u64,
    pub voters: Vec<Pubkey>,
}
