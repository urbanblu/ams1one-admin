export interface ITodaySales {
  date: string;
  total_sales: number;
  ticket_count: number;
  currency: string;
}

export interface IDetailedTicketStakeWriter {
  id: string;
  name: string;
  phone: string;
}

export interface IDetailedTicketStakeGame {
  id: string;
  name: string;
  code: string;
}

export interface IDetailedTicketStake {
  stake_id: string;
  created_at: string;
  game: IDetailedTicketStakeGame;
  event_id: number;
  event: string;
  play_group: string;
  play: string;
  numbers: string;
  stake_amount: string;
  original_numbers: string;
  player_phone: string;
  stake_status: string;
  writer: IDetailedTicketStakeWriter;
}

export interface IDetailedTicket {
  ticket_no: string;
  time: string;
  total_stake_amount: string;
  total_stake: number;
  play_group: string;
  writer_name: string;
  stakes: IDetailedTicketStake[];
}

export interface IPaginatedDetailedTicketsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: IDetailedTicket[];
}

export interface ITodayWins {
  date: string;
  total_win_amount: number;
  unique_players: number;
  currency: string;
}

export interface ITodayClaims {
  date: string;
  total_claims: number;
  claims_withdrawn: number;
  currency: string;
}

export interface IWinningEvent {
  event_id: number;
  event_name: string;
  event_no: number;
  winning_numbers: number[];
  game_type?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface IWinningEventsResponse {
  date: string;
  events: IWinningEvent[];
}

export interface IWinnerRow {
  numbers_staked: number[][];
  win_amount: number;
  player_phone: string;
  writer_name: string;
  event_name: string;
  event_no: number;
}

export interface IWinnersListResponse {
  date: string;
  winners: IWinnerRow[];
}

/** One ticket reduced to what a time series needs: when, and how much. */
export interface ITicketTimePoint {
  /** The server's `sold_at`, as the detailed list reports it. */
  time: string;
  amount: number;
}

/**
 * Today's tickets swept out of the paginated detailed list, stripped down to
 * timestamps and amounts.
 *
 * `complete` is false when the sweep hit its page cap before the day ran out.
 * The points then cover the most recent stretch of the day rather than all of
 * it, so anything drawn from them has to say so.
 */
export interface ITodayTicketTimeline {
  points: ITicketTimePoint[];
  /** Tickets the server counted for today. */
  totalCount: number;
  /** Tickets the sweep actually brought back. */
  fetchedCount: number;
  complete: boolean;
}
