export interface Token {
    formatted_name: string;
    address: string;
  }
  
  export interface AmountData {
    token0: number;
    token1: number;
    usd: number;
  }
  
  export interface AggregateData {
    total_amount_lent?: AmountData[];
    total_amount_borrowed?: AmountData[];
    total_liquidity_added?: AmountData[];
    unique_lenders?: number;
    unique_borrowers?: number;
    unique_liquidity_providers?: number;
    txn_count: number;
  }
  
  export interface UserRewards {
    rewards_distributed: number;
    total_rewarded_users: number;
  }
  
  export interface Incentive {
    id: string;
    pool_id: string;
    user_action: string;
    start_time: string;
    end_time: string;
    user_rewards: UserRewards;
  }
  
  export interface PoolInfo {
    pool: string;
    chain: string;
    strike: number;
    maturity: string;
    tvl: string;
    apr: number;
    total_txn_count: number;
    token0: Token;
    token1: Token;
    option_pair: string;
    pool_pair: string;
    volume: number;
    contract_version: string;
    aggregate_lend: AggregateData;
    aggregate_borrow: AggregateData;
    aggregate_liquidity: AggregateData;
    incentives: Incentive[];
  }
  
  export interface ApiResponse {
    pool_info: PoolInfo;
  }