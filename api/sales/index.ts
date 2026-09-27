import Axios from "@/api";
import {
  ITodayClaims,
  IDetailedTicket,
  IPaginatedDetailedTicketsResponse,
  ITodaySales,
  ITodayTicketTimeline,
  ITodayWins,
  IWinningEventsResponse,
  IWinnersListResponse,
} from "@/interfaces/sales.interface";
import { handleApiError } from "@/utils/api_error";
import { parseStakeAmount } from "@/utils/currency";

/**
 * How the intraday sweep is bounded.
 *
 * The detailed list is the only endpoint that reports today's sales with a
 * timestamp on each one, and it is paginated, so a chart of the day has to
 * walk it. `SWEEP_PAGE_SIZE` is a compromise: large enough that an ordinary
 * day is one or two requests, small enough that a single response stays a
 * few hundred KB with its nested stakes. `SWEEP_MAX_PAGES` is the ceiling
 * that stops a record day from turning a page load into a download.
 */
const SWEEP_PAGE_SIZE = 250;
const SWEEP_MAX_PAGES = 12;
/* Pages after the first go out in batches rather than all at once — twelve
   simultaneous sockets is not a favour to anyone. */
const SWEEP_BATCH = 4;

export type DetailedTicketsParams = {
  status?: string;
  ticket_no?: string;
  player_phone?: string;
  page?: number;
  page_size?: number;
};

class SalesService {
  static fetchTodaySales = async (): Promise<ITodaySales> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/tickets/today_sales/`,
        method: "GET",
      });
      return response.data as ITodaySales;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  static fetchDetailedTickets = async (
    params?: DetailedTicketsParams,
  ): Promise<IPaginatedDetailedTicketsResponse> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/tickets/detailed-list/`,
        method: "GET",
        params,
      });

      return response.data as IPaginatedDetailedTicketsResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  /**
   * Today's tickets as a time series — every ticket's timestamp and amount,
   * swept out of the paginated detailed list.
   *
   * The server has no per-hour sales endpoint, so the shape of a trading day
   * has to be reconstructed from the tickets themselves. The sweep asks for
   * page one, reads how many tickets the server says today holds, and pulls
   * the rest in batches up to a cap. Past the cap it stops and says so
   * through `complete` rather than quietly drawing a partial day as a whole
   * one.
   */
  static fetchTodayTicketTimeline = async (): Promise<ITodayTicketTimeline> => {
    try {
      const first = await SalesService.fetchDetailedTickets({
        page: 1,
        page_size: SWEEP_PAGE_SIZE,
      });

      const totalCount = first.count ?? first.results.length;
      const collected: IDetailedTicket[] = [...first.results];

      /* The server may cap `page_size` below what was asked for, so the real
         page size is whatever came back — but only when page one was actually
         full. A short first page on a quiet day is the whole day, not a cap. */
      const grantedPageSize =
        first.results.length > 0 && first.results.length < totalCount
          ? first.results.length
          : 0;

      if (grantedPageSize > 0) {
        const totalPages = Math.ceil(totalCount / grantedPageSize);
        const lastPage = Math.min(totalPages, SWEEP_MAX_PAGES);

        for (let page = 2; page <= lastPage; page += SWEEP_BATCH) {
          const batch: number[] = [];
          for (let p = page; p < page + SWEEP_BATCH && p <= lastPage; p += 1) {
            batch.push(p);
          }

          const responses = await Promise.all(
            batch.map((p) =>
              SalesService.fetchDetailedTickets({
                page: p,
                page_size: grantedPageSize,
              }),
            ),
          );

          for (const response of responses) {
            collected.push(...response.results);
          }
        }
      }

      return {
        points: collected.map((ticket) => ({
          time: ticket.time,
          amount: parseStakeAmount(ticket.total_stake_amount),
        })),
        totalCount,
        fetchedCount: collected.length,
        complete: collected.length >= totalCount,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  };

  static fetchTodayWins = async (): Promise<ITodayWins> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/wins/today-wins/`,
        method: "GET",
      });
      return response.data as ITodayWins;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  static fetchTodayClaims = async (): Promise<ITodayClaims> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/wins/today-claims/`,
        method: "GET",
      });
      return response.data as ITodayClaims;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  static fetchWinningEvents = async (
    date?: string,
  ): Promise<IWinningEventsResponse> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/wins/winning-events/`,
        method: "GET",
        params: date ? { date } : undefined,
      });

      return response.data as IWinningEventsResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  };

  static fetchWinnersList = async (
    date?: string,
  ): Promise<IWinnersListResponse> => {
    try {
      const response = await Axios({
        url: `/api/v1/sales/wins/winners-list/`,
        method: "GET",
        params: date ? { date } : undefined,
      });
      return response.data as IWinnersListResponse;
    } catch (error) {
      throw handleApiError(error);
    }
  };
}

export default SalesService;
