export async function getRosterData() {

  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const API_KEY = process.env.GOOGLE_API_KEY;

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?includeGridData=true&key=${API_KEY}`
  );

  const data = await response.json();

  const ignoredSheets = [
    "Archive",
    "Archives",
    "Settings",
    "Config",
    "Instructions"
  ];

  let roster = [];

  data.sheets.forEach(sheet => {

    const sheetName = sheet.properties.title;

    if (ignoredSheets.includes(sheetName)) return;

    const rows =
      sheet.data?.[0]?.rowData || [];

    rows.slice(1).forEach(row => {

      const cells =
        row.values || [];

      const account =
        cells[0]?.formattedValue || "";

      if (!account) return;

      roster.push({
  position:
    cells[0]?.formattedValue || "",

  account:
    cells[1]?.formattedValue || "",

  clan: sheetName,

  townHall:
    cells[3]?.formattedValue || "",

  status:
    cells[4]?.formattedValue || "",

  clanLink:
    cells[5]?.formattedValue || "",

  cwlRank:
    cells[6]?.formattedValue || "",

  season:
    cells[7]?.formattedValue || ""
});

    });

  });

  return roster;
}