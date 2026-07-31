/** How every entry point asks for the Ask AI window. */
export interface AiLaunchOptions {
  /** Send the prompt straight away rather than leaving it to be edited. */
  submit?: boolean;
  /** Open directly into push-to-talk. */
  listening?: boolean;
}

export type AiLaunch = (prompt?: string, options?: AiLaunchOptions) => void;
