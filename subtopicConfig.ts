// Subtopic configuration for different topics
export interface SubtopicConfig {
    name: string;
    color: string;
}

// Source to Pay subtopics
export const SOURCE_TO_PAY_SUBTOPICS: SubtopicConfig[] = [
    { name: 'Need for product or service', color: '#FF6B6B' },
    { name: 'Sourcing and selecting Suppliers', color: '#4ECDC4' },
    { name: 'Creating PO', color: '#FFE66D' },
    { name: 'Receipt of G&S', color: '#95E1D3' },
    { name: 'Managing Invoices', color: '#F38181' },
    { name: 'Processing Payments and Receipt of G&S', color: '#AA96DA' }
];

// Bookkeeping subtopics (placeholder - user will add questions)
export const BOOKKEEPING_SUBTOPICS: SubtopicConfig[] = [
    { name: 'Accounts Payable', color: '#FF6B6B' },
    { name: 'Accounts Receivable', color: '#4ECDC4' },
    { name: 'General Ledger', color: '#FFE66D' },
    { name: 'Bank Reconciliation', color: '#95E1D3' },
    { name: 'Financial Reporting', color: '#F38181' },
    { name: 'Tax Preparation', color: '#AA96DA' }
];

/**
 * Get subtopics for a given topic
 */
export function getSubtopicsForTopic(topic: string): SubtopicConfig[] {
    const normalizedTopic = topic.toLowerCase();

    if (normalizedTopic.includes('source to pay')) {
        return SOURCE_TO_PAY_SUBTOPICS;
    } else if (normalizedTopic.includes('bookkeeping')) {
        return BOOKKEEPING_SUBTOPICS;
    }

    // Default fallback
    return SOURCE_TO_PAY_SUBTOPICS;
}
