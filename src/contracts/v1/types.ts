
/**
 * QUESTIONS
 *
 
 */


/**
 * contracts/v1/types.ts
 *
 * These are TypeScript "types" that describe the exact JSON shapes
 * your MCP tools will return.
 *
 * Types do NOT run at runtime. They help your editor catch mistakes.
 */

/**
 * The stacks this server can serve: "web/react", "ios/swiftui", and
 * "android/compose". This type ensures we don't accidentally pass
 * "web/raect" (typo) etc.
 *
 * Being listed here does NOT mean a stack ships content. A stack is only
 * populated if the bundled corpus/<stack>/ directory exists in this release,
 * which depends on what the corpus sync copied in. "android/compose" is
 * reserved and currently empty upstream.
 */
export type StackRef = "web/react" | "ios/swiftui" | "android/compose";

/**
 * A scope bucket tagging where a Foundations rule binds during a code change.
 *
 * The vocabulary is PER STACK, not global, because the buckets describe the
 * platform's own structure. web/react uses utility, style, component, layout,
 * page. ios/swiftui uses control, layout, component — it has no "page", and it
 * needs "control", which the web set has no word for. Each stack declares its
 * own set in its global_rules.md frontmatter under apply_policy.scopes_in_order,
 * and that declaration is authoritative.
 *
 * So this stays an open string rather than a union. A closed list here would
 * mean every new stack needs a server release before its Foundations could be
 * served at all — which is exactly what happened: ios/swiftui returned
 * INTERNAL_ERROR on get_foundations because "control" was not in the hardcoded
 * set. The corpus is the source of truth for its own vocabulary; this server
 * serves what the corpus declares.
 */
export type RuleScope = string;

/**
 * Optional targeting metadata describing which UI contexts
 * a rule or pattern is meant to cover.
 * - roles: ARIA/semantic roles (e.g. "button", "dialog")
 * - controls: concrete control types (e.g. "text input", "combobox")
 * - surfaces: larger UI regions (e.g. "modal", "navigation", "form")
 */
export type AppliesTo = {
  roles: string[];
  controls: string[];
  surfaces: string[];
};

/**
 * Common caching metadata added to every response.
 * - catalog_revision: a fingerprint (hash) of the repo state
 * - cache_ttl_seconds: how long clients can cache this response
 */
export type CacheMeta = {
  catalog_revision: string;
  cache_ttl_seconds: number;
};

/**
 * The allowed values for pattern status.
 * If a file says "betaa", TypeScript will complain (good!).
 */
export type PatternStatus = "alpha" | "beta" | "stable" | "deprecated";

/**
 * Optional execution guidance for clients consuming global rules.
 * - instruction: natural-language direction for how to apply the rules
 * - scopes_in_order: preferred precedence order for rule scopes
 */
export type ApplyPolicy = {
  instruction?: string;
  scopes_in_order?: RuleScope[];
};

/**
 * Metadata for get_global_rules() responses.
 * This describes the rule set identity, lifecycle status, and caching/apply hints.
 */
export type GlobalRulesMeta = {
  id: string;
  stack: StackRef;
  rule_set?: string;
  status?: PatternStatus;
  summary?: string;
  cache_ttl_seconds?: number;
  apply_policy?: ApplyPolicy;
};

export type CodeSnippet = {
  language: string; // e.g. "css", "tsx", "yaml"
  code: string;
};

export type GlobalRule = {
  id: string; // from the YAML fence inside the rule
  title: string; // from "## Rule: Page Title"
  scope: RuleScope[]; // from YAML: scope: [page, layout]
  must_haves: string[];
  donts: string[];
  acceptance_checks: string[];
  snippets?: CodeSnippet[];
};

/**
 * Lightweight "when to use it" preview shown in list_patterns().
 * This helps clients quickly understand what each component is for
 * without loading the full pattern detail.
 */
export type SelectionExcerpt = {
  use_when: string[];
  do_not_use_when: string[];
};

/**
 * This is the SMALL pattern object returned from list_patterns().
 * It's intentionally tiny so the assistant can scan many patterns quickly.
 */
export type PatternSummary = {
  id: string;
  stack: StackRef;
  status: PatternStatus;
  summary: string;
  tags: string[];
  aliases: string[];
  selection_excerpt?: SelectionExcerpt;
  primary_scope?: RuleScope;
  applies_to?: AppliesTo;
};

/**
 * These are the structured sections we want to extract from each .md file.
 * This makes the content deterministic for AI consumption.
 */
export type PatternSections = {
    use_when: string[];
    do_not_use_when: string[];
    must_haves: string[];
    customizable: string[];
    donts: string[];
    golden_pattern: string | null;
    acceptance_checks: string[];
};

/**
 * The FULL pattern object returned from get_pattern(id).
 * It includes everything from PatternSummary plus the sections.
 */
export type PatternDetail = PatternSummary & {
  sections: PatternSections;

  /**
   * Optional: helpful debug info.
   * We can include this now or add it later—your call.
   */
  source?: {
    relative_path: string;
  };
};

/**
 * Each MCP tool response includes:
 * - contract_version: helps you evolve the API later (v2, v3...)
 * - stack (where applicable)
 * - CacheMeta
 *
 * These 3 types represent the EXACT JSON returned by each tool.
 */

export type GetGlobalRulesResponse = CacheMeta & {
  contract_version: "1.0";
  stack: StackRef;
  meta: GlobalRulesMeta;
  rules: {
    scope_filter?: RuleScope[] | null;
    items: GlobalRule[];
  }
};

export type ListPatternsResponse = CacheMeta & {
  contract_version: "1.0";
  stack: StackRef;
  count: number;
  patterns: PatternSummary[];
};

export type GetPatternResponse = CacheMeta & {
  contract_version: "1.0";
  pattern: PatternDetail;
};

/**
 * Standard error shape (optional but recommended).
 * If something goes wrong, return this in a consistent format.
 */
export type ToolError = {
  code: string; // e.g. "PATTERN_NOT_FOUND"
  message: string;
  details?: Record<string, unknown>;
};
