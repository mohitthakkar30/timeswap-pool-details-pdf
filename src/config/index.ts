// src/config/index.ts
const development = {
    BASE_URL: 'http://localhost:3000',
    CRON_SECRET: '2f87d1c1-7c3f-4117-8654-c2233bf6fcfd',
    REPORT_SCHEDULE: '0 9 * * *',
    PDF_CONFIG: {
      DIRECTORY: 'reports',
      FILE_PREFIX: 'timeswap-pool-report',
    },
    API: {
      BASE_URL: 'http://api-prod.timeswap.io',
    }
  };
  
  const production = {
    BASE_URL: 'https://your-production-domain.com',
    CRON_SECRET: '2f87d1c1-7c3f-4117-8654-c2233bf6fcfd',
    REPORT_SCHEDULE: '0 9 * * *',
    PDF_CONFIG: {
      DIRECTORY: 'reports',
      FILE_PREFIX: 'timeswap-pool-report',
    },
    API: {
      BASE_URL: 'http://api-prod.timeswap.io',
    }
  };

  export const CONFIG = {
    BASE_URL: 'http://localhost:3000', // Change this to your production URL when deploying
    CRON_SECRET: '2f87d1c1-7c3f-4117-8654-c2233bf6fcfd', // Change this to your secure secret
    REPORT_SCHEDULE: '0 9 * * *', // 9 AM daily
    PDF_CONFIG: {
      DIRECTORY: 'reports',
      FILE_PREFIX: 'timeswap-pool-report',
    },
    API: {
      BASE_URL: 'http://api-prod.timeswap.io',
    }
  };
  
//   export const CONFIG = process.env.NODE_ENV === 'production' ? production : development;