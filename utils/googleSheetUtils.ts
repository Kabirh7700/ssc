
export const getExportUrlFromGoogleSheetUrl = (url: string): string | null => {
    // Check if it's already a direct CSV export or published link
    if (url.includes('/export?format=csv') || url.includes('pub?output=csv')) {
        return url; 
    }

    // Standard Google Sheet URL format: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit#gid={GID}
    // Or: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit (implies gid=0)
    // Or: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/
    
    const sheetIdRegex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const gidRegex = /[#&?]gid=([0-9]+)/;

    const sheetIdMatch = url.match(sheetIdRegex);
    const gidMatch = url.match(gidRegex);

    if (sheetIdMatch && sheetIdMatch[1]) {
        const sheetId = sheetIdMatch[1];
        const gid = (gidMatch && gidMatch[1]) ? gidMatch[1] : '0'; // Default to GID 0 (first sheet) if not specified
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
    
    // If no specific sheet ID pattern is found, return null
    return null; 
};
