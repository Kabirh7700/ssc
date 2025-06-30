
export const parseCSVFromString = (csvString: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let inQuotedField = false;
  let fieldBuffer = '';

  for (let i = 0; i < csvString.length; i++) {
    const char = csvString[i];

    if (char === '"') {
      if (inQuotedField && i + 1 < csvString.length && csvString[i + 1] === '"') {
        // Handle escaped quote ""
        fieldBuffer += '"';
        i++; // Skip next quote
      } else {
        inQuotedField = !inQuotedField;
      }
    } else if (char === ',' && !inQuotedField) {
      currentRow.push(fieldBuffer);
      fieldBuffer = '';
    } else if ((char === '\n' || char === '\r') && !inQuotedField) {
      // Handle CRLF and LF line endings
      if (char === '\r' && i + 1 < csvString.length && csvString[i + 1] === '\n') {
        i++; // Skip LF if CRLF
      }
      // Only add row if it has content or is not the very first (potentially empty) processed line
      if (fieldBuffer.length > 0 || currentRow.length > 0) {
          currentRow.push(fieldBuffer);
          rows.push(currentRow);
      }
      currentRow = [];
      fieldBuffer = '';
    } else {
      fieldBuffer += char;
    }
  }

  // Add the last field and row
  currentRow.push(fieldBuffer);
  if (currentRow.length > 0 || fieldBuffer.length > 0) { // Ensure last row isn't empty unless it's the only one
      rows.push(currentRow);
  }
  
  // Filter out completely empty rows that might result from trailing newlines
  return rows.filter(row => row.length > 1 || (row.length === 1 && row[0].trim() !== ''));
};


export const downloadCSVString = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { // feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers (e.g., IE)
    // This part is more complex and might not be fully supported without further libraries for old IE
    alert("CSV download is not fully supported in this browser. Please try a modern browser.");
  }
};
