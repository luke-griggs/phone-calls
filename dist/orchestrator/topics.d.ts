/**
 * Topic configurations for agent-on-agent phone conversations
 * Each topic defines the prompts for both Agent A (caller) and Agent B (receiver)
 */
export interface TopicConfig {
    topic: string;
    promptA: string;
    promptB: string;
    firstMessageA?: string;
    firstMessageB?: string;
    description?: string;
    category?: string;
}
export declare const topics: TopicConfig[];
export declare const categories: readonly ["customer_service", "sales", "healthcare", "hospitality", "professional", "tech_support", "government", "utilities", "services", "education", "financial"];
export type TopicCategory = typeof categories[number];
export declare function getTopicsByCategory(category: TopicCategory): TopicConfig[];
export declare function getRandomTopics(count: number): TopicConfig[];
//# sourceMappingURL=topics.d.ts.map