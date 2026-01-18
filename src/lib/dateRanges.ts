/**
 * Date range utilities for ranking types
 * 
 * - Recent: Last 12 months from current date
 * - Historical: From month 13 to 250 months ago
 */

export function getYearRangesForRankingType(rankingType: "historical" | "recent") {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  if (rankingType === "recent") {
    // Recent: last 12 months
    // If we're in month M of year Y, the last 12 months includes:
    // - All of current year
    // - Possibly part of previous year (if M < 12)
    const minYear = currentMonth === 12 ? currentYear : currentYear - 1;
    return {
      minYear,
      maxYear: currentYear,
    };
  } else {
    // Historical: from month 13 to 250 months ago
    // Month 13 ago = start of historical
    // Month 250 ago = end of historical (oldest)
    
    // Calculate year for 13 months ago
    const months13Ago = new Date(now);
    months13Ago.setMonth(months13Ago.getMonth() - 13);
    const maxYearHistorical = months13Ago.getFullYear();

    // Calculate year for 250 months ago
    const months250Ago = new Date(now);
    months250Ago.setMonth(months250Ago.getMonth() - 250);
    const minYearHistorical = months250Ago.getFullYear();

    return {
      minYear: minYearHistorical,
      maxYear: maxYearHistorical,
    };
  }
}
