// Deno runtime type declarations for Supabase Edge Functions
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}

// Simplified Puppeteer declaration for Deno to avoid type conflicts
declare module "https://deno.land/x/puppeteer@16.2.0/mod.ts" {
  export interface LaunchOptions {
    args?: string[];
    headless?: boolean;
    [key: string]: any;
  }

  export interface PDFOptions {
    format?: string;
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    preferCSSPageSize?: boolean;
    displayHeaderFooter?: boolean;
    pageRanges?: string;
    width?: string;
    height?: string;
    [key: string]: any;
  }

  export interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
  }

  export interface Page {
    setContent(html: string, options?: any): Promise<void>;
    pdf(options?: PDFOptions): Promise<Uint8Array>;
    close(): Promise<void>;
  }

  export function launch(options?: LaunchOptions): Promise<Browser>;
}
