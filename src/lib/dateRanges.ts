/**
 * Date range utilities for ranking types
 * 
 * - Recent: Last 12 months (approximately last 1-2 years of content)
 * - Historical: From month 13 to 250 months ago (approximately 1-21 years old)
 * 
 * Note: Uses a reference year that can be set based on the most recent content
 * in the database, to handle cases where the database doesn't have current year data.
 */

// Reference year for calculations - should match the most recent content in DB
// This can be updated when newer content is added
const REFERENCE_YEAR = 2023;
const REFERENCE_MONTH = 12; // December

export function getYearRangesForRankingType(rankingType: "historical" | "recent") {
  // Use reference date instead of current date to match available data
  const referenceDate = new Date(REFERENCE_YEAR, REFERENCE_MONTH - 1, 1);

  if (rankingType === "recent") {
    // Recent: last 12 months from reference date
    // This includes the reference year and potentially the previous year
    const minYear = REFERENCE_MONTH === 12 ? REFERENCE_YEAR : REFERENCE_YEAR - 1;
    return {
      minYear,
      maxYear: REFERENCE_YEAR,
    };
  } else {
    // Historical: from month 13 to 250 months ago from reference date
    
    // Calculate year for 13 months ago from reference
    const months13Ago = new Date(referenceDate);
    months13Ago.setMonth(months13Ago.getMonth() - 13);
    const maxYearHistorical = months13Ago.getFullYear();

    // Calculate year for 250 months ago from reference
    const months250Ago = new Date(referenceDate);
    months250Ago.setMonth(months250Ago.getMonth() - 250);
    const minYearHistorical = months250Ago.getFullYear();

    return {
      minYear: minYearHistorical,
      maxYear: maxYearHistorical,
    };
  }
}
